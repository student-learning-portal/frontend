import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface User {
        fullName: string;
        role: 'teacher' | 'student';
        token: string;
    }

    interface Session {
        user: DefaultSession['user'] & {
            id: string;
            fullName: string;
            role: 'teacher' | 'student';
        };
        accessToken: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        fullName: string;
        role: 'teacher' | 'student';
        accessToken: string;
    }
}
