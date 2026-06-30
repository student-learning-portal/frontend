'use client';

import './teacherDashboard.css';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Course } from '@/models/Course';
import { SelectOption } from '@/types/selectOption';
import Select from '@/components/UI/Select/Select';
import Icon from '@/components/UI/Icon/Icon';
import {
    DashboardStudent,
    TeacherDashboard,
    getTeacherDashboard,
} from '@/lib/api/analytics';

function pluralizeStudents(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'студент';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
        return 'студента';
    return 'студентов';
}

function pluralizeDays(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
    return 'дней';
}

function initials(name: string | undefined, fallback: string): string {
    const source = (name ?? '').trim();
    if (!source) return fallback.slice(0, 2).toUpperCase();
    const parts = source.split(/\s+/);
    const letters = parts
        .slice(0, 2)
        .map((p) => p[0])
        .join('');
    return letters.toUpperCase();
}

function StudentRow({ student }: { student: DashboardStudent }) {
    const atRisk = student.status === 'AT_RISK';
    const progress = Math.round(student.progress_percentage);
    const days = student.days_inactive ?? 0;

    return (
        <div className="td-row">
            <div className="td-row__student">
                <span className="td-avatar">
                    {initials(student.full_name, student.student_id)}
                </span>
                <span className="td-row__name">
                    {student.full_name || student.student_id}
                </span>
            </div>
            <div className="td-row__progress">
                <div className="td-progress">
                    <div
                        className={
                            'td-progress__bar' +
                            (atRisk ? ' td-progress__bar--risk' : '')
                        }
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
                <span className="td-progress__value">{progress}%</span>
            </div>
            <div className="td-row__status">
                <span
                    className={
                        'td-badge ' +
                        (atRisk ? 'td-badge--risk' : 'td-badge--ok')
                    }
                >
                    <Icon
                        size={14}
                        name={atRisk ? 'alert' : 'checkCircle'}
                    />
                    {atRisk ? 'В зоне риска' : 'На треке'}
                </span>
            </div>
            <div className="td-row__inactive">
                {days > 0 ? `${days} ${pluralizeDays(days)}` : '—'}
            </div>
        </div>
    );
}

export default function TeacherAnalytics({ courses }: { courses: Course[] }) {
    const courseOptions: SelectOption[] = useMemo(
        () => courses.map((c) => ({ title: c.title, value: c.id })),
        [courses],
    );

    const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
    const [data, setData] = useState<TeacherDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!courseId) return;
        startTransition(async () => {
            const res = await getTeacherDashboard(courseId);
            if (res.ok) {
                setData(res.data);
                setError(null);
            } else {
                setData(null);
                setError(res.message);
            }
        });
    }, [courseId]);

    if (courses.length === 0) {
        return (
            <div className="teacher-dashboard">
                <div className="td-empty">
                    <Icon name="layers" size={28} />
                    <h2>Пока нет курсов</h2>
                    <p>
                        Аналитика появится, как только у вас будет хотя бы один
                        опубликованный курс со студентами.
                    </p>
                </div>
            </div>
        );
    }

    const students = data?.students ?? [];
    const total = students.length;
    const atRisk = data?.at_risk_students ?? 0;
    const onTrack = Math.max(0, total - atRisk);
    const avgProgress = total
        ? Math.round(
              students.reduce((sum, s) => sum + s.progress_percentage, 0) /
                  total,
          )
        : 0;

    return (
        <div className="teacher-dashboard">
            <header className="td-header">
                <div>
                    <h1 className="td-title">Аналитика обучения</h1>
                    <p className="td-subtitle">
                        Отслеживайте прогресс и вовремя замечайте отстающих
                        студентов.
                    </p>
                </div>
                <div className="td-course-picker">
                    <span className="td-course-picker__label">Курс</span>
                    <Select
                        selectValues={courseOptions}
                        value={courseId}
                        onChange={setCourseId}
                    />
                </div>
            </header>

            <section className="td-cards">
                <div className="td-card">
                    <span className="td-card__label">Всего студентов</span>
                    <span className="td-card__value">{total}</span>
                    <span className="td-card__hint">
                        {pluralizeStudents(total)} на курсе
                    </span>
                </div>
                <div className="td-card td-card--risk">
                    <span className="td-card__label">В зоне риска</span>
                    <span className="td-card__value">{atRisk}</span>
                    <span className="td-card__hint">
                        низкий прогресс или нет активности
                    </span>
                </div>
                <div className="td-card td-card--ok">
                    <span className="td-card__label">На треке</span>
                    <span className="td-card__value">{onTrack}</span>
                    <span className="td-card__hint">учатся в нормальном темпе</span>
                </div>
                <div className="td-card">
                    <span className="td-card__label">Средний прогресс</span>
                    <span className="td-card__value">{avgProgress}%</span>
                    <span className="td-card__hint">по всему курсу</span>
                </div>
            </section>

            <section className="td-table">
                <div className="td-table__head">
                    <span>Студент</span>
                    <span>Прогресс</span>
                    <span>Статус</span>
                    <span>Неактивен</span>
                </div>

                {isPending && (
                    <div className="td-state">Загрузка аналитики…</div>
                )}

                {!isPending && error && (
                    <div className="td-state td-state--error">{error}</div>
                )}

                {!isPending && !error && total === 0 && (
                    <div className="td-state">
                        На этом курсе пока нет записанных студентов.
                    </div>
                )}

                {!isPending &&
                    !error &&
                    students.map((s) => (
                        <StudentRow key={s.student_id} student={s} />
                    ))}
            </section>
        </div>
    );
}
