import { translateError } from './apiError';

export type RegisterResult =
    | { ok: true; data: { user?: unknown } }
    | { ok: false; message: string };

export async function authorizeUser(
    email: string | undefined,
    password: string | undefined,
) {
    if (!email || !password) {
        return null;
    }

    const response = await fetch(
        `${process.env.BACKEND_URL}/api/v1/auth/login`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        },
    );

    if (!response.ok) {
        return null;
    }
    return await response.json();
}

export async function registerUser(
    email: string | undefined,
    password: string | undefined,
    role: 'teacher' | 'student',
    fullName: string,
): Promise<RegisterResult> {
    if (!email || !password) {
        return { ok: false, message: 'Заполните почту и пароль.' };
    }

    try {
        const response = await fetch(
            `${process.env.BACKEND_URL}/api/v1/auth/register`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    role,
                    full_name: fullName,
                }),
            },
        );

        if (!response.ok) {
            const text = await response.text();
            console.error('Registration failed:', response.status, text);
            return {
                ok: false,
                message: translateError(response.status, text),
            };
        }
        return { ok: true, data: await response.json() };
    } catch (err) {
        console.error('Registration request failed:', err);
        return {
            ok: false,
            message: 'Сервер недоступен. Проверьте подключение.',
        };
    }
}
