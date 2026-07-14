'use client';

import './CourseCard.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Course } from '@/models/Course';
import Icon from '@/components/UI/Icon/Icon';
import { getCourseRatingSummary } from '@/lib/api/ratings';
import { getTeacher } from '@/lib/api/teachers';

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (
        ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'ПР'
    );
}

const LEVELS = ['Начальный', 'Средний', 'Продвинутый'];

function hash(value: string): number {
    let h = 0;
    for (let i = 0; i < value.length; i++) {
        h = (h * 31 + value.charCodeAt(i)) >>> 0;
    }
    return h;
}

function formatPrice(price: number): string {
    return `${price.toLocaleString('ru-RU')} 🪙`;
}

type Props = {
    course: Course;
    owned?: boolean;
};

export default function CourseCard({ course, owned = false }: Props) {
    // Заглушки: бэкенд пока не отдаёт преподавателя и уровень.
    const seed = hash(course.id);
    const level = LEVELS[seed % LEVELS.length];
    const bannerVariant = seed % 4;

    const [rating, setRating] = useState<{
        average: number;
        count: number;
    } | null>(null);
    const [teacherName, setTeacherName] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            const s = await getCourseRatingSummary(course.id);
            if (active)
                setRating({ average: s.average_score, count: s.ratings_count });
        })();
        return () => {
            active = false;
        };
    }, [course.id]);

    useEffect(() => {
        if (!course.teacher_id) return;
        let active = true;
        (async () => {
            const t = await getTeacher(course.teacher_id);
            if (active && t) setTeacherName(t.full_name);
        })();
        return () => {
            active = false;
        };
    }, [course.teacher_id]);

    return (
        <Link href={`/course?id=${course.id}`} className="course-card">
            <div className="course-card__banner" data-variant={bannerVariant}>
                <span
                    className={`course-card__owned-badge course-card__owned-badge--${
                        owned ? 'owned' : 'locked'
                    }`}
                >
                    <Icon name={owned ? 'checkCircle' : 'lock'} size={13} />
                    {owned ? 'Куплен' : 'Не куплен'}
                </span>
            </div>
            <div className="course-card__body">
                <div className="course-card__tags">
                    <span className="course-card__tag">{course.subject}</span>
                    <span className="course-card__tag">{level}</span>
                </div>

                <h3 className="course-card__title">{course.title}</h3>

                <div className="course-card__teacher">
                    <span className="course-card__avatar">
                        {teacherName ? initials(teacherName) : 'ПР'}
                    </span>
                    <span className="course-card__teacher-name">
                        {teacherName ?? 'Преподаватель'}
                    </span>
                </div>

                <div className="course-card__footer">
                    <span className="course-card__rating">
                        <span className="course-card__star">★</span>
                        <span className="course-card__rating-value">
                            {rating && rating.count > 0
                                ? rating.average.toFixed(1).replace('.', ',')
                                : '—'}
                        </span>
                    </span>
                    <span className="course-card__price">
                        {formatPrice(course.price)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
