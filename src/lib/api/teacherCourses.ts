'use server';

import { auth } from '@/auth';
import { Course } from '@/models/Course';
import { LessonType } from '@/models/Lesson';
import { translateError } from './apiError';

export type TeacherCourseResult<T> =
    | { ok: true; data: T }
    | { ok: false; message: string };

export type CourseInput = {
    title: string;
    description?: string;
    subject?: string;
    price: number;
    currency?: string;
};

export type TeacherLesson = {
    lesson_id: string;
    course_id: string;
    title: string;
    lesson_type: LessonType;
    position: number;
};

export type TeacherMedia = {
    id: string;
    url: string;
    duration_seconds: number;
    media_type: 'video' | 'audio';
};

export type TeacherMaterial = {
    id: string;
    title: string;
    url: string;
    type: string;
};

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<TeacherCourseResult<T>> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Сессия истекла. Войдите снова.' };
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
            if (response.status === 204) {
                return { ok: true, data: undefined as T };
            }
            return { ok: true, data: (await response.json()) as T };
        }

        const text = await response.text();
        console.error(
            `[teacherCourses] ${response.status} ${method} ${url} :: ${text}`,
        );
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[teacherCourses] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

// requestFormData is request's multipart/form-data counterpart, used for
// file uploads — the browser sets the correct Content-Type (with boundary)
// automatically when the body is a FormData, so we must not set it ourselves.
async function requestFormData<T>(
    path: string,
    formData: FormData,
): Promise<TeacherCourseResult<T>> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Сессия истекла. Войдите снова.' };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            body: formData,
            cache: 'no-store',
        });

        if (response.ok) {
            return { ok: true, data: (await response.json()) as T };
        }

        const text = await response.text();
        console.error(
            `[teacherCourses] ${response.status} POST ${url} :: ${text}`,
        );
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[teacherCourses] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

export async function createCourse(input: CourseInput) {
    return request<Course>('POST', '/api/v1/teacher/courses', input);
}

export async function updateCourse(
    courseId: string,
    input: CourseInput & { status: 'draft' | 'published' | 'archived' },
) {
    return request<Course>(
        'PATCH',
        `/api/v1/teacher/courses/${courseId}`,
        input,
    );
}

export async function deleteCourse(courseId: string) {
    return request<void>('DELETE', `/api/v1/teacher/courses/${courseId}`);
}

export async function createLesson(
    courseId: string,
    title: string,
    lessonType: LessonType,
) {
    return request<TeacherLesson>(
        'POST',
        `/api/v1/teacher/courses/${courseId}/lessons`,
        { title, lesson_type: lessonType },
    );
}

export async function updateLesson(
    courseId: string,
    lessonId: string,
    title: string,
    lessonType: LessonType,
) {
    return request<TeacherLesson>(
        'PATCH',
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}`,
        { title, lesson_type: lessonType },
    );
}

export async function deleteLesson(courseId: string, lessonId: string) {
    return request<void>(
        'DELETE',
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}`,
    );
}

export async function reorderLessons(courseId: string, lessonIds: string[]) {
    return request<void>(
        'PUT',
        `/api/v1/teacher/courses/${courseId}/lessons/order`,
        { lesson_ids: lessonIds },
    );
}

export async function setLessonMedia(
    courseId: string,
    lessonId: string,
    url: string,
    durationSeconds: number,
    mediaType: 'video' | 'audio',
) {
    return request<TeacherMedia>(
        'PUT',
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}/media`,
        { url, duration_seconds: durationSeconds, media_type: mediaType },
    );
}

export async function deleteLessonMedia(courseId: string, lessonId: string) {
    return request<void>(
        'DELETE',
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}/media`,
    );
}

export async function addMaterial(
    courseId: string,
    lessonId: string,
    title: string,
    url: string,
    type: string,
) {
    return request<TeacherMaterial>(
        'POST',
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}/materials`,
        { title, url, type },
    );
}

export async function deleteMaterial(
    courseId: string,
    lessonId: string,
    materialId: string,
) {
    return request<void>(
        'DELETE',
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
    );
}

// uploadLessonMedia sends a video/audio file directly, as an alternative to
// setLessonMedia's URL-based flow. durationSeconds is read client-side from
// the browser's own media metadata before calling this (see
// LessonContentEditor), since the backend doesn't probe media files.
export async function uploadLessonMedia(
    courseId: string,
    lessonId: string,
    file: File,
    durationSeconds: number,
) {
    const formData = new FormData();
    formData.set('file', file);
    formData.set('duration_seconds', String(durationSeconds));
    return requestFormData<TeacherMedia>(
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}/media/upload`,
        formData,
    );
}

// uploadMaterial sends a file directly, as an alternative to addMaterial's
// URL-based flow. title defaults to the uploaded filename on the backend if
// omitted here.
export async function uploadMaterial(
    courseId: string,
    lessonId: string,
    file: File,
    title: string,
) {
    const formData = new FormData();
    formData.set('file', file);
    if (title.trim()) {
        formData.set('title', title.trim());
    }
    return requestFormData<TeacherMaterial>(
        `/api/v1/teacher/courses/${courseId}/lessons/${lessonId}/materials/upload`,
        formData,
    );
}
