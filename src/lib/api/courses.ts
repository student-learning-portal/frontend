'use server';

import { auth } from '@/auth';
import { Course } from '@/models/Course';

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

export async function getCourses(filters: FilterParams) {
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
            const body = await response.text();
            console.error(
                `[getCourses] ${response.status} ${response.statusText} from ${url} :: ${body}`,
            );
            return null;
        }

        return await response.json();
    } catch (err) {
        console.error(`[getCourses] fetch failed for ${url}:`, err);
        return null;
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
    if (res === null) return null;
    const courses = normalizeCourses(res);
    return courses.find((c) => c.id === id) ?? null;
}
