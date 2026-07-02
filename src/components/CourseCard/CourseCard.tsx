'use client';

import './CourseCard.css';
import Link from 'next/link';
import { Course } from '@/models/Course';
import Icon from '@/components/UI/Icon/Icon';

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
    // Заглушки: бэкенд пока не отдаёт преподавателя, уровень и рейтинг.
    const seed = hash(course.id);
    const level = LEVELS[seed % LEVELS.length];
    const bannerVariant = seed % 4;

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
                    <span className="course-card__avatar">ПР</span>
                    <span className="course-card__teacher-name">
                        Преподаватель
                    </span>
                </div>

                <div className="course-card__footer">
                    <span className="course-card__rating">
                        <span className="course-card__star">★</span>
                        <span className="course-card__rating-value">—</span>
                    </span>
                    <span className="course-card__price">
                        {formatPrice(course.price)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
