'use client';

import './teacherDashboard.css';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Course } from '@/models/Course';
import { SelectOption } from '@/types/selectOption';
import Select from '@/components/UI/Select/Select';
import SearchBar from '@/components/SearchBar/SearchBar';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    DashboardStudent,
    TeacherDashboard,
    getTeacherDashboard,
} from '@/lib/api/analytics';

type SortField = 'name' | 'progress' | 'status' | 'inactive';
type SortDir = 'asc' | 'desc';

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

function pluralizeLessons(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'урок';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
        return 'урока';
    return 'уроков';
}

const lastActiveFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

function formatLastActive(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : lastActiveFormatter.format(date);
}

// inactivityRank orders learners from most to least active for the "Неактивен"
// column. A learner who has never started (no last_activity) is treated as
// maximally inactive so they surface at the top regardless of their
// days_inactive, which the backend reports as 0 for never-active learners.
function inactivityRank(s: DashboardStudent): number {
    if (!s.last_activity) return Number.POSITIVE_INFINITY;
    return s.days_inactive ?? 0;
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

function studentName(s: DashboardStudent): string {
    return s.full_name || s.student_id;
}

// compareBy returns the ascending comparison for a given field; the caller
// flips the sign for descending order.
function compareBy(
    field: SortField,
    a: DashboardStudent,
    b: DashboardStudent,
): number {
    switch (field) {
        case 'name':
            return studentName(a).localeCompare(studentName(b), 'ru');
        case 'progress':
            return a.progress_percentage - b.progress_percentage;
        case 'status':
            // AT_RISK before ON_TRACK in ascending order (worst first).
            return (
                (a.status === 'AT_RISK' ? 0 : 1) -
                (b.status === 'AT_RISK' ? 0 : 1)
            );
        case 'inactive': {
            // Compare ranks directly rather than subtracting: two never-started
            // learners both rank Infinity, and Infinity - Infinity is NaN.
            const ra = inactivityRank(a);
            const rb = inactivityRank(b);
            return ra === rb ? 0 : ra < rb ? -1 : 1;
        }
    }
}

function SortHeader({
    label,
    field,
    activeField,
    dir,
    onSort,
}: {
    label: string;
    field: SortField;
    activeField: SortField;
    dir: SortDir;
    onSort: (field: SortField) => void;
}) {
    const active = activeField === field;
    return (
        <button
            type="button"
            className={'td-th' + (active ? ' td-th--active' : '')}
            onClick={() => onSort(field)}
            aria-label={`Сортировать по «${label}»`}
        >
            <span>{label}</span>
            <Icon
                size={14}
                name={active && dir === 'asc' ? 'chevronUp' : 'chevronDown'}
                className={
                    'td-th__caret' + (active ? ' td-th__caret--active' : '')
                }
            />
        </button>
    );
}

function StudentRow({ student }: { student: DashboardStudent }) {
    const atRisk = student.status === 'AT_RISK';
    const progress = Math.round(student.progress_percentage);
    const days = student.days_inactive ?? 0;
    const lessonsTotal = student.lessons_total ?? 0;
    const lessonsCompleted = student.lessons_completed ?? 0;
    const started = Boolean(student.last_activity);

    return (
        <div className="td-row">
            <div className="td-row__student">
                <span className="td-avatar">
                    {initials(student.full_name, student.student_id)}
                </span>
                <span className="td-row__name">{studentName(student)}</span>
            </div>
            <div className="td-row__progress">
                <div className="td-progress__track">
                    <div className="td-progress">
                        <div
                            className={
                                'td-progress__bar' +
                                (atRisk ? ' td-progress__bar--risk' : '')
                            }
                            style={{
                                width: `${Math.min(100, Math.max(0, progress))}%`,
                            }}
                        />
                    </div>
                    <span className="td-progress__value">{progress}%</span>
                </div>
                {lessonsTotal > 0 && (
                    <span className="td-progress__lessons">
                        {lessonsCompleted} из {lessonsTotal}{' '}
                        {pluralizeLessons(lessonsTotal)}
                    </span>
                )}
            </div>
            <div className="td-row__status">
                <span
                    className={
                        'td-badge ' +
                        (atRisk ? 'td-badge--risk' : 'td-badge--ok')
                    }
                >
                    <Icon size={14} name={atRisk ? 'alert' : 'checkCircle'} />
                    {atRisk ? 'В зоне риска' : 'На треке'}
                </span>
            </div>
            <div className="td-row__inactive">
                {!started ? (
                    <span className="td-row__never">Не начинал(а)</span>
                ) : (
                    <span
                        title={
                            student.last_activity
                                ? `Последняя активность: ${formatLastActive(student.last_activity)}`
                                : undefined
                        }
                    >
                        {days > 0 ? `${days} ${pluralizeDays(days)}` : 'Сегодня'}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function TeacherAnalytics({ courses }: { courses: Course[] }) {
    const courseOptions: SelectOption[] = useMemo(
        () => courses.map((c) => ({ title: c.title, value: c.id })),
        [courses],
    );

    const toast = useToast();
    const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
    const [data, setData] = useState<TeacherDashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [query, setQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('progress');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

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
                toast.error(res.message);
            }
        });
    }, [courseId, toast]);

    const students = useMemo(() => data?.students ?? [], [data]);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const visibleStudents = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? students.filter((s) => studentName(s).toLowerCase().includes(q))
            : students;

        const sign = sortDir === 'asc' ? 1 : -1;
        return [...filtered].sort((a, b) => sign * compareBy(sortField, a, b));
    }, [students, query, sortField, sortDir]);

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

    const total = students.length;
    const atRisk = data?.at_risk_students ?? 0;
    const onTrack = Math.max(0, total - atRisk);
    const avgProgress = total
        ? Math.round(
              students.reduce((sum, s) => sum + s.progress_percentage, 0) /
                  total,
          )
        : 0;

    const showRows = !isPending && !error;

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
                    <span className="td-card__hint">
                        учатся в нормальном темпе
                    </span>
                </div>
                <div className="td-card">
                    <span className="td-card__label">Средний прогресс</span>
                    <span className="td-card__value">{avgProgress}%</span>
                    <span className="td-card__hint">по всему курсу</span>
                </div>
            </section>

            <div className="td-toolbar">
                <div className="td-search">
                    <SearchBar
                        value={query}
                        onChange={setQuery}
                        placeholder="Поиск по имени студента"
                    />
                </div>
                {showRows && total > 0 && (
                    <span className="td-toolbar__count">
                        {visibleStudents.length} из {total}
                    </span>
                )}
            </div>

            <section className="td-table">
                <div className="td-table__head">
                    <SortHeader
                        label="Студент"
                        field="name"
                        activeField={sortField}
                        dir={sortDir}
                        onSort={handleSort}
                    />
                    <SortHeader
                        label="Прогресс"
                        field="progress"
                        activeField={sortField}
                        dir={sortDir}
                        onSort={handleSort}
                    />
                    <SortHeader
                        label="Статус"
                        field="status"
                        activeField={sortField}
                        dir={sortDir}
                        onSort={handleSort}
                    />
                    <SortHeader
                        label="Неактивен"
                        field="inactive"
                        activeField={sortField}
                        dir={sortDir}
                        onSort={handleSort}
                    />
                </div>

                <div className="td-table__body">
                    {isPending && (
                        <div className="td-state">Загрузка аналитики…</div>
                    )}

                    {!isPending && error && (
                        <div className="td-state td-state--error">{error}</div>
                    )}

                    {showRows && total === 0 && (
                        <div className="td-state">
                            На этом курсе пока нет записанных студентов.
                        </div>
                    )}

                    {showRows && total > 0 && visibleStudents.length === 0 && (
                        <div className="td-state">
                            Никого не нашлось по запросу «{query.trim()}».
                        </div>
                    )}

                    {showRows &&
                        visibleStudents.map((s) => (
                            <StudentRow key={s.student_id} student={s} />
                        ))}
                </div>
            </section>
        </div>
    );
}
