'use server';

import { auth } from '@/auth';
import { translateError } from './apiError';

// In-app «bell» feed. Every route is scoped to the signed-in user on the
// backend; the token is attached here.
//   GET  /api/v1/notifications[?limit=N]
//   GET  /api/v1/notifications/unread-count
//   POST /api/v1/notifications/{id}/read
//   POST /api/v1/notifications/read-all

export type NotificationType = 'message';

export type AppNotification = {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    course_id?: string | null;
    read_at?: string | null;
    created_at: string;
};

export type NotificationResult<T> =
    | { ok: true; data: T }
    | { ok: false; message: string };

async function request<T>(
    method: string,
    path: string,
): Promise<NotificationResult<T>> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Войдите в аккаунт.' };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
            cache: 'no-store',
        });

        if (response.ok) {
            const text = await response.text();
            return { ok: true, data: (text ? JSON.parse(text) : null) as T };
        }

        const text = await response.text();
        console.error(
            `[notifications] ${response.status} ${method} ${url} :: ${text}`,
        );
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[notifications] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

export async function getNotifications(
    limit = 30,
): Promise<NotificationResult<AppNotification[]>> {
    const res = await request<AppNotification[]>(
        'GET',
        `/api/v1/notifications?limit=${limit}`,
    );
    if (!res.ok) return res;
    return {
        ok: true,
        data: Array.isArray(res.data) ? (res.data as AppNotification[]) : [],
    };
}

export async function getUnreadCount(): Promise<NotificationResult<number>> {
    const res = await request<{ unread: number }>(
        'GET',
        '/api/v1/notifications/unread-count',
    );
    if (!res.ok) return res;
    return { ok: true, data: res.data?.unread ?? 0 };
}

export async function markNotificationRead(
    id: string,
): Promise<NotificationResult<null>> {
    return request<null>('POST', `/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<
    NotificationResult<null>
> {
    return request<null>('POST', '/api/v1/notifications/read-all');
}
