'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { TeacherStatus } from '@/models/User';
import { translateError } from './apiError';

export type TeacherApplication = {
    id: string;
    email: string;
    full_name: string;
    status: TeacherStatus;
    registered_at: string;
    // Absent while the application is still pending.
    reviewed_at?: string;
};

export type TeacherApplications = {
    pending: number;
    items: TeacherApplication[];
};

export type ApplicationsResult =
    | { ok: true; data: TeacherApplications }
    | { ok: false; message: string };

export type DecisionResult = { ok: true } | { ok: false; message: string };

// Filter for the review queue: 'pending' (the default) is the work list,
// 'all' also shows the applications that were already decided on.
export type ApplicationsFilter = TeacherStatus | 'all';

// getTeacherApplications loads the administrator's review queue. The admin role
// is enforced by the backend; a non-admin session simply gets an error message.
export async function getTeacherApplications(
    filter: ApplicationsFilter = 'pending',
): Promise<ApplicationsResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Войдите в аккаунт.' };
    }

    const url = `${process.env.BACKEND_URL}/api/v1/admin/teachers?status=${encodeURIComponent(filter)}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });

        if (response.ok) {
            return {
                ok: true,
                data: (await response.json()) as TeacherApplications,
            };
        }

        const text = await response.text();
        console.error(`[getTeacherApplications] ${response.status} :: ${text}`);
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[getTeacherApplications] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

export async function approveTeacher(
    teacherId: string,
): Promise<DecisionResult> {
    return decide(teacherId, 'approve');
}

export async function rejectTeacher(
    teacherId: string,
): Promise<DecisionResult> {
    return decide(teacherId, 'reject');
}

async function decide(
    teacherId: string,
    decision: 'approve' | 'reject',
): Promise<DecisionResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Сессия истекла. Войдите снова.' };
    }
    if (!teacherId) {
        return { ok: false, message: 'Не выбран преподаватель.' };
    }

    const url = `${process.env.BACKEND_URL}/api/v1/admin/teachers/${encodeURIComponent(teacherId)}/${decision}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });

        if (response.ok) {
            revalidatePath('/dashboard/admin');
            return { ok: true };
        }

        const text = await response.text();
        console.error(`[${decision}Teacher] ${response.status} :: ${text}`);
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[${decision}Teacher] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}
