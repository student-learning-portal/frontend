'use server';

import { auth } from '@/auth';

export type CourseResult = {
    course_id: string;
    title: string;
    lessons_total: number;
    lessons_completed: number;
    progress_percent: number;
    status: string;
    days_inactive: number;
};

export type StudentResults = {
    overall_progress_percent: number;
    courses_enrolled: number;
    courses_completed: number;
    courses: CourseResult[];
};

export async function getMyResults(): Promise<StudentResults | null> {
    const session = await auth();
    if (!session?.accessToken) return null;

    const url = `${process.env.BACKEND_URL}/api/v1/users/me/results`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error(`[getMyResults] ${response.status} from ${url}`);
            return null;
        }
        return (await response.json()) as StudentResults;
    } catch (err) {
        console.error(`[getMyResults] fetch failed for ${url}:`, err);
        return null;
    }
}
