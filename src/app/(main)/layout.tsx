'use client';

import { ReactNode } from 'react';
import './mainPage.css';
import Link from 'next/link';
import StudentNavigationBar from '@/components/StudentNavigationBar/StudentNavigationBar';

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="main-container">
            <Link href="/" className="logo-cell">
                <img src="/logo-navy.svg" alt="sehriyo-logo"></img>
                <span>Портал ученика</span>
            </Link>
            <div className="search-profile-cell">
                <div className="search-part">
                    <input placeholder="поиск курсов"></input>
                </div>
                <div className="profile-part">профиль</div>
            </div>
            <div className="side-bar">
                <StudentNavigationBar></StudentNavigationBar>
                <div className="admin-panel">Смена вида</div>
            </div>

            <div className="main-content-cell"> {children} </div>
        </div>
    );
}
