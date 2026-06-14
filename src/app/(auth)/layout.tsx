'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import './authPages.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
    const [active, setActive] = useState('');

    return (
        <div className="auth-container">
            <img src="/logo-navy.svg" alt="sehriyo-logo" width={126}></img>
            <div className="navigation">
                <Link
                    href="/login"
                    className={`navigation-item ${active === 'login' && 'active'}`}
                    onClick={() => setActive('login')}
                >
                    Вход
                </Link>
                <Link
                    href="/registration"
                    className={`navigation-item ${active === 'registration' && 'active'}`}
                    onClick={() => setActive('registration')}
                >
                    Регистрация
                </Link>
            </div>
            {children}
        </div>
    );
}
