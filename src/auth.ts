import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { authorizeUser } from '@/lib/api/auth';
import { z } from 'zod';
import { User } from '@/models/User';

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const result = await authorizeUser(email, password);
                    return {
                        id: result.user.id,
                        email: result.user.email,
                        fullName: result.user.full_name,
                        role: result.user.role,
                        token: result.token,
                    } as User;
                }
                return null;
            },
        }),
    ],
});
