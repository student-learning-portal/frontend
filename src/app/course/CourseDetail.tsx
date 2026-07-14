'use client';

import './coursePage.css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Course } from '@/models/Course';
import { getCourseById, getMyCourses } from '@/lib/api/courses';
import { checkout, refund } from '@/lib/api/purchase';
import { getTeacher, Teacher } from '@/lib/api/teachers';
import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';
import { emitCoinBalanceUpdate } from '@/components/CoinBalance/coinBalanceEvents';
import { useToast } from '@/components/Toast/ToastProvider';
import StarRating from '@/components/StarRating/StarRating';
import {
    getCourseRatingSummary,
    getMyCourseRating,
    rateCourse,
    getTeacherRatingSummary,
    getMyTeacherRating,
    rateTeacher,
    RatingSummary,
} from '@/lib/api/ratings';

function formatScore(value: number): string {
    return value.toFixed(1).replace('.', ',');
}

function pluralizeRatings(count: number): string {
    const m10 = count % 10;
    const m100 = count % 100;
    if (m10 === 1 && m100 !== 11) return 'оценка';
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'оценки';
    return 'оценок';
}

function formatMoney(amount: number, _currency?: string): string {
    void _currency;
    return `${amount.toLocaleString('ru-RU')} 🪙`;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (
        ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'ПР'
    );
}

export default function CourseDetail() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') ?? '';
    const { data: session } = useSession();
    const toast = useToast();
    const isTeacher = session?.user?.role === 'teacher';

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [owned, setOwned] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{
        type: 'error' | 'success';
        text: string;
    } | null>(null);

    const [confirming, setConfirming] = useState<null | 'buy' | 'refund'>(null);
    const [teacher, setTeacher] = useState<Teacher | null>(null);

    const [courseRating, setCourseRating] = useState<RatingSummary | null>(null);
    const [myCourseScore, setMyCourseScore] = useState<number | null>(null);
    const [teacherRating, setTeacherRating] = useState<RatingSummary | null>(
        null,
    );
    const [myTeacherScore, setMyTeacherScore] = useState<number | null>(null);
    const [ratingBusy, setRatingBusy] = useState(false);

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let active = true;
        (async () => {
            const [data, myCourses, courseSummary, myCourse] =
                await Promise.all([
                    getCourseById(id),
                    getMyCourses(),
                    getCourseRatingSummary(id),
                    getMyCourseRating(id),
                ]);
            if (!active) return;
            setCourse(data);
            setNotFound(!data);
            setOwned(myCourses.some((c) => c.id === id));
            setCourseRating(courseSummary);
            setMyCourseScore(myCourse);
            setLoading(false);

            if (data?.teacher_id) {
                const [t, teacherSummary, myTeacher] = await Promise.all([
                    getTeacher(data.teacher_id),
                    getTeacherRatingSummary(data.teacher_id),
                    getMyTeacherRating(data.teacher_id),
                ]);
                if (!active) return;
                setTeacher(t);
                setTeacherRating(teacherSummary);
                setMyTeacherScore(myTeacher);
            }
        })();
        return () => {
            active = false;
        };
    }, [id]);

    function doBuy() {
        if (!course) return;
        setConfirming(null);
        setFeedback(null);
        startTransition(async () => {
            const res = await checkout(course.id);
            if (res.ok) {
                setOwned(true);
                setBalance(res.data.balance);
                emitCoinBalanceUpdate(res.data.balance);
                const text = `Оплата прошла успешно. Баланс: ${formatMoney(
                    res.data.balance,
                    res.data.currency,
                )}.`;
                setFeedback({ type: 'success', text });
                toast.success(text);
            } else {
                setFeedback({ type: 'error', text: res.message });
                toast.error(res.message);
            }
        });
    }

    function doRefund() {
        if (!course) return;
        setConfirming(null);
        setFeedback(null);
        startTransition(async () => {
            const res = await refund(course.id);
            if (res.ok) {
                setOwned(false);
                setBalance(res.data.balance);
                emitCoinBalanceUpdate(res.data.balance);
                const text = `Курс возвращён. Начислено ${formatMoney(
                    res.data.amount,
                    res.data.currency,
                )}. Баланс: ${formatMoney(
                    res.data.balance,
                    res.data.currency,
                )}.`;
                setFeedback({ type: 'success', text });
                toast.success(text);
            } else {
                setFeedback({ type: 'error', text: res.message });
                toast.error(res.message);
            }
        });
    }

    function submitCourseRating(score: number) {
        if (!course || ratingBusy) return;
        setRatingBusy(true);
        startTransition(async () => {
            const res = await rateCourse(course.id, score);
            if (res.ok) {
                setMyCourseScore(res.score);
                const summary = await getCourseRatingSummary(course.id);
                setCourseRating(summary);
                toast.success(`Ваша оценка курса: ${res.score}/10`);
            } else {
                toast.error(res.message);
            }
            setRatingBusy(false);
        });
    }

    function submitTeacherRating(score: number) {
        if (!teacher || ratingBusy) return;
        setRatingBusy(true);
        startTransition(async () => {
            const res = await rateTeacher(teacher.id, score);
            if (res.ok) {
                setMyTeacherScore(res.score);
                const summary = await getTeacherRatingSummary(teacher.id);
                setTeacherRating(summary);
                toast.success(`Ваша оценка преподавателя: ${res.score}/10`);
            } else {
                toast.error(res.message);
            }
            setRatingBusy(false);
        });
    }

    if (loading) {
        return (
            <div className="course-page">
                <div className="course-page__state">Загрузка курса…</div>
            </div>
        );
    }

    if (notFound || !course) {
        return (
            <div className="course-page">
                <div className="course-page__state">
                    <h1 className="course-page__state-title">Курс не найден</h1>
                    <p className="course-page__state-text">
                        Возможно, курс был удалён или ссылка неверна.
                    </p>
                    <Link href="/catalog" className="course-page__back-link">
                        ← Вернуться в каталог
                    </Link>
                </div>
            </div>
        );
    }

    const currency = course.currency ?? 'USD';
    const isOwnCourse = isTeacher && course.teacher_id === session?.user?.id;

    return (
        <div className="course-page">
            <div className="course-page__grid">
                <main className="course-main">
                    <div className="course-main__tags">
                        <span className="course-tag">{course.subject}</span>
                        {course.status && (
                            <span
                                className="course-tag course-tag--muted"
                                data-status={course.status}
                            >
                                {course.status === 'published'
                                    ? 'Опубликован'
                                    : course.status === 'draft'
                                      ? 'Черновик'
                                      : 'В архиве'}
                            </span>
                        )}
                    </div>

                    <h1 className="course-main__title">{course.title}</h1>

                    {courseRating && (
                        <div className="course-rating-summary">
                            <StarRating
                                value={courseRating.average_score}
                                readOnly
                                size={18}
                            />
                            {courseRating.ratings_count > 0 ? (
                                <span className="course-rating-summary__text">
                                    <strong>
                                        {formatScore(
                                            courseRating.average_score,
                                        )}
                                    </strong>
                                    {' / 10 · '}
                                    {courseRating.ratings_count}{' '}
                                    {pluralizeRatings(
                                        courseRating.ratings_count,
                                    )}
                                </span>
                            ) : (
                                <span className="course-rating-summary__text course-rating-summary__text--muted">
                                    Пока нет оценок
                                </span>
                            )}
                        </div>
                    )}

                    {course.description && (
                        <p className="course-main__description">
                            {course.description}
                        </p>
                    )}

                    <div className="course-teacher">
                        <span className="course-teacher__avatar">
                            {teacher ? getInitials(teacher.full_name) : 'ПР'}
                        </span>
                        <span className="course-teacher__meta">
                            <span className="course-teacher__name">
                                {teacher?.full_name ?? 'Преподаватель'}
                            </span>
                            {teacher && teacherRating ? (
                                <span className="course-teacher__rating">
                                    <StarRating
                                        value={teacherRating.average_score}
                                        readOnly
                                        size={14}
                                    />
                                    <span className="course-teacher__hint">
                                        {teacherRating.ratings_count > 0
                                            ? `${formatScore(teacherRating.average_score)} / 10 · ${teacherRating.ratings_count} ${pluralizeRatings(teacherRating.ratings_count)}`
                                            : 'Преподаватель курса'}
                                    </span>
                                </span>
                            ) : (
                                <span className="course-teacher__hint">
                                    {teacher
                                        ? 'Преподаватель курса'
                                        : 'Загрузка…'}
                                </span>
                            )}
                        </span>
                    </div>

                    {!isTeacher && owned && (
                        <div className="course-rate">
                            <div className="course-rate__row">
                                <span className="course-rate__label">
                                    Оцените курс
                                </span>
                                <StarRating
                                    value={myCourseScore ?? 0}
                                    disabled={ratingBusy}
                                    size={22}
                                    onRate={submitCourseRating}
                                />
                                {myCourseScore != null && (
                                    <span className="course-rate__mine">
                                        Ваша оценка: {myCourseScore}/10
                                    </span>
                                )}
                            </div>
                            {teacher && (
                                <div className="course-rate__row">
                                    <span className="course-rate__label">
                                        Оцените преподавателя
                                    </span>
                                    <StarRating
                                        value={myTeacherScore ?? 0}
                                        disabled={ratingBusy}
                                        size={22}
                                        onRate={submitTeacherRating}
                                    />
                                    {myTeacherScore != null && (
                                        <span className="course-rate__mine">
                                            Ваша оценка: {myTeacherScore}/10
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <section className="course-content">
                        <h2 className="course-content__title">
                            Содержание курса
                        </h2>

                        {isOwnCourse ? (
                            <div className="course-room">
                                <div className="course-room__badge">
                                    <Icon name="check" size={18} />
                                    Ваш курс
                                </div>
                                <p className="course-room__text">
                                    Все уроки и материалы курса доступны.
                                </p>
                                <Link
                                    href={`/course/lessons?course=${course.id}`}
                                    className="course-room__cta"
                                >
                                    <Icon name="play" size={18} />
                                    Перейти к урокам
                                </Link>
                            </div>
                        ) : owned ? (
                            <div className="course-room">
                                <div className="course-room__badge">
                                    <Icon name="check" size={18} />
                                    Доступ открыт
                                </div>
                                <p className="course-room__text">
                                    Все уроки и материалы курса доступны.
                                </p>
                                <Link
                                    href={`/course/lessons?course=${course.id}`}
                                    className="course-room__cta"
                                >
                                    <Icon name="play" size={18} />
                                    Перейти к урокам
                                </Link>
                            </div>
                        ) : (
                            <div className="course-locked">
                                <span className="course-locked__icon">
                                    <Icon name="lock" size={26} />
                                </span>
                                <p className="course-locked__text">
                                    {isTeacher
                                        ? 'Покупка курсов недоступна для преподавателей.'
                                        : 'Уроки закрыты. Купите курс, чтобы открыть доступ.'}
                                </p>
                            </div>
                        )}
                    </section>
                </main>

                <aside className="course-buybox">
                    <div className="course-buybox__banner" />

                    <div className="course-buybox__price">
                        {formatMoney(course.price, currency)}
                    </div>

                    {isTeacher ? (
                        <>
                            <div
                                className={`course-buybox__status course-buybox__status--${isOwnCourse ? 'unlocked' : 'locked'}`}
                            >
                                <Icon
                                    name={isOwnCourse ? 'check' : 'lock'}
                                    size={14}
                                />
                                {isOwnCourse ? 'Ваш курс' : 'Недоступно'}
                            </div>
                            {isOwnCourse ? (
                                <div className="course-buybox__actions">
                                    <Link
                                        href={`/course/lessons?course=${course.id}`}
                                        className="course-room__cta"
                                    >
                                        <Icon name="play" size={18} />
                                        Перейти к урокам
                                    </Link>
                                </div>
                            ) : (
                                <p className="course-buybox__note">
                                    Покупка курсов недоступна для
                                    преподавателей.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <div
                                className={`course-buybox__status course-buybox__status--${owned ? 'unlocked' : 'locked'}`}
                            >
                                <Icon
                                    name={owned ? 'check' : 'lock'}
                                    size={14}
                                />
                                {owned ? 'Курс куплен' : 'Нет доступа'}
                            </div>

                            {feedback && (
                                <div
                                    className={`course-buybox__feedback course-buybox__feedback--${feedback.type}`}
                                >
                                    {feedback.text}
                                </div>
                            )}

                            {owned ? (
                                <div className="course-buybox__actions">
                                    <Button disabled>Открыть курс</Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setConfirming('refund')}
                                        disabled={isPending}
                                    >
                                        {isPending
                                            ? 'Обработка…'
                                            : 'Вернуть курс'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="course-buybox__actions">
                                    <Button
                                        onClick={() => setConfirming('buy')}
                                        disabled={isPending}
                                    >
                                        {isPending
                                            ? 'Обработка…'
                                            : `Купить за ${formatMoney(course.price, currency)}`}
                                    </Button>
                                </div>
                            )}

                            {balance !== null && (
                                <div className="course-buybox__wallet">
                                    Баланс:{' '}
                                    <strong>
                                        {formatMoney(balance, currency)}
                                    </strong>
                                </div>
                            )}

                            <p className="course-buybox__note">
                                Оплата происходит 🪙 в песочнице — реальные
                                деньги не списываются.
                            </p>
                        </>
                    )}
                </aside>
            </div>

            {confirming && (
                <div
                    className="confirm-overlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => !isPending && setConfirming(null)}
                >
                    <div
                        className="confirm-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="confirm-dialog__title">
                            {confirming === 'buy'
                                ? 'Подтверждение оплаты'
                                : 'Подтверждение возврата'}
                        </h3>
                        <p className="confirm-dialog__text">
                            {confirming === 'buy' ? (
                                <>
                                    Купить курс «{course.title}» за{' '}
                                    <strong>
                                        {formatMoney(course.price, currency)}
                                    </strong>
                                    ? Монеты спишутся с баланса.
                                </>
                            ) : (
                                <>
                                    Вернуть курс «{course.title}»? Доступ будет
                                    закрыт, а{' '}
                                    <strong>
                                        {formatMoney(course.price, currency)}
                                    </strong>{' '}
                                    вернутся на баланс.
                                </>
                            )}
                        </p>
                        <div className="confirm-dialog__actions">
                            <Button
                                variant="secondary"
                                onClick={() => setConfirming(null)}
                                disabled={isPending}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={
                                    confirming === 'buy' ? doBuy : doRefund
                                }
                                disabled={isPending}
                            >
                                {isPending
                                    ? 'Обработка…'
                                    : confirming === 'buy'
                                      ? 'Оплатить'
                                      : 'Вернуть'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
