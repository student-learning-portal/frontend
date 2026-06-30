'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { registerUser } from '@/lib/api/auth';

export async function logout() {
    await signOut({ redirectTo: '/login' });
}

type AuthState = {
    error: null | string;
    email: string;
};

type RegistrationState = {
    error: null | string;
    fullName: string;
    email: string;
    role: 'student' | 'teacher';
};

export async function authenticate(prevState: AuthState, formData: FormData) {
    const email = String(formData.get('email') ?? '');
    try {
        await signIn('credentials', formData);

        return {
            error: null,
            email,
        };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return {
                        error: 'Неправильно введены данные',
                        email,
                    };
                default:
                    return {
                        error: 'Что-то пошло не так',
                        email,
                    };
            }
        }
        throw error;
    }
}

export async function register(
    prevState: RegistrationState,
    formData: FormData,
) {
    const email = String(formData.get('email') ?? '');
    const fullName = String(formData.get('fullName') ?? '');
    const password = String(formData.get('password') ?? '');
    const secondPassword = String(formData.get('secondPassword') ?? '');
    const role = String(formData.get('role') ?? 'student') as
        | 'student'
        | 'teacher';
    try {
        if (password !== secondPassword) {
            return { error: 'Пароли не совпадают', email, fullName, role };
        }

        const response = await registerUser(email, password, role, fullName);

        if (!response?.user)
            return {
                error: 'Пользователь не существует',
                email,
                fullName,
                role,
            };
        await signIn('credentials', formData);
        return { error: null, email, fullName, role };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return {
                        error: 'Неправильно введены данные',
                        email,
                        fullName,
                        role,
                    };
                default:
                    return {
                        error: 'Что-то пошло не так',
                        email,
                        fullName,
                        role,
                    };
            }
        }
        throw error;
    }
}

export async function handleLogout() {
    await signOut();
}
