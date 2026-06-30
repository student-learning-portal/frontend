'use client';

import './coursePage.css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Course } from '@/models/Course';
import { getCourseById, getMyCourses } from '@/lib/api/courses';
import { checkout, refund } from '@/lib/api/purchase';
import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';

function formatMoney(amount: number, _currency?: string): string {
    void _currency;
    return `${amount.toLocaleString('ru-RU')} ₽`;
}

export default function CourseDetail() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') ?? '';

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

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let active = true;
        (async () => {
            const [data, myCourses] = await Promise.all([
                getCourseById(id),
                getMyCourses(),
            ]);
            if (!active) return;
            setCourse(data);
            setNotFound(!data);
            setOwned(myCourses.some((c) => c.id === id));
            setLoading(false);
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
                setFeedback({
                    type: 'success',
                    text: `Оплата прошла успешно. Остаток на кошельке: ${formatMoney(
                        res.data.balance,
                        res.data.currency,
                    )}.`,
                });
            } else {
                setFeedback({ type: 'error', text: res.message });
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
                setFeedback({
                    type: 'success',
                    text: `Курс возвращён. На кошелёк зачислено ${formatMoney(
                        res.data.amount,
                        res.data.currency,
                    )}. Баланс: ${formatMoney(
                        res.data.balance,
                        res.data.currency,
                    )}.`,
                });
            } else {
                setFeedback({ type: 'error', text: res.message });
            }
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

                    {course.description && (
                        <p className="course-main__description">
                            {course.description}
                        </p>
                    )}

                    <div className="course-teacher">
                        <span className="course-teacher__avatar">ПР</span>
                        <span className="course-teacher__meta">
                            <span className="course-teacher__name">
                                Преподаватель
                            </span>
                            <span className="course-teacher__hint">
                                Информация появится позже
                            </span>
                        </span>
                    </div>

                    <section className="course-content">
                        <h2 className="course-content__title">
                            Содержание курса
                        </h2>

                        {owned ? (
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
                                    Уроки закрыты. Купите курс, чтобы открыть
                                    доступ.
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

                    <div
                        className={`course-buybox__status course-buybox__status--${
                            owned ? 'unlocked' : 'locked'
                        }`}
                    >
                        <Icon name={owned ? 'check' : 'lock'} size={14} />
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
                                {isPending ? 'Обработка…' : 'Вернуть курс'}
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
                            Виртуальный кошелёк:{' '}
                            <strong>{formatMoney(balance, currency)}</strong>
                        </div>
                    )}

                    <p className="course-buybox__note">
                        Оплата происходит в песочнице — реальные деньги не
                        списываются.
                    </p>
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
                                    ? Сумма спишется с виртуального кошелька.
                                </>
                            ) : (
                                <>
                                    Вернуть курс «{course.title}»? Доступ будет
                                    закрыт, а{' '}
                                    <strong>
                                        {formatMoney(course.price, currency)}
                                    </strong>{' '}
                                    вернётся на кошелёк.
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
