'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';
import { createCourse } from '@/lib/api/teacherCourses';

export default function NewCourseForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [price, setPrice] = useState('0');
    const [currency, setCurrency] = useState('USD');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const parsedPrice = Number(price);
        if (!title.trim()) {
            setError('Укажите название курса.');
            return;
        }
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setError('Цена должна быть числом не меньше нуля.');
            return;
        }

        startTransition(async () => {
            const res = await createCourse({
                title: title.trim(),
                description: description.trim(),
                subject: subject.trim(),
                price: parsedPrice,
                currency: currency.trim(),
            });
            if (res.ok) {
                router.push(`/dashboard/teacher/courses/${res.data.id}`);
            } else {
                setError(res.message);
            }
        });
    }

    return (
        <div className="tf-page">
            <Link href="/dashboard/teacher/courses" className="tf-back">
                <Icon name="arrowLeft" size={16} />К курсам
            </Link>

            <header className="tf-head">
                <div>
                    <h1 className="tf-title">Новый курс</h1>
                    <p className="tf-subtitle">
                        Курс создаётся черновиком — опубликуйте его, когда
                        добавите уроки.
                    </p>
                </div>
            </header>

            <section className="tf-card">
                {error && <div className="tf-notice tf-notice--error">{error}</div>}

                <form className="tf-form" onSubmit={handleSubmit}>
                    <label className="tf-field">
                        <span className="tf-label">Название</span>
                        <input
                            className="tf-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например, «Go с нуля»"
                        />
                    </label>

                    <label className="tf-field">
                        <span className="tf-label">Описание</span>
                        <textarea
                            className="tf-input tf-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="О чём курс, для кого он подойдёт"
                        />
                    </label>

                    <div className="tf-grid">
                        <label className="tf-field">
                            <span className="tf-label">Предмет</span>
                            <input
                                className="tf-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="programming"
                            />
                        </label>
                        <label className="tf-field">
                            <span className="tf-label">Валюта</span>
                            <input
                                className="tf-input"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                placeholder="USD"
                            />
                        </label>
                    </div>

                    <label className="tf-field">
                        <span className="tf-label">Цена</span>
                        <input
                            className="tf-input"
                            type="number"
                            min={0}
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </label>

                    <div className="tf-actions">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Создание…' : 'Создать курс'}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
