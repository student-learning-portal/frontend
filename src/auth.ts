import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { authorizeUser } from '@/lib/api/auth';
import { z } from 'zod';
import { User } from '@/models/User';

// The identifier is validated as a non-empty string rather than an email:
// students and teachers sign in with their email, but the administrator account
// is bootstrapped with a plain login ("admin"), which z.email() would reject
// before the request ever reached the backend. The backend remains the single
// source of truth for whether the credentials are valid.
const credentialsSchema = z.object({
    email: z.string().min(3),
    password: z.string().min(6),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials =
                    credentialsSchema.safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const result = await authorizeUser(email, password);
                    if (!result) return null;
                    return {
                        id: result.user.id,
                        email: result.user.email,
                        fullName: result.user.full_name,
                        role: result.user.role,
                        teacherStatus: result.user.teacher_status,
                        token: result.token,
                    } as User;
                }
                return null;
            },
        }),
    ],
});
