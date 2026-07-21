import { TeacherStatus, UserRole } from '@/models/User';
import { translateError } from './apiError';

export type RegisterResult =
    | { ok: true; data: { user?: unknown } }
    | { ok: false; message: string };

type LoginResponse = {
    token: string;
    user: {
        id: string;
        email: string;
        full_name: string;
        role: UserRole;
        // Only present for teachers — see TeacherStatus.
        teacher_status?: TeacherStatus;
    };
};

export async function authorizeUser(
    email: string | undefined,
    password: string | undefined,
): Promise<LoginResponse | null> {
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
    return (await response.json()) as LoginResponse;
}

// fetchTeacherStatus re-reads the caller's approval state from the backend.
// The session token carries the status recorded at sign-in, which goes stale the
// moment an administrator decides on the account; the jwt callback uses this to
// refresh it without forcing the teacher to sign in again. Returns undefined on
// any failure, so a hiccup leaves the known status untouched.
export async function fetchTeacherStatus(
    accessToken: string | undefined,
): Promise<TeacherStatus | undefined> {
    if (!accessToken) return undefined;

    try {
        const response = await fetch(
            `${process.env.BACKEND_URL}/api/v1/auth/me`,
            {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: 'no-store',
            },
        );
        if (!response.ok) return undefined;

        const me = (await response.json()) as {
            teacher_status?: TeacherStatus;
        };
        return me.teacher_status;
    } catch (err) {
        console.error('[fetchTeacherStatus] request failed:', err);
        return undefined;
    }
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
