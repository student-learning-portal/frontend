import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.token;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.fullName = token.fullName as string;
            session.user.role = token.role as 'teacher' | 'student';
            session.accessToken = token.accessToken as string;
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            console.log('authorized', nextUrl.pathname);
            const isLoggedIn = !!auth?.user;
            const isNotPublicRoute =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/catalog');

            if (isNotPublicRoute) {
                return isLoggedIn;
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },

    providers: [],
} satisfies NextAuthConfig;
