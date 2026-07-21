'use server';

import { auth } from '@/auth';
import { translateError } from './apiError';

// Чат «ученик <-> преподаватель курса». Тред определяется парой (курс, ученик).
// Ученик:      GET/POST /api/v1/courses/{course_id}/messages
// Преподаватель: GET /api/v1/teacher/courses/{course_id}/threads
//               GET/POST /api/v1/teacher/courses/{course_id}/threads/{student_id}/messages

export type ChatMessage = {
    id: string;
    course_id: string;
    student_id: string;
    lesson_id?: string | null;
    sender_role: 'student' | 'teacher';
    sender_id: string;
    body: string;
    created_at: string;
};

export type ThreadSummary = {
    course_id: string;
    student_id: string;
    student_name: string;
    message_count: number;
    last_message: string;
    last_at: string;
};

export type ChatResult<T> =
    | { ok: true; data: T }
    | { ok: false; message: string };

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<ChatResult<T>> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Войдите в аккаунт.' };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        });

        if (response.ok) {
            const text = await response.text();
            return { ok: true, data: (text ? JSON.parse(text) : null) as T };
        }

        const text = await response.text();
        console.error(`[chat] ${response.status} ${method} ${url} :: ${text}`);
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[chat] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

function normalizeMessages(data: unknown): ChatMessage[] {
    return Array.isArray(data) ? (data as ChatMessage[]) : [];
}

// --- Ученик ---

export async function getStudentThread(
    courseId: string,
): Promise<ChatResult<ChatMessage[]>> {
    const res = await request<ChatMessage[]>(
        'GET',
        `/api/v1/courses/${courseId}/messages`,
    );
    if (!res.ok) return res;
    return { ok: true, data: normalizeMessages(res.data) };
}

export async function sendStudentMessage(
    courseId: string,
    body: string,
    lessonId?: string,
): Promise<ChatResult<ChatMessage>> {
    if (!body.trim()) {
        return { ok: false, message: 'Введите текст сообщения.' };
    }
    return request<ChatMessage>(
        'POST',
        `/api/v1/courses/${courseId}/messages`,
        {
            body: body.trim(),
            lesson_id: lessonId,
        },
    );
}

// --- Преподаватель ---

export async function getTeacherThreads(
    courseId: string,
): Promise<ChatResult<ThreadSummary[]>> {
    const res = await request<ThreadSummary[]>(
        'GET',
        `/api/v1/teacher/courses/${courseId}/threads`,
    );
    if (!res.ok) return res;
    return {
        ok: true,
        data: Array.isArray(res.data) ? (res.data as ThreadSummary[]) : [],
    };
}

export async function getTeacherThread(
    courseId: string,
    studentId: string,
): Promise<ChatResult<ChatMessage[]>> {
    const res = await request<ChatMessage[]>(
        'GET',
        `/api/v1/teacher/courses/${courseId}/threads/${studentId}/messages`,
    );
    if (!res.ok) return res;
    return { ok: true, data: normalizeMessages(res.data) };
}

export async function sendTeacherMessage(
    courseId: string,
    studentId: string,
    body: string,
    lessonId?: string,
): Promise<ChatResult<ChatMessage>> {
    if (!body.trim()) {
        return { ok: false, message: 'Введите текст сообщения.' };
    }
    return request<ChatMessage>(
        'POST',
        `/api/v1/teacher/courses/${courseId}/threads/${studentId}/messages`,
        { body: body.trim(), lesson_id: lessonId },
    );
}
