'use client';

import './Chat.css';
import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/api/chat';
import Button from '@/components/UI/Button/Button';

type Props = {
    messages: ChatMessage[];
    // ID текущего пользователя — по нему определяем «свои» сообщения (справа).
    myId: string;
    onSend: (text: string) => Promise<boolean>;
    sending?: boolean;
    loading?: boolean;
    emptyText?: string;
    placeholder?: string;
};

function formatTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ChatBox({
    messages,
    myId,
    onSend,
    sending = false,
    loading = false,
    emptyText = 'Сообщений пока нет. Начните диалог.',
    placeholder = 'Напишите сообщение…',
}: Props) {
    const [text, setText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim() || sending) return;
        const ok = await onSend(text);
        if (ok) setText('');
    }

    return (
        <div className="chat-box">
            <div className="chat-box__messages" ref={scrollRef}>
                {loading && messages.length === 0 ? (
                    <div className="chat-box__state">Загрузка…</div>
                ) : messages.length === 0 ? (
                    <div className="chat-box__state">{emptyText}</div>
                ) : (
                    messages.map((m) => {
                        const mine = m.sender_id === myId;
                        return (
                            <div
                                key={m.id}
                                className={`chat-msg${mine ? ' chat-msg--mine' : ''}`}
                            >
                                <div className="chat-msg__bubble">{m.body}</div>
                                <div className="chat-msg__time">
                                    {formatTime(m.created_at)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form className="chat-box__form" onSubmit={handleSubmit}>
                <textarea
                    className="chat-box__input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void handleSubmit(e);
                        }
                    }}
                />
                <Button type="submit" disabled={sending || !text.trim()}>
                    {sending ? '…' : 'Отправить'}
                </Button>
            </form>
        </div>
    );
}
