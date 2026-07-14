'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Course } from '@/models/Course';
import { LessonSummary, LessonType } from '@/models/Lesson';
import Button from '@/components/UI/Button/Button';
import Select from '@/components/UI/Select/Select';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    createLesson,
    deleteCourse,
    deleteLesson,
    reorderLessons,
    updateCourse,
    updateLesson,
} from '@/lib/api/teacherCourses';

const STATUS_OPTIONS = [
    { title: 'Черновик', value: 'draft' },
    { title: 'Опубликован', value: 'published' },
    { title: 'В архиве', value: 'archived' },
];

const STATUS_LABEL: Record<string, string> = {
    draft: 'Черновик',
    published: 'Опубликован',
    archived: 'В архиве',
};

const TYPE_OPTIONS: { title: string; value: LessonType }[] = [
    { title: 'Видео', value: 'video' },
    { title: 'Текст', value: 'text' },
    { title: 'Задание', value: 'quiz' },
    { title: 'Видео + материалы', value: 'mixed' },
];

const TYPE_LABEL: Record<string, string> = {
    video: 'Видео',
    text: 'Текст',
    quiz: 'Задание',
    mixed: 'Видео + материалы',
};

type Notice = { type: 'success' | 'error'; text: string };

function LessonEditRow({
    lesson,
    onSave,
    onCancel,
    saving,
}: {
    lesson: LessonSummary;
    onSave: (title: string, type: LessonType) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [title, setTitle] = useState(lesson.title);
    const [type, setType] = useState<LessonType>(lesson.lesson_type);

    return (
        <div className="tf-inline-form">
            <label className="tf-field">
                <span className="tf-label">Название</span>
                <input
                    className="tf-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </label>
            <label className="tf-field">
                <span className="tf-label">Тип</span>
                <Select
                    selectValues={TYPE_OPTIONS}
                    value={type}
                    onChange={(v) => setType(v as LessonType)}
                />
            </label>
            <div className="tf-actions">
                <Button
                    disabled={saving}
                    onClick={() => onSave(title.trim(), type)}
                >
                    {saving ? 'Сохранение…' : 'Сохранить'}
                </Button>
                <Button
                    variant="secondary"
                    disabled={saving}
                    onClick={onCancel}
                >
                    Отмена
                </Button>
            </div>
        </div>
    );
}

export default function CourseEditor({
    course,
    initialLessons,
}: {
    course: Course;
    initialLessons: LessonSummary[];
}) {
    const router = useRouter();
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    const [notice, setNotice] = useState<Notice | null>(null);

    // Показывает сообщение и во всплывашке, и в карточке редактора.
    function notify(n: Notice) {
        setNotice(n);
        if (n.type === 'error') toast.error(n.text);
        else toast.success(n.text);
    }

    const [title, setTitle] = useState(course.title);
    const [description, setDescription] = useState(course.description ?? '');
    const [subject, setSubject] = useState(course.subject);
    const [price, setPrice] = useState(String(course.price));
    const [status, setStatus] = useState<string>(course.status ?? 'draft');

    const [lessons, setLessons] = useState(
        [...initialLessons].sort((a, b) => a.position - b.position),
    );
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonType, setNewLessonType] = useState<LessonType>('video');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<
        | null
        | { kind: 'course' }
        | { kind: 'lesson'; id: string; title: string }
    >(null);

    function handleSaveCourse(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);

        const parsedPrice = Number(price);
        if (!title.trim()) {
            notify({ type: 'error', text: 'Укажите название курса.' });
            return;
        }
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            notify({
                type: 'error',
                text: 'Цена должна быть числом не меньше нуля.',
            });
            return;
        }

        startTransition(async () => {
            const res = await updateCourse(course.id, {
                title: title.trim(),
                description: description.trim(),
                subject: subject.trim(),
                price: parsedPrice,
                currency: 'COIN',
                status: status as 'draft' | 'published' | 'archived',
            });
            if (res.ok) {
                notify({ type: 'success', text: 'Курс сохранён.' });
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleDeleteCourse() {
        setConfirmDelete(null);
        startTransition(async () => {
            const res = await deleteCourse(course.id);
            if (res.ok) {
                router.push('/dashboard/teacher/courses');
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleAddLesson(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);
        if (!newLessonTitle.trim()) {
            notify({ type: 'error', text: 'Укажите название урока.' });
            return;
        }
        startTransition(async () => {
            const res = await createLesson(
                course.id,
                newLessonTitle.trim(),
                newLessonType,
            );
            if (res.ok) {
                setLessons((prev) => [
                    ...prev,
                    {
                        lesson_id: res.data.lesson_id,
                        title: res.data.title,
                        lesson_type: res.data.lesson_type,
                        position: res.data.position,
                    },
                ]);
                setNewLessonTitle('');
                setNewLessonType('video');
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleSaveLesson(
        lessonId: string,
        newTitle: string,
        newType: LessonType,
    ) {
        if (!newTitle) {
            notify({ type: 'error', text: 'Укажите название урока.' });
            return;
        }
        startTransition(async () => {
            const res = await updateLesson(
                course.id,
                lessonId,
                newTitle,
                newType,
            );
            if (res.ok) {
                setLessons((prev) =>
                    prev.map((l) =>
                        l.lesson_id === lessonId
                            ? { ...l, title: newTitle, lesson_type: newType }
                            : l,
                    ),
                );
                setEditingId(null);
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleDeleteLesson(lessonId: string) {
        setConfirmDelete(null);
        startTransition(async () => {
            const res = await deleteLesson(course.id, lessonId);
            if (res.ok) {
                setLessons((prev) =>
                    prev.filter((l) => l.lesson_id !== lessonId),
                );
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleMove(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= lessons.length) return;

        const reordered = [...lessons];
        [reordered[index], reordered[target]] = [
            reordered[target],
            reordered[index],
        ];

        startTransition(async () => {
            const res = await reorderLessons(
                course.id,
                reordered.map((l) => l.lesson_id),
            );
            if (res.ok) {
                setLessons(reordered);
            } else {
                notify({ type: 'error', text: res.message });
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
                    <h1 className="tf-title">{course.title}</h1>
                    <p className="tf-subtitle">Настройки курса и программа</p>
                </div>
                <span className={`tf-status-badge tf-status-badge--${status}`}>
                    {STATUS_LABEL[status] ?? status}
                </span>
            </header>

            {notice && (
                <div className={`tf-notice tf-notice--${notice.type}`}>
                    {notice.text}
                </div>
            )}

            <section className="tf-card">
                <form className="tf-form" onSubmit={handleSaveCourse}>
                    <label className="tf-field">
                        <span className="tf-label">Название</span>
                        <input
                            className="tf-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </label>

                    <label className="tf-field">
                        <span className="tf-label">Описание</span>
                        <textarea
                            className="tf-input tf-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </label>

                    <div className="tf-grid">
                        <label className="tf-field">
                            <span className="tf-label">Предмет</span>
                            <input
                                className="tf-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </label>
                        <label className="tf-field">
                            <span className="tf-label">Цена, 🪙</span>
                            <input
                                className="tf-input"
                                type="number"
                                min={0}
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </label>
                    </div>

                    <label className="tf-field">
                        <span className="tf-label">Статус</span>
                        <Select
                            selectValues={STATUS_OPTIONS}
                            value={status}
                            onChange={setStatus}
                        />
                    </label>

                    <div className="tf-actions">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Сохранение…' : 'Сохранить'}
                        </Button>
                        {status === 'draft' && (
                            <button
                                type="button"
                                className="tf-danger-link"
                                disabled={isPending}
                                onClick={() =>
                                    setConfirmDelete({ kind: 'course' })
                                }
                            >
                                Удалить курс
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="tf-section">
                <div className="tf-section__head">
                    <h2 className="tf-section__title">
                        Уроки ({lessons.length})
                    </h2>
                </div>

                {lessons.length === 0 ? (
                    <div className="tf-empty">В курсе пока нет уроков.</div>
                ) : (
                    <div className="tf-lesson-list">
                        {lessons.map((lesson, idx) =>
                            editingId === lesson.lesson_id ? (
                                <LessonEditRow
                                    key={lesson.lesson_id}
                                    lesson={lesson}
                                    saving={isPending}
                                    onSave={(t, ty) =>
                                        handleSaveLesson(
                                            lesson.lesson_id,
                                            t,
                                            ty,
                                        )
                                    }
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <div
                                    className="tf-lesson-row"
                                    key={lesson.lesson_id}
                                >
                                    <span className="tf-lesson-row__num">
                                        {idx + 1}
                                    </span>
                                    <div className="tf-lesson-row__main">
                                        <span className="tf-lesson-row__title">
                                            {lesson.title}
                                        </span>
                                        <span className="tf-lesson-row__type">
                                            {TYPE_LABEL[lesson.lesson_type] ??
                                                lesson.lesson_type}
                                        </span>
                                    </div>
                                    <div className="tf-lesson-row__actions">
                                        <button
                                            type="button"
                                            className="tf-icon-btn"
                                            disabled={isPending || idx === 0}
                                            onClick={() => handleMove(idx, -1)}
                                            aria-label="Переместить выше"
                                        >
                                            <Icon name="chevronUp" size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="tf-icon-btn"
                                            disabled={
                                                isPending ||
                                                idx === lessons.length - 1
                                            }
                                            onClick={() => handleMove(idx, 1)}
                                            aria-label="Переместить ниже"
                                        >
                                            <Icon
                                                name="chevronDown"
                                                size={16}
                                            />
                                        </button>
                                        <Link
                                            href={`/dashboard/teacher/courses/${course.id}/lessons/${lesson.lesson_id}`}
                                            className="tf-icon-btn"
                                            aria-label="Материалы урока"
                                        >
                                            <Icon name="upload" size={16} />
                                        </Link>
                                        <Link
                                            href={`/course/lesson?course=${course.id}&lesson=${lesson.lesson_id}`}
                                            target="_blank"
                                            className="tf-icon-btn"
                                            aria-label="Предпросмотр"
                                        >
                                            <Icon name="play" size={16} />
                                        </Link>
                                        <button
                                            type="button"
                                            className="tf-icon-btn"
                                            disabled={isPending}
                                            onClick={() =>
                                                setEditingId(lesson.lesson_id)
                                            }
                                            aria-label="Изменить"
                                        >
                                            <Icon name="edit" size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="tf-icon-btn tf-icon-btn--danger"
                                            disabled={isPending}
                                            onClick={() =>
                                                setConfirmDelete({
                                                    kind: 'lesson',
                                                    id: lesson.lesson_id,
                                                    title: lesson.title,
                                                })
                                            }
                                            aria-label="Удалить"
                                        >
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}

                <form className="tf-inline-form" onSubmit={handleAddLesson}>
                    <label className="tf-field">
                        <span className="tf-label">Новый урок</span>
                        <input
                            className="tf-input"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            placeholder="Название урока"
                        />
                    </label>
                    <label className="tf-field">
                        <span className="tf-label">Тип</span>
                        <Select
                            selectValues={TYPE_OPTIONS}
                            value={newLessonType}
                            onChange={(v) => setNewLessonType(v as LessonType)}
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

            {confirmDelete && (
                <div
                    className="confirm-overlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => !isPending && setConfirmDelete(null)}
                >
                    <div
                        className="confirm-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="confirm-dialog__title">
                            {confirmDelete.kind === 'course'
                                ? 'Удалить курс?'
                                : 'Удалить урок?'}
                        </h3>
                        <p className="confirm-dialog__text">
                            {confirmDelete.kind === 'course' ? (
                                <>
                                    Курс «{course.title}» будет удалён
                                    безвозвратно вместе со всеми уроками.
                                </>
                            ) : (
                                <>
                                    Урок «{confirmDelete.title}» и его материалы
                                    будут удалены безвозвратно.
                                </>
                            )}
                        </p>
                        <div className="confirm-dialog__actions">
                            <Button
                                variant="secondary"
                                onClick={() => setConfirmDelete(null)}
                                disabled={isPending}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={() =>
                                    confirmDelete.kind === 'course'
                                        ? handleDeleteCourse()
                                        : handleDeleteLesson(confirmDelete.id)
                                }
                                disabled={isPending}
                            >
                                {isPending ? 'Удаление…' : 'Удалить'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
