'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import './authPages.css';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="auth-container">
            <img src="/logo-navy.svg" alt="sehriyo-logo" width={126}></img>
            <div className="navigation">
                <Link
                    href="/login"
                    className={`navigation-item ${pathname === '/login' && 'active'}`}
                >
                    Вход
                </Link>
                <Link
                    href="/registration"
                    className={`navigation-item ${pathname === '/registration' && 'active'}`}
                >
                    Регистрация
                </Link>
            </div>
            {children}
        </div>
    );
}
