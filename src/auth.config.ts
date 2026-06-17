import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            console.log('authorized', nextUrl.pathname);
            const isLoggedIn = !!auth?.user;
            const isNotPublicRoute =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/catalog');

            console.log(isNotPublicRoute);
            console.log(isLoggedIn);
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
