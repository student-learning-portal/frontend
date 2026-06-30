import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import LessonViewer from '../LessonViewer';
import { getLesson, saveProgress } from '@/lib/api/player';

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('course=c1&lesson=l1'),
}));

vi.mock('@/lib/api/player', () => ({
    getLesson: vi.fn(),
    saveProgress: vi.fn(),
}));

const lesson = {
    lesson_id: 'l1',
    course_id: 'c1',
    title: 'Урок про производные',
    lesson_type: 'video' as const,
    position: 1,
    content_url: 'http://example.com/video.mp4',
    duration_seconds: 600,
    materials: [],
    last_progress_seconds: 120,
    percent_complete: 20,
};

describe('LessonViewer resume behaviour', () => {
    beforeEach(() => {
        vi.mocked(getLesson).mockResolvedValue({ ok: true, data: lesson });
        vi.mocked(saveProgress).mockResolvedValue({
            ok: true,
            data: {
                lesson_id: 'l1',
                progress_seconds: 120,
                percent_complete: 20,
                completed: false,
                updated_at: new Date().toISOString(),
            },
        });
    });

    it('seeks the media to the last saved position on loadedmetadata', async () => {
        render(<LessonViewer />);

        const media = (await screen.findByTestId(
            'lesson-media',
        )) as HTMLVideoElement;

        let currentTime = 0;
        Object.defineProperty(media, 'duration', {
            configurable: true,
            value: 600,
        });
        Object.defineProperty(media, 'currentTime', {
            configurable: true,
            get: () => currentTime,
            set: (v: number) => {
                currentTime = v;
            },
        });

        fireEvent.loadedMetadata(media);

        expect(currentTime).toBe(lesson.last_progress_seconds);
    });

    it('does not seek past the media duration', async () => {
        vi.mocked(getLesson).mockResolvedValue({
            ok: true,
            data: { ...lesson, last_progress_seconds: 9999 },
        });

        render(<LessonViewer />);

        const media = (await screen.findByTestId(
            'lesson-media',
        )) as HTMLVideoElement;

        let currentTime = 0;
        Object.defineProperty(media, 'duration', {
            configurable: true,
            value: 600,
        });
        Object.defineProperty(media, 'currentTime', {
            configurable: true,
            get: () => currentTime,
            set: (v: number) => {
                currentTime = v;
            },
        });

        fireEvent.loadedMetadata(media);

        expect(currentTime).toBe(0);
    });
});
