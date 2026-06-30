'use server';

import { auth } from '@/auth';
import {
    LessonData,
    LessonProgress,
    LessonSummary,
} from '@/models/Lesson';

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

// TEMP: уроки-заглушки (placeholder-*) не существуют на бэке — отдаём мок
// с реальным демо-видео и PDF, чтобы посмотреть, как выглядит плеер.
// Удалить вместе с PLACEHOLDER_LESSONS, когда появится реальный эндпоинт.
const PLACEHOLDER_LESSON_DATA: Record<string, Partial<LessonData>> = {
    'placeholder-1': {
        title: 'Введение в курс',
        lesson_type: 'video',
        position: 1,
        content_url:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration_seconds: 596,
    },
    'placeholder-2': {
        title: 'Основные понятия',
        lesson_type: 'text',
        position: 2,
        content_url: '',
        duration_seconds: 0,
    },
    'placeholder-3': {
        title: 'Практическое видео',
        lesson_type: 'video',
        position: 3,
        content_url:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration_seconds: 653,
    },
    'placeholder-4': {
        title: 'Проверочное задание',
        lesson_type: 'quiz',
        position: 4,
        content_url: '',
        duration_seconds: 0,
    },
};

function isPlaceholder(lessonId: string): boolean {
    return lessonId.startsWith('placeholder-');
}

function buildPlaceholderLesson(
    courseId: string,
    lessonId: string,
): LessonData {
    const meta = PLACEHOLDER_LESSON_DATA[lessonId] ?? {};
    return {
        lesson_id: lessonId,
        course_id: courseId,
        title: meta.title ?? 'Урок',
        lesson_type: meta.lesson_type ?? 'text',
        position: meta.position ?? 0,
        content_url: meta.content_url ?? '',
        duration_seconds: meta.duration_seconds ?? 0,
        materials: [
            {
                title: 'Материалы урока (демо PDF)',
                url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                type: 'pdf',
            },
        ],
        last_progress_seconds: 0,
        percent_complete: 0,
    };
}

export async function getLesson(courseId: string, lessonId: string) {
    if (isPlaceholder(lessonId)) {
        return {
            ok: true as const,
            data: buildPlaceholderLesson(courseId, lessonId),
        };
    }
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
    if (isPlaceholder(lessonId)) {
        return {
            ok: true as const,
            data: {
                lesson_id: lessonId,
                progress_seconds: Math.max(0, Math.floor(progressSeconds)),
                percent_complete: completed ? 100 : 0,
                completed,
                updated_at: new Date().toISOString(),
            } satisfies LessonProgress,
        };
    }
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

// TEMP: бэкенд ещё не отдаёт список уроков курса
// (нужен GET /catalog/courses/{id}/lessons). Пока эндпоинта нет —
// возвращаем уроки из сид-данных, чтобы можно было открыть плеер и проверить.
// Удалить этот блок, когда появится реальный эндпоинт.
const SEED_LESSONS: Record<string, LessonSummary[]> = {
    'aaaaaaa1-0000-0000-0000-000000000001': [
        { lesson_id: 'c0000001-0000-0000-0000-000000000001', title: 'Установка и первый скрипт', lesson_type: 'video', position: 1 },
        { lesson_id: 'c0000001-0000-0000-0000-000000000002', title: 'Переменные и типы данных', lesson_type: 'text', position: 2 },
        { lesson_id: 'c0000001-0000-0000-0000-000000000003', title: 'Проверочный тест', lesson_type: 'quiz', position: 3 },
    ],
    'aaaaaaa2-0000-0000-0000-000000000002': [
        { lesson_id: 'c0000002-0000-0000-0000-000000000001', title: 'Что такое компонент', lesson_type: 'video', position: 1 },
        { lesson_id: 'c0000002-0000-0000-0000-000000000002', title: 'Хуки useState/useEffect', lesson_type: 'video', position: 2 },
    ],
    'bbbbbbb1-0000-0000-0000-000000000003': [
        { lesson_id: 'c0000003-0000-0000-0000-000000000001', title: 'Производные', lesson_type: 'video', position: 1 },
        { lesson_id: 'c0000003-0000-0000-0000-000000000002', title: 'Тренировочный вариант', lesson_type: 'quiz', position: 2 },
    ],
};

// TEMP: для курсов без сид-уроков показываем заглушки, чтобы можно было
// посмотреть, как выглядит страница уроков. Удалить вместе с SEED_LESSONS,
// когда появится реальный эндпоинт.
const PLACEHOLDER_LESSONS: LessonSummary[] = [
    { lesson_id: 'placeholder-1', title: 'Введение в курс', lesson_type: 'video', position: 1 },
    { lesson_id: 'placeholder-2', title: 'Основные понятия', lesson_type: 'text', position: 2 },
    { lesson_id: 'placeholder-3', title: 'Практическое видео', lesson_type: 'video', position: 3 },
    { lesson_id: 'placeholder-4', title: 'Проверочное задание', lesson_type: 'quiz', position: 4 },
];

export async function getCourseLessons(courseId: string) {
    const res = await request<RawLesson[]>(
        `/api/v1/catalog/courses/${courseId}/lessons`,
    );
    if (!res.ok) {
        const seed = SEED_LESSONS[courseId];
        return { ok: true as const, data: seed ?? PLACEHOLDER_LESSONS };
    }

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

    return { ok: true as const, data: lessons };
}
