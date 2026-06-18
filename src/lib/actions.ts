'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { registerUser } from '@/lib/api/auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const secondPassword = formData.get('secondPassword') as string;

        if (password !== secondPassword) {
            return 'Пароли не совпадают';
        }

        const response = await registerUser(email, password);

        if (!response?.user) return 'Пользователь уже существует';
    } catch (error) {
        if (error instanceof Error) {
            return error.message;
        }
    }
    await signIn('credentials', formData);
}

export async function handleLogout() {
    await signOut();
}
