'use server';

import { auth } from '@/auth';
import { RiskStatus } from '@/lib/api/analytics';
import { translateError } from './apiError';

export type CourseResult = {
    course_id: string;
    title: string;
    lessons_total: number;
    lessons_completed: number;
    progress_percent: number;
    status: RiskStatus;
    days_inactive: number;
};

export type StudentResults = {
    overall_progress_percent: number;
    courses_enrolled: number;
    courses_completed: number;
    courses: CourseResult[];
};

export type MyResultsResult =
    | { ok: true; data: StudentResults }
    | { ok: false; message: string };

// getMyResults loads the signed-in learner's aggregated progress across every
// course they hold an active (non-revoked) entitlement for.
export async function getMyResults(): Promise<MyResultsResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Войдите в аккаунт.' };
    }

    const url = `${process.env.BACKEND_URL}/api/v1/users/me/results`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });

        if (response.ok) {
            return {
                ok: true,
                data: (await response.json()) as StudentResults,
            };
        }

        const text = await response.text();
        console.error(`[getMyResults] ${response.status} :: ${text}`);
        return { ok: false, message: translateError(response.status, text) };
    } catch (err) {
        console.error(`[getMyResults] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}
