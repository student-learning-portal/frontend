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
                        error: 'Неверная почта или пароль.',
                        email,
                    };
                default:
                    return {
                        error: 'Не удалось войти. Попробуйте позже.',
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
            return { error: 'Пароли не совпадают.', email, fullName, role };
        }

        const response = await registerUser(email, password, role, fullName);

        if (!response.ok)
            return {
                error: response.message,
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
                        error: 'Аккаунт создан, но не удалось войти автоматически. Попробуйте войти вручную.',
                        email,
                        fullName,
                        role,
                    };
                default:
                    return {
                        error: 'Не удалось завершить регистрацию. Попробуйте позже.',
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
