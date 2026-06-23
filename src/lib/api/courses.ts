'use server'

import { auth } from '@/auth';

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
