'use server';

import { auth } from '@/auth';
import { LessonData, LessonProgress, LessonSummary } from '@/models/Lesson';

export type PlayerError =
    | 'unauthenticated'
    | 'forbidden'
    | 'not_found'
    | 'unavailable'
    | 'unknown';

export type PlayerResult<T> =
    | { ok: true; data: T }
    | { ok: false; code: PlayerError; message: string };

async function request<T>(
    path: string,
    init?: { method?: string; body?: unknown },
): Promise<PlayerResult<T>> {
    const session = await auth();
    if (!session?.accessToken) {
        return {
            ok: false,
            code: 'unauthenticated',
            message: 'Войдите в аккаунт.',
        };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: init?.method ?? 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: init?.body ? JSON.stringify(init.body) : undefined,
            cache: 'no-store',
        });

        if (response.ok) {
            const text = await response.text();
            return {
                ok: true,
                data: (text ? JSON.parse(text) : null) as T,
            };
        }

        switch (response.status) {
            case 401:
                return {
                    ok: false,
                    code: 'unauthenticated',
                    message: 'Сессия истекла. Войдите снова.',
                };
            case 403:
                return {
                    ok: false,
                    code: 'forbidden',
                    message: 'Нет доступа к этому уроку. Купите курс.',
                };
            case 404:
                return {
                    ok: false,
                    code: 'not_found',
                    message: 'Урок не найден.',
                };
            default:
                return {
                    ok: false,
                    code: 'unknown',
                    message: 'Не удалось загрузить данные урока.',
                };
        }
    } catch (err) {
        console.error(`[player] fetch failed for ${url}:`, err);
        return {
            ok: false,
            code: 'unknown',
            message: 'Сервер недоступен. Попробуйте позже.',
        };
    }
}

export async function getLesson(courseId: string, lessonId: string) {
    return request<LessonData>(
        `/api/v1/player/courses/${courseId}/lessons/${lessonId}`,
    );
}

export async function getProgress(courseId: string, lessonId: string) {
    return request<LessonProgress>(
        `/api/v1/player/courses/${courseId}/lessons/${lessonId}/progress`,
    );
}

export async function saveProgress(
    courseId: string,
    lessonId: string,
    progressSeconds: number,
    completed = false,
) {
    return request<LessonProgress>(
        `/api/v1/player/courses/${courseId}/lessons/${lessonId}/progress`,
        {
            method: 'POST',
            body: {
                progress_seconds: Math.max(0, Math.floor(progressSeconds)),
                completed,
            },
        },
    );
}

type RawLesson = Partial<LessonSummary> & { id?: string };

export async function getCourseLessons(
    courseId: string,
): Promise<PlayerResult<LessonSummary[]>> {
    const res = await request<RawLesson[]>(
        `/api/v1/catalog/courses/${courseId}/lessons`,
    );
    if (!res.ok) return res;

    const list = Array.isArray(res.data) ? res.data : [];
    const lessons: LessonSummary[] = list
        .map((l) => ({
            lesson_id: l.lesson_id ?? l.id ?? '',
            title: l.title ?? 'Урок',
            lesson_type: l.lesson_type ?? 'text',
            position: l.position ?? 0,
            duration_seconds: l.duration_seconds,
        }))
        .filter((l) => l.lesson_id)
        .sort((a, b) => a.position - b.position);

    return { ok: true, data: lessons };
}
