'use server';

import { auth } from '@/auth';
import { translateError } from './apiError';

// Локальная система рейтинга бэкенда (шкала 1–10), отдельная от отзывов practicum.
// Курсы:  GET/POST /api/v1/catalog/courses/{id}/ratings, GET .../ratings/me
// Учителя: GET/POST /api/v1/teachers/{id}/ratings,        GET .../ratings/me

export type RatingSummary = {
    average_score: number;
    ratings_count: number;
};

export type RateResult =
    | { ok: true; score: number }
    | { ok: false; message: string };

const EMPTY_SUMMARY: RatingSummary = { average_score: 0, ratings_count: 0 };

async function getSummary(path: string): Promise<RatingSummary> {
    const session = await auth();
    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: session?.accessToken
                ? { Authorization: `Bearer ${session.accessToken}` }
                : {},
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error(`[ratings] summary ${response.status} from ${url}`);
            return EMPTY_SUMMARY;
        }
        const data = (await response.json()) as Partial<RatingSummary>;
        return {
            average_score: Number(data.average_score ?? 0),
            ratings_count: Number(data.ratings_count ?? 0),
        };
    } catch (err) {
        console.error(`[ratings] summary fetch failed for ${url}:`, err);
        return EMPTY_SUMMARY;
    }
}

// Моя оценка: число 1–10, либо null, если ещё не оценивал (404) или не авторизован.
async function getMyScore(path: string): Promise<number | null> {
    const session = await auth();
    if (!session?.accessToken) return null;

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) return null;
        const data = (await response.json()) as { score?: number };
        return typeof data.score === 'number' ? data.score : null;
    } catch (err) {
        console.error(`[ratings] my score fetch failed for ${url}:`, err);
        return null;
    }
}

async function postScore(path: string, score: number): Promise<RateResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Войдите в аккаунт, чтобы оценивать.' };
    }
    if (!Number.isInteger(score) || score < 1 || score > 10) {
        return { ok: false, message: 'Оценка должна быть от 1 до 10.' };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ score }),
            cache: 'no-store',
        });

        if (response.ok) {
            const data = (await response.json()) as { score?: number };
            return { ok: true, score: data.score ?? score };
        }

        const text = await response.text();
        console.error(`[ratings] POST ${response.status} ${url} :: ${text}`);
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[ratings] POST fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}

// --- Курсы ---

export async function getCourseRatingSummary(
    courseId: string,
): Promise<RatingSummary> {
    if (!courseId) return EMPTY_SUMMARY;
    return getSummary(`/api/v1/catalog/courses/${courseId}/ratings`);
}

export async function getMyCourseRating(
    courseId: string,
): Promise<number | null> {
    if (!courseId) return null;
    return getMyScore(`/api/v1/catalog/courses/${courseId}/ratings/me`);
}

export async function rateCourse(
    courseId: string,
    score: number,
): Promise<RateResult> {
    return postScore(`/api/v1/catalog/courses/${courseId}/ratings`, score);
}

// --- Учителя ---

export async function getTeacherRatingSummary(
    teacherId: string,
): Promise<RatingSummary> {
    if (!teacherId) return EMPTY_SUMMARY;
    return getSummary(`/api/v1/teachers/${teacherId}/ratings`);
}

export async function getMyTeacherRating(
    teacherId: string,
): Promise<number | null> {
    if (!teacherId) return null;
    return getMyScore(`/api/v1/teachers/${teacherId}/ratings/me`);
}

export async function rateTeacher(
    teacherId: string,
    score: number,
): Promise<RateResult> {
    return postScore(`/api/v1/teachers/${teacherId}/ratings`, score);
}
