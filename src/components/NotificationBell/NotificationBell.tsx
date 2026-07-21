'use client';

import './NotificationBell.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    AppNotification,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/lib/api/notifications';

// Как часто опрашиваем сервер на предмет новых уведомлений (мс).
const POLL_INTERVAL = 20000;

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн назад`;
}

export default function NotificationBell() {
    const router = useRouter();
    const toast = useToast();
    const { data: session } = useSession();
    const role = session?.user?.role;

    const [items, setItems] = useState<AppNotification[]>([]);
    const [open, setOpen] = useState(false);

    // id уже показанных уведомлений — чтобы всплывашку показать только для
    // действительно новых, а не при каждом опросе. primed становится true
    // после первой загрузки, чтобы не завалить экран тостами на старте.
    const seenIds = useRef<Set<string>>(new Set());
    const primed = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const unread = items.filter((n) => !n.read_at).length;

    const load = useCallback(async () => {
        const res = await getNotifications(30);
        if (!res.ok) return;

        const fresh = res.data;

        // Новые непрочитанные уведомления, которых мы ещё не видели.
        if (primed.current) {
            const incoming = fresh.filter(
                (n) => !n.read_at && !seenIds.current.has(n.id),
            );
            if (incoming.length === 1) {
                toast.show(incoming[0].title, 'info');
            } else if (incoming.length > 1) {
                toast.show(
                    `Новых уведомлений: ${incoming.length}`,
                    'info',
                );
            }
        }

        fresh.forEach((n) => seenIds.current.add(n.id));
        primed.current = true;
        setItems(fresh);
    }, [toast]);

    // Первая загрузка и периодический опрос.
    useEffect(() => {
        if (!session?.accessToken) return;
        let active = true;
        (async () => {
            if (active) await load();
        })();
        const timer = setInterval(load, POLL_INTERVAL);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [session?.accessToken, load]);

    // Закрытие панели по клику вне её.
    useEffect(() => {
        if (!open) return;
        function onClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    function linkFor(n: AppNotification): string | null {
        if (!n.course_id) return null;
        if (role === 'teacher') {
            return `/dashboard/teacher/courses/${n.course_id}/chat`;
        }
        return `/course?id=${n.course_id}`;
    }

    async function handleClick(n: AppNotification) {
        if (!n.read_at) {
            setItems((list) =>
                list.map((it) =>
                    it.id === n.id
                        ? { ...it, read_at: new Date().toISOString() }
                        : it,
                ),
            );
            markNotificationRead(n.id).catch(() => undefined);
        }
        const href = linkFor(n);
        setOpen(false);
        if (href) router.push(href);
    }

    async function handleMarkAll() {
        setItems((list) =>
            list.map((it) =>
                it.read_at
                    ? it
                    : { ...it, read_at: new Date().toISOString() },
            ),
        );
        const res = await markAllNotificationsRead();
        if (!res.ok) toast.error(res.message);
    }

    if (!session?.accessToken) return null;

    return (
        <div className="notif-bell" ref={rootRef}>
            <button
                type="button"
                className="notif-bell__button"
                aria-label="Уведомления"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <Icon name="bell" size={22} />
                {unread > 0 && (
                    <span className="notif-bell__badge">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="notif-panel" role="dialog">
                    <div className="notif-panel__head">
                        <span className="notif-panel__title">Уведомления</span>
                        {unread > 0 && (
                            <button
                                type="button"
                                className="notif-panel__mark"
                                onClick={handleMarkAll}
                            >
                                Прочитать все
                            </button>
                        )}
                    </div>

                    <div className="notif-panel__list">
                        {items.length === 0 ? (
                            <div className="notif-empty">Пока нет уведомлений</div>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={`notif-item${
                                        n.read_at ? '' : ' notif-item--unread'
                                    }`}
                                    onClick={() => handleClick(n)}
                                >
                                    <span className="notif-item__title">
                                        {n.title}
                                    </span>
                                    <span className="notif-item__body">
                                        {n.body}
                                    </span>
                                    <span className="notif-item__time">
                                        {timeAgo(n.created_at)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
