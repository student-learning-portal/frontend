'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ChatBox from './ChatBox';
import { ChatMessage, getStudentThread, sendStudentMessage } from '@/lib/api/chat';
import { useToast } from '@/components/Toast/ToastProvider';

const POLL_MS = 5000;

// Панель чата ученика с преподавателем курса. Опрашивает бэкенд каждые 5 сек.
export default function CourseChat({
    courseId,
    myId,
}: {
    courseId: string;
    myId: string;
}) {
    const toast = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const errShownRef = useRef(false);

    const load = useCallback(async () => {
        const res = await getStudentThread(courseId);
        if (res.ok) {
            setMessages(res.data);
            errShownRef.current = false;
        } else if (!errShownRef.current) {
            // Не спамим тостом при каждом опросе — показываем ошибку один раз.
            errShownRef.current = true;
            toast.error(res.message);
        }
        setLoading(false);
    }, [courseId, toast]);

    useEffect(() => {
        // load обновляет state только после await (асинхронно), каскадных
        // ре-рендеров нет — правило здесь даёт ложное срабатывание.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    const handleSend = useCallback(
        async (text: string): Promise<boolean> => {
            setSending(true);
            const res = await sendStudentMessage(courseId, text);
            setSending(false);
            if (res.ok) {
                setMessages((prev) => [...prev, res.data]);
                void load();
                return true;
            }
            toast.error(res.message);
            return false;
        },
        [courseId, toast, load],
    );

    return (
        <ChatBox
            messages={messages}
            myId={myId}
            onSend={handleSend}
            sending={sending}
            loading={loading}
            emptyText="Задайте вопрос преподавателю курса."
        />
    );
}
