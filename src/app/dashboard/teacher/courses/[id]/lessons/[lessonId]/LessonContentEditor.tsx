'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { LessonData, LessonMaterial } from '@/models/Lesson';
import Button from '@/components/UI/Button/Button';
import Select from '@/components/UI/Select/Select';
import Icon from '@/components/UI/Icon/Icon';
import {
    addMaterial,
    deleteLessonMedia,
    deleteMaterial,
    setLessonMedia,
} from '@/lib/api/teacherCourses';

const MEDIA_TYPE_OPTIONS = [
    { title: 'Видео', value: 'video' },
    { title: 'Аудио', value: 'audio' },
];

type Notice = { type: 'success' | 'error'; text: string };

export default function LessonContentEditor({
    courseId,
    courseTitle,
    lesson,
}: {
    courseId: string;
    courseTitle: string;
    lesson: LessonData;
}) {
    const [isPending, startTransition] = useTransition();
    const [notice, setNotice] = useState<Notice | null>(null);

    const [mediaUrl, setMediaUrl] = useState(lesson.content_url);
    const [duration, setDuration] = useState(
        String(lesson.duration_seconds || 0),
    );
    const [mediaType, setMediaType] = useState<string>(
        lesson.media_type ?? 'video',
    );
    const [hasMedia, setHasMedia] = useState(Boolean(lesson.content_url));

    const [materials, setMaterials] = useState<LessonMaterial[]>(
        lesson.materials,
    );
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialUrl, setMaterialUrl] = useState('');
    const [materialType, setMaterialType] = useState('pdf');

    function handleSaveMedia(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);
        if (!mediaUrl.trim()) {
            setNotice({ type: 'error', text: 'Укажите ссылку на файл.' });
            return;
        }
        const parsedDuration = Number(duration);
        if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
            setNotice({
                type: 'error',
                text: 'Длительность должна быть числом не меньше нуля.',
            });
            return;
        }

        startTransition(async () => {
            const res = await setLessonMedia(
                courseId,
                lesson.lesson_id,
                mediaUrl.trim(),
                parsedDuration,
                mediaType as 'video' | 'audio',
            );
            if (res.ok) {
                setHasMedia(true);
                setNotice({ type: 'success', text: 'Медиафайл сохранён.' });
            } else {
                setNotice({ type: 'error', text: res.message });
            }
        });
    }

    function handleRemoveMedia() {
        setNotice(null);
        startTransition(async () => {
            const res = await deleteLessonMedia(courseId, lesson.lesson_id);
            if (res.ok) {
                setMediaUrl('');
                setDuration('0');
                setHasMedia(false);
                setNotice({ type: 'success', text: 'Медиафайл удалён.' });
            } else {
                setNotice({ type: 'error', text: res.message });
            }
        });
    }

    function handleAddMaterial(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);
        if (!materialTitle.trim() || !materialUrl.trim()) {
            setNotice({
                type: 'error',
                text: 'Укажите название и ссылку на материал.',
            });
            return;
        }
        startTransition(async () => {
            const res = await addMaterial(
                courseId,
                lesson.lesson_id,
                materialTitle.trim(),
                materialUrl.trim(),
                materialType.trim() || 'file',
            );
            if (res.ok) {
                setMaterials((prev) => [...prev, res.data]);
                setMaterialTitle('');
                setMaterialUrl('');
            } else {
                setNotice({ type: 'error', text: res.message });
            }
        });
    }

    function handleDeleteMaterial(materialId: string | undefined) {
        if (!materialId) return;
        setNotice(null);
        startTransition(async () => {
            const res = await deleteMaterial(
                courseId,
                lesson.lesson_id,
                materialId,
            );
            if (res.ok) {
                setMaterials((prev) => prev.filter((m) => m.id !== materialId));
            } else {
                setNotice({ type: 'error', text: res.message });
            }
        });
    }

    return (
        <div className="tf-page">
            <Link
                href={`/dashboard/teacher/courses/${courseId}`}
                className="tf-back"
            >
                <Icon name="arrowLeft" size={16} />К курсу «{courseTitle}»
            </Link>

            <header className="tf-head">
                <div>
                    <h1 className="tf-title">{lesson.title}</h1>
                    <p className="tf-subtitle">
                        Медиафайл и дополнительные материалы урока
                    </p>
                </div>
                <Link
                    href={`/course/lesson?course=${courseId}&lesson=${lesson.lesson_id}`}
                    target="_blank"
                    className="tf-back"
                >
                    <Icon name="play" size={16} />
                    Предпросмотр
                </Link>
            </header>

            {notice && (
                <div className={`tf-notice tf-notice--${notice.type}`}>
                    {notice.text}
                </div>
            )}

            <section className="tf-section">
                <div className="tf-section__head">
                    <h2 className="tf-section__title">Медиафайл</h2>
                </div>
                <div className="tf-card">
                    <form className="tf-form" onSubmit={handleSaveMedia}>
                        <label className="tf-field">
                            <span className="tf-label">
                                Ссылка на видео/аудио
                            </span>
                            <input
                                className="tf-input"
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                placeholder="https://cdn.example.com/lesson.mp4"
                            />
                        </label>
                        <div className="tf-grid">
                            <label className="tf-field">
                                <span className="tf-label">
                                    Длительность (сек.)
                                </span>
                                <input
                                    className="tf-input"
                                    type="number"
                                    min={0}
                                    value={duration}
                                    onChange={(e) =>
                                        setDuration(e.target.value)
                                    }
                                />
                            </label>
                            <label className="tf-field">
                                <span className="tf-label">Тип</span>
                                <Select
                                    selectValues={MEDIA_TYPE_OPTIONS}
                                    value={mediaType}
                                    onChange={setMediaType}
                                />
                            </label>
                        </div>
                        <div className="tf-actions">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Сохранение…' : 'Сохранить'}
                            </Button>
                            {hasMedia && (
                                <button
                                    type="button"
                                    className="tf-danger-link"
                                    disabled={isPending}
                                    onClick={handleRemoveMedia}
                                >
                                    Удалить медиафайл
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </section>

            <section className="tf-section">
                <div className="tf-section__head">
                    <h2 className="tf-section__title">
                        Материалы ({materials.length})
                    </h2>
                </div>

                {materials.length === 0 ? (
                    <div className="tf-empty">
                        К уроку пока не прикреплены материалы.
                    </div>
                ) : (
                    <div className="tf-lesson-list">
                        {materials.map((m, idx) => (
                            <div
                                className="tf-material-row"
                                key={m.id ?? `${m.url}-${idx}`}
                            >
                                <Icon name="fileText" size={18} />
                                <div className="tf-material-row__main">
                                    <span className="tf-material-row__title">
                                        {m.title}
                                    </span>
                                    <span className="tf-material-row__meta">
                                        {m.type} · {m.url}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="tf-icon-btn tf-icon-btn--danger"
                                    disabled={isPending || !m.id}
                                    onClick={() => handleDeleteMaterial(m.id)}
                                    aria-label="Удалить материал"
                                >
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form className="tf-inline-form" onSubmit={handleAddMaterial}>
                    <label className="tf-field">
                        <span className="tf-label">Название</span>
                        <input
                            className="tf-input"
                            value={materialTitle}
                            onChange={(e) => setMaterialTitle(e.target.value)}
                            placeholder="Конспект урока"
                        />
                    </label>
                    <label className="tf-field">
                        <span className="tf-label">Ссылка</span>
                        <input
                            className="tf-input"
                            value={materialUrl}
                            onChange={(e) => setMaterialUrl(e.target.value)}
                            placeholder="https://cdn.example.com/notes.pdf"
                        />
                    </label>
                    <label className="tf-field">
                        <span className="tf-label">Тип</span>
                        <input
                            className="tf-input"
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value)}
                            placeholder="pdf"
                        />
                    </label>
                    <div className="tf-actions">
                        <Button type="submit" disabled={isPending}>
                            <Icon name="plus" size={16} />
                            Добавить
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
