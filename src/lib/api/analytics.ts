'use server';

import { auth } from '@/auth';
import { Course } from '@/models/Course';

export type RiskStatus = 'ON_TRACK' | 'AT_RISK';

export type DashboardStudent = {
    student_id: string;
    full_name?: string;
    progress_percentage: number;
    status: RiskStatus;
    days_inactive?: number;
};

export type TeacherDashboard = {
    at_risk_students: number;
    students: DashboardStudent[];
};

export type DashboardResult =
    | { ok: true; data: TeacherDashboard }
    | { ok: false; message: string };

function normalizeCourses(res: unknown): Course[] {
    if (!res) return [];
    if (Array.isArray(res)) return res as Course[];
    const obj = res as Record<string, unknown>;
    const list = obj.items ?? obj.courses ?? obj.data ?? obj.results;
    return Array.isArray(list) ? (list as Course[]) : [];
}

// getTeacherCourses returns the courses owned by the signed-in teacher. The
// catalog endpoint has no teacher filter, so we page through it and match on
// teacher_id (== the teacher's own user id) here.
export async function getTeacherCourses(): Promise<Course[]> {
    const session = await auth();
    const teacherId = session?.user?.id;
    if (!session?.accessToken || !teacherId) return [];

    const url = `${process.env.BACKEND_URL}/api/v1/catalog/courses?page_size=200`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            const body = await response.text();
            console.error(
                `[getTeacherCourses] ${response.status} ${response.statusText} :: ${body}`,
            );
            return [];
        }
        const courses = normalizeCourses(await response.json());
        return courses.filter((c) => c.teacher_id === teacherId);
    } catch (err) {
        console.error(`[getTeacherCourses] fetch failed for ${url}:`, err);
        return [];
    }
}

// getTeacherDashboard loads the at-risk breakdown for one of the teacher's own
// courses. Ownership and role are enforced by the backend.
export async function getTeacherDashboard(
    courseId: string,
): Promise<DashboardResult> {
    const session = await auth();
    if (!session?.accessToken) {
        return { ok: false, message: 'Войдите в аккаунт.' };
    }
    if (!courseId) {
        return { ok: false, message: 'Выберите курс.' };
    }

    const url = `${process.env.BACKEND_URL}/api/v1/analytics/teacher/dashboard?course_id=${encodeURIComponent(courseId)}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });

        if (response.ok) {
            return { ok: true, data: (await response.json()) as TeacherDashboard };
        }

        switch (response.status) {
            case 401:
                return { ok: false, message: 'Сессия истекла. Войдите снова.' };
            case 403:
                return {
                    ok: false,
                    message: 'Доступно только преподавателю — владельцу курса.',
                };
            case 404:
                return { ok: false, message: 'Курс не найден.' };
            default:
                return { ok: false, message: 'Не удалось загрузить аналитику.' };
        }
    } catch (err) {
        console.error(`[getTeacherDashboard] fetch failed for ${url}:`, err);
        return { ok: false, message: 'Сервер недоступен. Попробуйте позже.' };
    }
}
