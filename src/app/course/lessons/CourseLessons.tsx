'use client';

import './lessonsPage.css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Course } from '@/models/Course';
import { LessonSummary } from '@/models/Lesson';
import { getCourseById, getMyCourses } from '@/lib/api/courses';
import { getCourseLessons } from '@/lib/api/player';
import Icon from '@/components/UI/Icon/Icon';
import Button from '@/components/UI/Button/Button';

const TYPE_LABEL: Record<string, string> = {
    video: 'Видео',
    audio: 'Аудио',
    text: 'Текст',
    quiz: 'Задание',
    mixed: 'Видео + материалы',
};

const TYPE_ICON: Record<string, 'play' | 'fileText' | 'edit'> = {
    video: 'play',
    audio: 'play',
    mixed: 'play',
    text: 'fileText',
    quiz: 'edit',
};

export default function CourseLessons() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get('course') ?? '';

    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<LessonSummary[]>([]);
    const [status, setStatus] = useState<
        'loading' | 'ready' | 'unavailable' | 'locked'
    >('loading');

    useEffect(() => {
        let active = true;
        (async () => {
            const [courseData, lessonsRes, myCourses] = await Promise.all([
                getCourseById(courseId),
                getCourseLessons(courseId),
                getMyCourses(),
            ]);
            if (!active) return;
            setCourse(courseData);

            const owned = myCourses.some((c) => c.id === courseId);
            if (!owned) {
                setLessons([]);
                setStatus('locked');
                return;
            }

            if (lessonsRes.ok) {
                setLessons(lessonsRes.data);
                setStatus('ready');
            } else {
                setLessons([]);
                setStatus('unavailable');
            }
        })();
        return () => {
            active = false;
        };
    }, [courseId]);

    return (
        <div className="lessons-page">
            <Link href={`/course?id=${courseId}`} className="lessons-back">
                ← К курсу
            </Link>

            <header className="lessons-header">
                <h1 className="lessons-header__title">
                    {course?.title ?? 'Уроки курса'}
                </h1>
                <p className="lessons-header__subtitle">
                    {status === 'ready'
                        ? `${lessons.length} ${
                              lessons.length === 1 ? 'урок' : 'уроков'
                          } · программа курса`
                        : 'Программа курса'}
                </p>
            </header>

            {status === 'loading' && (
                <div className="lessons-state">Загрузка уроков…</div>
            )}

            {status === 'locked' && (
                <div className="lessons-locked">
                    <span className="lessons-locked__icon">
                        <Icon name="lock" size={26} />
                    </span>
                    <p className="lessons-locked__text">
                        Курс не куплен. Чтобы открыть уроки, перейдите на
                        страницу курса и оформите покупку.
                    </p>
                    <Link href={`/course?id=${courseId}`}>
                        <Button>Перейти к курсу</Button>
                    </Link>
                </div>
            )}

            {status === 'unavailable' && (
                <div className="lessons-state">
                    Список уроков недоступен: на бэкенде ещё нет эндпоинта
                    получения уроков курса.
                </div>
            )}

            {status === 'ready' && lessons.length > 0 && (
                <ol className="lessons-grid">
                    {lessons.map((lesson, idx) => (
                        <li key={lesson.lesson_id}>
                            <Link
                                href={`/course/lesson?course=${courseId}&lesson=${lesson.lesson_id}`}
                                className="lesson-card"
                            >
                                <div className="lesson-card__thumb">
                                    <Icon
                                        name={
                                            TYPE_ICON[lesson.lesson_type] ??
                                            'fileText'
                                        }
                                        size={26}
                                    />
                                    <span className="lesson-card__num">
                                        Урок {idx + 1}
                                    </span>
                                </div>
                                <div className="lesson-card__body">
                                    <span className="lesson-card__type">
                                        {TYPE_LABEL[lesson.lesson_type] ??
                                            lesson.lesson_type}
                                    </span>
                                    <h3 className="lesson-card__title">
                                        {lesson.title}
                                    </h3>
                                    <p className="lesson-card__desc">
                                        Краткое описание урока появится позже.
                                    </p>
                                    <span className="lesson-card__cta">
                                        Открыть
                                        <Icon name="chevronRight" size={16} />
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}

            {status === 'ready' && lessons.length === 0 && (
                <div className="lessons-state">
                    В этом курсе пока нет уроков.
                </div>
            )}
        </div>
    );
}
