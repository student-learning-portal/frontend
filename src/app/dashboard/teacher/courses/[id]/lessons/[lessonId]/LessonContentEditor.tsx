'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { LessonData, LessonMaterial } from '@/models/Lesson';
import Button from '@/components/UI/Button/Button';
import Select from '@/components/UI/Select/Select';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    addMaterial,
    deleteLessonMedia,
    deleteMaterial,
    setLessonMedia,
    uploadLessonMedia,
    uploadMaterial,
} from '@/lib/api/teacherCourses';

const MEDIA_TYPE_OPTIONS = [
    { title: 'Видео', value: 'video' },
    { title: 'Аудио', value: 'audio' },
];

const MEDIA_UPLOAD_ACCEPT = 'video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg';
const MATERIAL_UPLOAD_ACCEPT = 'application/pdf,application/zip,image/jpeg,image/png';

type Notice = { type: 'success' | 'error'; text: string };
type Source = 'url' | 'file';

// readMediaDuration loads a video/audio file into a hidden, detached <video>
// element just long enough to read its .duration from loadedmetadata — the
// browser has already decoded the container's metadata locally, so this
// avoids asking the teacher to type the duration in by hand.
function readMediaDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        const el = document.createElement('video');
        const url = URL.createObjectURL(file);
        el.preload = 'metadata';
        el.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : 0);
        };
        el.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
        };
        el.src = url;
    });
}

export default function LessonContentEditor({
    courseId,
    courseTitle,
    lesson,
}: {
    courseId: string;
    courseTitle: string;
    lesson: LessonData;
}) {
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    const [notice, setNotice] = useState<Notice | null>(null);

    // Показывает сообщение и во всплывашке, и на странице урока.
    function notify(n: Notice) {
        setNotice(n);
        if (n.type === 'error') toast.error(n.text);
        else toast.success(n.text);
    }

    const [mediaSource, setMediaSource] = useState<Source>('url');
    const [mediaUrl, setMediaUrl] = useState(lesson.content_url);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
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
    const [materialSource, setMaterialSource] = useState<Source>('url');
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialUrl, setMaterialUrl] = useState('');
    const [materialType, setMaterialType] = useState('pdf');
    const [materialFile, setMaterialFile] = useState<File | null>(null);

    async function handleMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setMediaFile(file);
        if (file) {
            const detected = await readMediaDuration(file);
            if (detected > 0) setDuration(String(detected));
            if (file.type.startsWith('audio/')) setMediaType('audio');
            else if (file.type.startsWith('video/')) setMediaType('video');
        }
    }

    function handleSaveMedia(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);

        if (mediaSource === 'file') {
            if (!mediaFile) {
                notify({ type: 'error', text: 'Выберите файл.' });
                return;
            }
            const parsedDuration = Number(duration) || 0;
            startTransition(async () => {
                const res = await uploadLessonMedia(
                    courseId,
                    lesson.lesson_id,
                    mediaFile,
                    parsedDuration,
                );
                if (res.ok) {
                    setHasMedia(true);
                    setMediaFile(null);
                    notify({ type: 'success', text: 'Медиафайл загружен.' });
                } else {
                    notify({ type: 'error', text: res.message });
                }
            });
            return;
        }

        if (!mediaUrl.trim()) {
            notify({ type: 'error', text: 'Укажите ссылку на файл.' });
            return;
        }
        const parsedDuration = Number(duration);
        if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
            notify({
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
                notify({ type: 'success', text: 'Медиафайл сохранён.' });
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleRemoveMedia() {
        setNotice(null);
        startTransition(async () => {
            const res = await deleteLessonMedia(courseId, lesson.lesson_id);
            if (res.ok) {
                setMediaUrl('');
                setMediaFile(null);
                setDuration('0');
                setHasMedia(false);
                notify({ type: 'success', text: 'Медиафайл удалён.' });
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleAddMaterial(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);

        if (materialSource === 'file') {
            if (!materialFile) {
                notify({ type: 'error', text: 'Выберите файл.' });
                return;
            }
            startTransition(async () => {
                const res = await uploadMaterial(
                    courseId,
                    lesson.lesson_id,
                    materialFile,
                    materialTitle.trim(),
                );
                if (res.ok) {
                    setMaterials((prev) => [...prev, res.data]);
                    setMaterialTitle('');
                    setMaterialFile(null);
                } else {
                    notify({ type: 'error', text: res.message });
                }
            });
            return;
        }

        if (!materialTitle.trim() || !materialUrl.trim()) {
            notify({
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
                notify({ type: 'error', text: res.message });
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
                notify({ type: 'error', text: res.message });
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
                    <div className="tf-source-toggle">
                        <button
                            type="button"
                            className={`tf-source-toggle__btn${mediaSource === 'url' ? ' tf-source-toggle__btn--active' : ''}`}
                            onClick={() => setMediaSource('url')}
                        >
                            По ссылке
                        </button>
                        <button
                            type="button"
                            className={`tf-source-toggle__btn${mediaSource === 'file' ? ' tf-source-toggle__btn--active' : ''}`}
                            onClick={() => setMediaSource('file')}
                        >
                            Загрузить файл
                        </button>
                    </div>
                    <form className="tf-form" onSubmit={handleSaveMedia}>
                        {mediaSource === 'url' ? (
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
                        ) : (
                            <label className="tf-field">
                                <span className="tf-label">
                                    Файл (mp4, webm, mp3, wav, ogg — до 500 МБ)
                                </span>
                                <input
                                    className="tf-input"
                                    type="file"
                                    accept={MEDIA_UPLOAD_ACCEPT}
                                    onChange={handleMediaFileChange}
                                />
                            </label>
                        )}
                        <div className="tf-grid">
                            <label className="tf-field">
                                <span className="tf-label">
                                    Длительность (сек.)
                                    {mediaSource === 'file' &&
                                        ' — определяется автоматически'}
                                </span>
                                <input
                                    className="tf-input"
                                    type="number"
                                    min={0}
                                    value={duration}
                                    onChange={(e) =>
                                        setDuration(e.target.value)
                                    }
                                    disabled={
                                        mediaSource === 'file' && !mediaFile
                                    }
                                />
                            </label>
                            {mediaSource === 'url' && (
                                <label className="tf-field">
                                    <span className="tf-label">Тип</span>
                                    <Select
                                        selectValues={MEDIA_TYPE_OPTIONS}
                                        value={mediaType}
                                        onChange={setMediaType}
                                    />
                                </label>
                            )}
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

                <div className="tf-source-toggle">
                    <button
                        type="button"
                        className={`tf-source-toggle__btn${materialSource === 'url' ? ' tf-source-toggle__btn--active' : ''}`}
                        onClick={() => setMaterialSource('url')}
                    >
                        По ссылке
                    </button>
                    <button
                        type="button"
                        className={`tf-source-toggle__btn${materialSource === 'file' ? ' tf-source-toggle__btn--active' : ''}`}
                        onClick={() => setMaterialSource('file')}
                    >
                        Загрузить файл
                    </button>
                </div>

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
                    {materialSource === 'url' ? (
                        <>
                            <label className="tf-field">
                                <span className="tf-label">Ссылка</span>
                                <input
                                    className="tf-input"
                                    value={materialUrl}
                                    onChange={(e) =>
                                        setMaterialUrl(e.target.value)
                                    }
                                    placeholder="https://cdn.example.com/notes.pdf"
                                />
                            </label>
                            <label className="tf-field">
                                <span className="tf-label">Тип</span>
                                <input
                                    className="tf-input"
                                    value={materialType}
                                    onChange={(e) =>
                                        setMaterialType(e.target.value)
                                    }
                                    placeholder="pdf"
                                />
                            </label>
                        </>
                    ) : (
                        <label className="tf-field">
                            <span className="tf-label">
                                Файл (pdf, zip, jpeg, png — до 50 МБ)
                            </span>
                            <input
                                className="tf-input"
                                type="file"
                                accept={MATERIAL_UPLOAD_ACCEPT}
                                onChange={(e) =>
                                    setMaterialFile(
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                    )}
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
