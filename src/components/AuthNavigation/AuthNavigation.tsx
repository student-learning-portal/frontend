'use client';

import './AuthNavigation.css';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AuthNavigation() {
    const pathname = usePathname();

    return (
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
    );
}
