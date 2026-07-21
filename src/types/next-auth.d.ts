import { DefaultSession } from 'next-auth';
import { TeacherStatus, UserRole } from '@/models/User';

declare module 'next-auth' {
    interface User {
        fullName: string;
        role: UserRole;
        teacherStatus?: TeacherStatus;
        token: string;
    }

    interface Session {
        user: DefaultSession['user'] & {
            id: string;
            fullName: string;
            role: UserRole;
            teacherStatus?: TeacherStatus;
        };
        accessToken: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        fullName: string;
        role: UserRole;
        teacherStatus?: TeacherStatus;
        accessToken: string;
    }
}
