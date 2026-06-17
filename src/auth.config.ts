import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            console.log('authorized', nextUrl.pathname);
            const isLoggedIn = !!auth?.user;
            const isPublicRoute = !(
                nextUrl.pathname.startsWith('/login') ||
                nextUrl.pathname.startsWith('/registration')
            );

            if (isPublicRoute) {
                return isLoggedIn;
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
