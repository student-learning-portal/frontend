import type { NextAuthConfig } from 'next-auth';
import { fetchTeacherStatus } from '@/lib/api/auth';
import { isAwaitingApproval, roleHome } from '@/lib/roles';
import type { TeacherStatus, UserRole } from '@/models/User';

// Settings is the one dashboard page every role shares (name, email, password),
// so the role-specific redirects below deliberately leave it alone.
const SHARED_ROUTES = ['/dashboard/settings'];

function isShared(pathname: string): boolean {
    return SHARED_ROUTES.some((route) => pathname.startsWith(route));
}

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.token;
                token.id = user.id as string;
                token.fullName = user.fullName;
                token.role = user.role;
                token.teacherStatus = user.teacherStatus;
                return token;
            }

            // A teacher approved (or rejected) after signing in would otherwise
            // keep the stale verdict until their session expired — a whole day
            // of staring at the waiting screen. Re-read the live status from the
            // backend for as long as it isn't settled.
            if (token.role === 'teacher' && token.teacherStatus !== 'approved') {
                const status = await fetchTeacherStatus(
                    token.accessToken as string | undefined,
                );
                if (status) token.teacherStatus = status;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.fullName = token.fullName as string;
            session.user.role = token.role as UserRole;
            session.user.teacherStatus = token.teacherStatus as
                | TeacherStatus
                | undefined;
            session.accessToken = token.accessToken as string;
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role;
            const path = nextUrl.pathname;
            const isProtectedRoute =
                path.startsWith('/dashboard') ||
                path.startsWith('/catalog') ||
                path.startsWith('/course');

            if (!isLoggedIn) {
                // false sends the visitor to the sign-in page (pages.signIn).
                return !isProtectedRoute;
            }

            // The learner-facing catalog/player is meaningless for the roles
            // that never buy a course.
            if (
                (role === 'teacher' || role === 'admin') &&
                (path.startsWith('/catalog') || path.startsWith('/course'))
            ) {
                return Response.redirect(new URL(roleHome(role), nextUrl));
            }

            // The moderation queue belongs to the administrator alone, and the
            // administrator has no use for the rest of the dashboard.
            if (role === 'admin') {
                if (!path.startsWith('/dashboard/admin') && !isShared(path)) {
                    return Response.redirect(
                        new URL('/dashboard/admin', nextUrl),
                    );
                }
                return true;
            }
            if (path.startsWith('/dashboard/admin')) {
                return Response.redirect(new URL(roleHome(role), nextUrl));
            }

            // A teacher whose registration is still in the queue is parked on
            // the waiting screen; everyone else has no business being there.
            if (isAwaitingApproval(role, auth?.user?.teacherStatus)) {
                if (!path.startsWith('/dashboard/pending') && !isShared(path)) {
                    return Response.redirect(
                        new URL('/dashboard/pending', nextUrl),
                    );
                }
                return true;
            }
            if (path.startsWith('/dashboard/pending')) {
                return Response.redirect(new URL(roleHome(role), nextUrl));
            }

            if (!isProtectedRoute) {
                return Response.redirect(new URL(roleHome(role), nextUrl));
            }
            return true;
        },
    },

    providers: [],
} satisfies NextAuthConfig;
