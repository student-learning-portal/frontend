'use client';

import './settings.css';
import { useRef, useState, useTransition } from 'react';
import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';
import { useToast } from '@/components/Toast/ToastProvider';
import {
    updateName,
    updateEmail,
    updatePassword,
    uploadAvatar,
    getMe,
} from '@/lib/api/profile';

type Props = {
    initialName: string;
    initialEmail: string;
    initialAvatar?: string | null;
    role?: 'teacher' | 'student';
};

type Tab = 'profile' | 'security';
type Notice = { type: 'success' | 'error'; text: string };

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
    return initials.toUpperCase() || 'У';
}

export default function SettingsClient({
    initialName,
    initialEmail,
    initialAvatar,
}: Props) {
    const toast = useToast();
    const [tab, setTab] = useState<Tab>('profile');
    const [notice, setNotice] = useState<Notice | null>(null);
    const [isPending, startTransition] = useTransition();

    const [savedName, setSavedName] = useState(initialName);
    const [savedEmail, setSavedEmail] = useState(initialEmail);
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [emailPassword, setEmailPassword] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(
        initialAvatar ?? null,
    );
    const fileRef = useRef<HTMLInputElement>(null);

    // Показывает сообщение и во всплывашке, и в карточке настроек.
    function notify(n: Notice) {
        setNotice(n);
        if (n.type === 'error') toast.error(n.text);
        else toast.success(n.text);
    }

    async function refresh() {
        const me = await getMe();
        if (!me) return;
        setSavedName(me.full_name);
        setSavedEmail(me.email);
        setName(me.full_name);
        setEmail(me.email);
        setAvatarUrl(me.avatar_url ?? null);
    }

    const [curPass, setCurPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhoto(URL.createObjectURL(file));
        setNotice(null);
        const formData = new FormData();
        formData.append('avatar', file);
        startTransition(async () => {
            const res = await uploadAvatar(formData);
            if (res.ok) {
                await refresh();
                setPhoto(null);
                notify({ type: 'success', text: 'Фото обновлено.' });
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);
        startTransition(async () => {
            if (name.trim() && name !== savedName) {
                const res = await updateName(name.trim());
                if (!res.ok) {
                    notify({ type: 'error', text: res.message });
                    return;
                }
            }
            if (email !== savedEmail) {
                if (!emailPassword) {
                    notify({
                        type: 'error',
                        text: 'Введите текущий пароль, чтобы сменить email.',
                    });
                    return;
                }
                const res = await updateEmail(emailPassword, email);
                if (!res.ok) {
                    notify({ type: 'error', text: res.message });
                    return;
                }
                setEmailPassword('');
            }
            await refresh();
            notify({ type: 'success', text: 'Профиль сохранён.' });
        });
    }

    function handleSecuritySubmit(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);
        if (newPass !== confirmPass) {
            notify({ type: 'error', text: 'Новые пароли не совпадают.' });
            return;
        }
        startTransition(async () => {
            const res = await updatePassword(curPass, newPass);
            if (res.ok) {
                setCurPass('');
                setNewPass('');
                setConfirmPass('');
                notify({ type: 'success', text: 'Пароль изменён.' });
            } else {
                notify({ type: 'error', text: res.message });
            }
        });
    }

    return (
        <div className="settings">
            <header className="settings__head">
                <h1 className="settings__title">Настройки</h1>
                <p className="settings__subtitle">Профиль и безопасность.</p>
            </header>

            <div className="settings__layout">
                <nav className="settings__tabs">
                    <button
                        className={`settings__tab${
                            tab === 'profile' ? ' settings__tab--active' : ''
                        }`}
                        onClick={() => {
                            setTab('profile');
                            setNotice(null);
                        }}
                    >
                        <Icon name="user" size={18} />
                        Профиль
                    </button>
                    <button
                        className={`settings__tab${
                            tab === 'security' ? ' settings__tab--active' : ''
                        }`}
                        onClick={() => {
                            setTab('security');
                            setNotice(null);
                        }}
                    >
                        <Icon name="lock" size={18} />
                        Безопасность
                    </button>
                </nav>

                <section className="settings__card">
                    {notice && (
                        <div
                            className={`settings__notice settings__notice--${notice.type}`}
                        >
                            {notice.text}
                        </div>
                    )}

                    {tab === 'profile' && (
                        <form
                            className="settings__form"
                            onSubmit={handleProfileSubmit}
                        >
                            <div className="settings__avatar-row">
                                <span className="settings__avatar">
                                    {photo || avatarUrl ? (
                                        <img
                                            src={photo ?? avatarUrl ?? ''}
                                            alt="avatar"
                                            className="settings__avatar-img"
                                        />
                                    ) : (
                                        getInitials(name)
                                    )}
                                </span>
                                <button
                                    type="button"
                                    className="settings__upload"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={isPending}
                                >
                                    <Icon name="upload" size={18} />
                                    Загрузить фото
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handlePhoto}
                                />
                            </div>

                            <div className="settings__grid">
                                <label className="settings__field">
                                    <span className="settings__label">Имя</span>
                                    <input
                                        className="settings__input"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="settings__field">
                                    <span className="settings__label">
                                        Email
                                    </span>
                                    <input
                                        className="settings__input"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            {email !== savedEmail && (
                                <label className="settings__field">
                                    <span className="settings__label">
                                        Текущий пароль (для смены email)
                                    </span>
                                    <input
                                        className="settings__input"
                                        type="password"
                                        autoComplete="current-password"
                                        value={emailPassword}
                                        onChange={(e) =>
                                            setEmailPassword(e.target.value)
                                        }
                                    />
                                </label>
                            )}

                            <div className="settings__actions">
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Сохранение…' : 'Сохранить'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {tab === 'security' && (
                        <form
                            className="settings__form"
                            onSubmit={handleSecuritySubmit}
                        >
                            <label className="settings__field">
                                <span className="settings__label">
                                    Текущий пароль
                                </span>
                                <input
                                    className="settings__input"
                                    type="password"
                                    autoComplete="current-password"
                                    value={curPass}
                                    onChange={(e) => setCurPass(e.target.value)}
                                />
                            </label>
                            <div className="settings__grid">
                                <label className="settings__field">
                                    <span className="settings__label">
                                        Новый пароль
                                    </span>
                                    <input
                                        className="settings__input"
                                        type="password"
                                        autoComplete="new-password"
                                        value={newPass}
                                        onChange={(e) =>
                                            setNewPass(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="settings__field">
                                    <span className="settings__label">
                                        Повторите пароль
                                    </span>
                                    <input
                                        className="settings__input"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPass}
                                        onChange={(e) =>
                                            setConfirmPass(e.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <div className="settings__actions">
                                <Button type="submit" disabled={isPending}>
                                    {isPending
                                        ? 'Сохранение…'
                                        : 'Сменить пароль'}
                                </Button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
}
