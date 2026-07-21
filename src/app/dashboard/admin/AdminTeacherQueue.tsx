'use client';

import './adminQueue.css';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    TeacherApplication,
    approveTeacher,
    rejectTeacher,
} from '@/lib/api/admin';

type Tab = 'pending' | 'all';

const STATUS_LABEL: Record<string, string> = {
    pending: 'На проверке',
    approved: 'Подтверждён',
    rejected: 'Отклонён',
};

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

function formatDate(iso: string | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

function pluralizeApplications(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'заявка';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
        return 'заявки';
    return 'заявок';
}

function initials(name: string, fallback: string): string {
    const source = name.trim();
    if (!source) return fallback.slice(0, 2).toUpperCase();
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function AdminTeacherQueue({
    pending,
    all,
    error,
}: {
    pending: TeacherApplication[];
    all: TeacherApplication[];
    error: string | null;
}) {
    const [tab, setTab] = useState<Tab>('pending');
    // Which row is mid-decision, so only its buttons show the busy state.
    const [decidingId, setDecidingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        if (error) toast.error(error);
    }, [error, toast]);

    const items = tab === 'pending' ? pending : all;

    function decide(application: TeacherApplication, approve: boolean) {
        setDecidingId(application.id);
        startTransition(async () => {
            const result = approve
                ? await approveTeacher(application.id)
                : await rejectTeacher(application.id);
            setDecidingId(null);

            if (!result.ok) {
                toast.error(result.message);
                return;
            }
            toast.success(
                approve
                    ? `${application.full_name} подтверждён как преподаватель.`
                    : `Заявка ${application.full_name} отклонена.`,
            );
            // The queue is rendered on the server; refresh pulls the new state.
            router.refresh();
        });
    }

    return (
        <div className="admin-queue">
            <header className="aq-header">
                <div>
                    <h1 className="aq-title">Заявки преподавателей</h1>
                    <p className="aq-subtitle">
                        Новый преподаватель получает доступ к созданию курсов
                        только после вашего подтверждения.
                    </p>
                </div>
                <div className="aq-counter">
                    <span className="aq-counter__value">{pending.length}</span>
                    <span className="aq-counter__label">
                        {pluralizeApplications(pending.length)} на проверке
                    </span>
                </div>
            </header>

            <div className="aq-tabs">
                <button
                    type="button"
                    className={`aq-tab${tab === 'pending' ? ' aq-tab--active' : ''}`}
                    onClick={() => setTab('pending')}
                >
                    На проверке ({pending.length})
                </button>
                <button
                    type="button"
                    className={`aq-tab${tab === 'all' ? ' aq-tab--active' : ''}`}
                    onClick={() => setTab('all')}
                >
                    Все заявки ({all.length})
                </button>
            </div>

            {items.length === 0 ? (
                <div className="aq-empty">
                    <Icon name="checkSmall" size={28} />
                    <h2>
                        {tab === 'pending'
                            ? 'Новых заявок нет'
                            : 'Заявок пока нет'}
                    </h2>
                    <p>
                        {tab === 'pending'
                            ? 'Как только преподаватель зарегистрируется, его заявка появится здесь.'
                            : 'Здесь будут все заявки на роль преподавателя.'}
                    </p>
                </div>
            ) : (
                <ul className="aq-list">
                    {items.map((application) => (
                        <li key={application.id} className="aq-row">
                            <div className="aq-row__avatar">
                                {initials(
                                    application.full_name,
                                    application.email,
                                )}
                            </div>
                            <div className="aq-row__identity">
                                <span className="aq-row__name">
                                    {application.full_name}
                                </span>
                                <span className="aq-row__email">
                                    {application.email}
                                </span>
                            </div>
                            <div className="aq-row__meta">
                                <span className="aq-row__date">
                                    Заявка от{' '}
                                    {formatDate(application.registered_at)}
                                </span>
                                {application.reviewed_at && (
                                    <span className="aq-row__date">
                                        Решение{' '}
                                        {formatDate(application.reviewed_at)}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`aq-badge aq-badge--${application.status}`}
                            >
                                {STATUS_LABEL[application.status] ??
                                    application.status}
                            </span>
                            <div className="aq-row__actions">
                                {application.status !== 'approved' && (
                                    <button
                                        type="button"
                                        className="aq-action aq-action--approve"
                                        disabled={
                                            isPending &&
                                            decidingId === application.id
                                        }
                                        onClick={() => decide(application, true)}
                                    >
                                        <Icon name="checkSmall" size={16} />
                                        Подтвердить
                                    </button>
                                )}
                                {application.status !== 'rejected' && (
                                    <button
                                        type="button"
                                        className="aq-action aq-action--reject"
                                        disabled={
                                            isPending &&
                                            decidingId === application.id
                                        }
                                        onClick={() =>
                                            decide(application, false)
                                        }
                                    >
                                        <Icon name="x" size={16} />
                                        Отклонить
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
