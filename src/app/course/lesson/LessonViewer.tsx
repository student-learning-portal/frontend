'use client';

import './lessonPage.css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getLesson, saveProgress } from '@/lib/api/player';
import { LessonData } from '@/models/Lesson';
import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';

const SAVE_INTERVAL_SECONDS = 10;

function isAudioUrl(url: string): boolean {
    return /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url);
}

function formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function LessonViewer() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get('course') ?? '';
    const lessonId = searchParams.get('lesson') ?? '';
    const toast = useToast();

    const [data, setData] = useState<LessonData | null>(null);
    const [status, setStatus] = useState<
        'loading' | 'ready' | 'forbidden' | 'not_found' | 'error'
    >('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [completed, setCompleted] = useState(false);
    const [percent, setPercent] = useState(0);
    const [saving, setSaving] = useState(false);

    const mediaRef = useRef<HTMLMediaElement | null>(null);
    const resumedRef = useRef(false);
    const lastSavedRef = useRef(0);

    const setMediaRef = useCallback((el: HTMLMediaElement | null) => {
        mediaRef.current = el;
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            const res = await getLesson(courseId, lessonId);
            if (!active) return;
            if (res.ok) {
                setData(res.data);
                setPercent(res.data.percent_complete);
                setCompleted(res.data.percent_complete >= 100);
                setStatus('ready');
            } else if (res.code === 'forbidden') {
                setErrorMsg(res.message);
                setStatus('forbidden');
                toast.error(res.message);
            } else if (res.code === 'not_found') {
                setErrorMsg(res.message);
                setStatus('not_found');
                toast.error(res.message);
            } else {
                setErrorMsg(res.message);
                setStatus('error');
                toast.error(res.message);
            }
        })();
        return () => {
            active = false;
        };
    }, [courseId, lessonId, toast]);

    const persist = useCallback(
        async (seconds: number, markCompleted: boolean) => {
            setSaving(true);
            const res = await saveProgress(
                courseId,
                lessonId,
                seconds,
                markCompleted,
            );
            setSaving(false);
            if (res.ok) {
                setPercent(res.data.percent_complete);
                if (res.data.completed) setCompleted(true);
            } else {
                toast.error(res.message);
            }
        },
        [courseId, lessonId, toast],
    );

    function handleLoadedMetadata() {
        const el = mediaRef.current;
        if (!el || resumedRef.current || !data) return;
        // loadedmetadata can fire more than once (e.g. source changes); the ref
        // guard makes the resume-seek a one-time effect instead of re-seeking
        // and undoing playback progress the user has already made.
        resumedRef.current = true;
        const resume = data.last_progress_seconds;
        if (resume > 0 && resume < el.duration) {
            el.currentTime = resume;
        }
    }

    function handleTimeUpdate() {
        const el = mediaRef.current;
        if (!el) return;
        const now = Math.floor(el.currentTime);
        if (now - lastSavedRef.current >= SAVE_INTERVAL_SECONDS) {
            lastSavedRef.current = now;
            void persist(now, false);
        }
    }

    function handlePause() {
        const el = mediaRef.current;
        if (!el || el.ended) return;
        void persist(Math.floor(el.currentTime), false);
    }

    function handleEnded() {
        const el = mediaRef.current;
        const seconds = el ? Math.floor(el.duration) : 0;
        void persist(seconds, true);
    }

    function handleManualComplete() {
        void persist(data?.last_progress_seconds ?? 0, true);
    }

    if (status === 'loading') {
        return (
            <div className="lesson-page">
                <div className="lesson-state">Загрузка урока…</div>
            </div>
        );
    }

    if (status !== 'ready' || !data) {
        return (
            <div className="lesson-page">
                <div className="lesson-state">
                    <h1 className="lesson-state__title">
                        {status === 'forbidden'
                            ? 'Нет доступа'
                            : status === 'not_found'
                              ? 'Урок не найден'
                              : 'Ошибка'}
                    </h1>
                    <p className="lesson-state__text">{errorMsg}</p>
                    <Link
                        href={`/course/lessons?course=${courseId}`}
                        className="lesson-back"
                    >
                        ← К урокам
                    </Link>
                </div>
            </div>
        );
    }

    const hasMedia = Boolean(data.content_url);
    const audio = hasMedia && isAudioUrl(data.content_url);

    return (
        <div className="lesson-page">
            <Link
                href={`/course/lessons?course=${courseId}`}
                className="lesson-back"
            >
                ← К урокам
            </Link>

            <div className="lesson-header">
                <span className="lesson-type">{data.lesson_type}</span>
                <h1 className="lesson-title">{data.title}</h1>
                <div className="lesson-meta">
                    {data.duration_seconds > 0 && (
                        <span className="lesson-meta__item">
                            <Icon name="clock" size={15} />
                            {formatTime(data.duration_seconds)}
                        </span>
                    )}
                    <span
                        className={`lesson-progress-badge${
                            completed ? ' lesson-progress-badge--done' : ''
                        }`}
                    >
                        {completed ? (
                            <>
                                <Icon name="check" size={15} /> Пройдено
                            </>
                        ) : (
                            `Прогресс: ${Math.round(percent)}%`
                        )}
                    </span>
                    {saving && (
                        <span className="lesson-saving">Сохранение…</span>
                    )}
                </div>
            </div>

            {hasMedia ? (
                <div className="lesson-player">
                    {audio ? (
                        <audio
                            ref={setMediaRef}
                            data-testid="lesson-media"
                            src={data.content_url}
                            controls
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={handleTimeUpdate}
                            onPause={handlePause}
                            onEnded={handleEnded}
                            className="lesson-audio"
                        />
                    ) : (
                        <video
                            ref={setMediaRef}
                            data-testid="lesson-media"
                            src={data.content_url}
                            controls
                            playsInline
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={handleTimeUpdate}
                            onPause={handlePause}
                            onEnded={handleEnded}
                            className="lesson-video"
                        />
                    )}
                </div>
            ) : (
                <div className="lesson-noplayer">
                    {data.lesson_type === 'quiz'
                        ? 'Задание для самостоятельного решения. Скачайте материалы ниже и отметьте урок выполненным.'
                        : 'У этого урока нет видео. Изучите материалы ниже.'}
                </div>
            )}

            <section className="lesson-section">
                <h2 className="lesson-section__title">Материалы</h2>
                {data.materials.length > 0 ? (
                    <ul className="lesson-materials">
                        {data.materials.map((m) => (
                            <li key={m.url} className="lesson-material">
                                <span className="lesson-material__icon">
                                    <Icon name="fileText" size={18} />
                                </span>
                                <span className="lesson-material__title">
                                    {m.title}
                                    <span className="lesson-material__type">
                                        {m.type}
                                    </span>
                                </span>
                                <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="lesson-material__download"
                                >
                                    <Icon name="download" size={16} />
                                    Скачать
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="lesson-empty">
                        К уроку не прикреплены материалы.
                    </p>
                )}
            </section>

            {(data.lesson_type === 'quiz' ||
                data.lesson_type === 'text' ||
                !hasMedia) &&
                !completed && (
                    <div className="lesson-complete">
                        <Button
                            onClick={handleManualComplete}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение…' : 'Отметить выполненным'}
                        </Button>
                    </div>
                )}
        </div>
    );
}
