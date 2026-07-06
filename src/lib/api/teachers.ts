'use server';

import { auth } from '@/auth';

export type Teacher = {
    id: string;
    full_name: string;
    role: string;
};

export async function getTeacher(teacherId: string): Promise<Teacher | null> {
    if (!teacherId) return null;

    const session = await auth();
    const url = `${process.env.BACKEND_URL}/api/v1/teachers/${teacherId}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: session?.accessToken
                ? { Authorization: `Bearer ${session.accessToken}` }
                : {},
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error(`[getTeacher] ${response.status} from ${url}`);
            return null;
        }
        return (await response.json()) as Teacher;
    } catch (err) {
        console.error(`[getTeacher] fetch failed for ${url}:`, err);
        return null;
    }
}
