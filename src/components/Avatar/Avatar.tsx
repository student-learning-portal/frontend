'use client';

import './Avatar.css';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/UI/Icon/Icon';
import { logout } from '@/lib/actions';
import { getMe } from '@/lib/api/profile';
import { UserRole } from '@/models/User';

type Props = {
    name?: string;
    role?: UserRole;
};

const ROLE_LABEL: Record<UserRole, string> = {
    teacher: 'Преподаватель',
    student: 'Ученик',
    admin: 'Администратор',
};

function getInitials(name?: string): string {
    if (!name) return 'У';
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
    return initials.toUpperCase() || 'У';
}

export default function Avatar({ name, role }: Props) {
    const [open, setOpen] = useState(false);
    const [fullName, setFullName] = useState(name);
    const [userRole, setUserRole] = useState(role);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            const me = await getMe();
            if (!active || !me) return;
            setFullName(me.full_name);
            setUserRole(me.role);
            setAvatarUrl(me.avatar_url ?? null);
        })();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const roleLabel = ROLE_LABEL[userRole ?? 'student'];

    return (
        <div className="avatar-wrap" ref={wrapRef}>
            <button
                className="avatar-part"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="avatar">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            className="avatar__img"
                        />
                    ) : (
                        getInitials(fullName)
                    )}
                </span>
            </button>

            {open && (
                <div className="avatar-menu" role="menu">
                    <div className="avatar-menu__head">
                        <span className="avatar-menu__name">
                            {fullName ?? 'Пользователь'}
                        </span>
                        <span className="avatar-menu__role">{roleLabel}</span>
                    </div>

                    <div className="avatar-menu__divider" />

                    <Link
                        href="/dashboard/settings"
                        className="avatar-menu__item"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                    >
                        <Icon name="settings" size={18} />
                        Настройки
                    </Link>

                    <div className="avatar-menu__divider" />

                    <form action={logout}>
                        <button
                            type="submit"
                            className="avatar-menu__item avatar-menu__item--danger"
                            role="menuitem"
                        >
                            <Icon name="logout" size={18} />
                            Выйти
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
