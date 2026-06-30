import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CourseDetail from '../CourseDetail';
import { getCourseById, getMyCourses } from '@/lib/api/courses';

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('id=course-1'),
}));

vi.mock('@/lib/api/courses', () => ({
    getCourseById: vi.fn(),
    getMyCourses: vi.fn(),
}));
vi.mock('@/lib/api/purchase', () => ({
    checkout: vi.fn(),
    refund: vi.fn(),
}));

const course = {
    id: 'course-1',
    teacher_id: 't1',
    title: 'Тестовый курс',
    description: 'Описание курса',
    subject: 'programming',
    price: 1000,
    currency: 'RUB',
    status: 'published' as const,
};

describe('CourseDetail locked/unlocked rendering', () => {
    beforeEach(() => {
        vi.mocked(getCourseById).mockResolvedValue(course);
        vi.mocked(getMyCourses).mockResolvedValue([]);
    });

    it('renders the locked state with a buy button when the course is not owned', async () => {
        render(<CourseDetail />);

        expect(await screen.findByText('Нет доступа')).toBeInTheDocument();
        expect(screen.getByText(/Купить за/)).toBeInTheDocument();
        expect(
            screen.getByText(/Купите курс, чтобы открыть/),
        ).toBeInTheDocument();
    });

    it('renders the unlocked state with a lessons CTA when the course is owned', async () => {
        vi.mocked(getMyCourses).mockResolvedValue([course]);

        render(<CourseDetail />);

        expect(await screen.findByText('Перейти к урокам')).toBeInTheDocument();
        expect(screen.getByText('Курс куплен')).toBeInTheDocument();
        expect(screen.queryByText(/Купить за/)).not.toBeInTheDocument();
    });
});
