'use server';

import { auth } from '@/auth';

export type ProfileResult = { ok: true } | { ok: false; message: string };

export type Me = {
    id: string;
    email: string;
    full_name: string;
    role: 'teacher' | 'student';
    avatar_url?: string;
};

export async function getMe(): Promise<Me | null> {
    const session = await auth();
    if (!session?.accessToken) return null;

    const url = `${process.env.BACKEND_URL}/api/v1/auth/me`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error(`[getMe] ${response.status} from ${url}`);
            return null;
        }
        return (await response.json()) as Me;
    } catch (err) {
        console.error(`[getMe] fetch failed for ${url}:`, err);
        return null;
    }
}

async function patch(
    path: string,
    body: unknown,
    expectNoContent = false,
): Promise<ProfileResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Сессия истекла. Войдите снова.' };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (response.ok) return { ok: true };

        const text = await response.text();
        console.error(`[profile] ${response.status} ${url} :: ${text}`);
        switch (response.status) {
            case 401:
                return { ok: false, message: 'Неверный текущий пароль.' };
            case 409:
                return {
                    ok: false,
                    message: 'Этот email уже используется.',
                };
            case 400:
                return {
                    ok: false,
                    message: 'Проверьте корректность введённых данных.',
                };
            default:
                return {
                    ok: false,
                    message: 'Не удалось сохранить изменения.',
                };
        }
        void expectNoContent;
    } catch (err) {
        console.error(`[profile] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

export async function updateName(fullName: string) {
    return patch('/api/v1/users/me/name', { full_name: fullName });
}

export async function updateEmail(currentPassword: string, newEmail: string) {
    return patch('/api/v1/users/me/email', {
        current_password: currentPassword,
        new_email: newEmail,
    });
}

export async function updatePassword(
    currentPassword: string,
    newPassword: string,
) {
    return patch(
        '/api/v1/users/me/password',
        { current_password: currentPassword, new_password: newPassword },
        true,
    );
}

export async function uploadAvatar(formData: FormData): Promise<ProfileResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Сессия истекла. Войдите снова.' };
    }

    const url = `${process.env.BACKEND_URL}/api/v1/users/me/avatar`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            body: formData,
            cache: 'no-store',
        });
        if (response.ok) return { ok: true };

        const text = await response.text();
        console.error(`[avatar] ${response.status} ${url} :: ${text}`);
        if (response.status === 415) {
            return {
                ok: false,
                message: 'Неподдерживаемый формат изображения.',
            };
        }
        return { ok: false, message: 'Не удалось загрузить фото.' };
    } catch (err) {
        console.error(`[avatar] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}
