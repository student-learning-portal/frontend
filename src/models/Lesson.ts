export type LessonType = 'video' | 'text' | 'quiz' | 'mixed';

export interface LessonMaterial {
    title: string;
    url: string;
    type: string;
}

export interface LessonSummary {
    lesson_id: string;
    title: string;
    lesson_type: LessonType;
    position: number;
    duration_seconds?: number;
}

export interface LessonData {
    lesson_id: string;
    course_id: string;
    title: string;
    lesson_type: LessonType;
    position: number;
    content_url: string;
    duration_seconds: number;
    materials: LessonMaterial[];
    last_progress_seconds: number;
    percent_complete: number;
}

export interface LessonProgress {
    lesson_id: string;
    progress_seconds: number;
    percent_complete: number;
    completed: boolean;
    updated_at: string;
}
