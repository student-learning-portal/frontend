'use client';

import './teacherChat.css';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/UI/Icon/Icon';
import ChatBox from '@/components/Chat/ChatBox';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    ChatMessage,
    ThreadSummary,
    getTeacherThreads,
    getTeacherThread,
    sendTeacherMessage,
} from '@/lib/api/chat';

const POLL_MS = 5000;

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'У';
}

export default function TeacherChat({
    courseId,
    courseTitle,
    myId,
}: {
    courseId: string;
    courseTitle: string;
    myId: string;
}) {
    const toast = useToast();
    const [threads, setThreads] = useState<ThreadSummary[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const threadsErrRef = useRef(false);

    const loadThreads = useCallback(async () => {
        const res = await getTeacherThreads(courseId);
        if (res.ok) {
            setThreads(res.data);
            threadsErrRef.current = false;
        } else if (!threadsErrRef.current) {
            threadsErrRef.current = true;
            toast.error(res.message);
        }
        setLoadingThreads(false);
    }, [courseId, toast]);

    const loadMessages = useCallback(
        async (studentId: string, showSpinner = false) => {
            if (showSpinner) setLoadingMessages(true);
            const res = await getTeacherThread(courseId, studentId);
            if (res.ok) setMessages(res.data);
            setLoadingMessages(false);
        },
        [courseId],
    );

    // Список тредов: загрузка и опрос.
    useEffect(() => {
        // loadThreads меняет state только после await — правило даёт ложное
        // срабатывание на асинхронной загрузке.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadThreads();
        const id = setInterval(loadThreads, POLL_MS);
        return () => clearInterval(id);
    }, [loadThreads]);

    // Сообщения выбранного треда: загрузка и опрос.
    useEffect(() => {
        if (!selected) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadMessages(selected, true);
        const id = setInterval(() => loadMessages(selected), POLL_MS);
        return () => clearInterval(id);
    }, [selected, loadMessages]);

    const handleSend = useCallback(
        async (text: string): Promise<boolean> => {
            if (!selected) return false;
            setSending(true);
            const res = await sendTeacherMessage(courseId, selected, text);
            setSending(false);
            if (res.ok) {
                setMessages((prev) => [...prev, res.data]);
                void loadThreads();
                return true;
            }
            toast.error(res.message);
            return false;
        },
        [courseId, selected, toast, loadThreads],
    );

    const activeThread = threads.find((t) => t.student_id === selected);

    return (
        <div className="tchat-page">
            <Link
                href={`/dashboard/teacher/courses/${courseId}`}
                className="tf-back"
            >
                <Icon name="arrowLeft" size={16} />К курсу
            </Link>

            <header className="tchat-head">
                <h1 className="tchat-title">Сообщения</h1>
                <p className="tchat-subtitle">{courseTitle}</p>
            </header>

            <div className="tchat-layout">
                <aside className="tchat-threads">
                    {loadingThreads && threads.length === 0 ? (
                        <div className="tchat-threads__state">Загрузка…</div>
                    ) : threads.length === 0 ? (
                        <div className="tchat-threads__state">
                            Пока нет сообщений от учеников.
                        </div>
                    ) : (
                        threads.map((t) => (
                            <button
                                key={t.student_id}
                                className={`tchat-thread${
                                    t.student_id === selected
                                        ? ' tchat-thread--active'
                                        : ''
                                }`}
                                onClick={() => setSelected(t.student_id)}
                            >
                                <span className="tchat-thread__avatar">
                                    {initials(t.student_name)}
                                </span>
                                <span className="tchat-thread__meta">
                                    <span className="tchat-thread__name">
                                        {t.student_name}
                                    </span>
                                    <span className="tchat-thread__last">
                                        {t.last_message}
                                    </span>
                                </span>
                            </button>
                        ))
                    )}
                </aside>

                <div className="tchat-conversation">
                    {selected ? (
                        <ChatBox
                            messages={messages}
                            myId={myId}
                            onSend={handleSend}
                            sending={sending}
                            loading={loadingMessages}
                            emptyText={`Начните диалог с учеником${
                                activeThread
                                    ? ` ${activeThread.student_name}`
                                    : ''
                            }.`}
                        />
                    ) : (
                        <div className="tchat-empty">
                            Выберите ученика слева, чтобы открыть переписку.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
