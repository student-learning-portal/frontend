'use server';

import { auth } from '@/auth';
import { Course } from '@/models/Course';
import { ApiError, buildApiError, networkError } from './apiError';

type FilterParams = {
    search?: string;
    subject?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
};

// Результат запроса: либо данные, либо ошибка с русским сообщением.
export type CoursesResult =
    | { data: unknown; error?: undefined }
    | { data?: undefined; error: ApiError };

export async function getCourses(
    filters: FilterParams,
): Promise<CoursesResult> {
    const session = await auth();

    const params = new URLSearchParams();

    for (const key in filters) {
        const value = filters[key as keyof FilterParams];
        if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
        }
    }

    const url = `${process.env.BACKEND_URL}/api/v1/catalog/courses?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session?.accessToken}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const error = await buildApiError(response);
            console.error(
                `[getCourses] ${response.status} ${response.statusText} from ${url} :: ${error.message}`,
            );
            return { error };
        }

        return { data: await response.json() };
    } catch (err) {
        console.error(`[getCourses] fetch failed for ${url}:`, err);
        return { error: networkError() };
    }
}

function normalizeCourses(res: unknown): Course[] {
    if (!res) return [];
    if (Array.isArray(res)) return res as Course[];
    const obj = res as Record<string, unknown>;
    const list = obj.items ?? obj.courses ?? obj.data ?? obj.results;
    return Array.isArray(list) ? (list as Course[]) : [];
}

export async function getCourseById(id: string): Promise<Course | null> {
    if (!id) return null;
    const res = await getCourses({ page_size: 200 });
    if (res.error) return null;
    const courses = normalizeCourses(res.data);
    return courses.find((c) => c.id === id) ?? null;
}

export async function getMyCourses(): Promise<Course[]> {
    const session = await auth();
    if (!session?.accessToken) return [];

    const url = `${process.env.BACKEND_URL}/api/v1/users/me/courses`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error(`[getMyCourses] ${response.status} from ${url}`);
            return [];
        }
        return normalizeCourses(await response.json());
    } catch (err) {
        console.error(`[getMyCourses] fetch failed for ${url}:`, err);
        return [];
    }
}
