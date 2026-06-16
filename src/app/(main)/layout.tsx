import { ReactNode } from 'react';
import './mainPage.css';
import Link from 'next/link';
import StudentNavigationBar from '@/components/StudentNavigationBar/StudentNavigationBar';
import Icon from '@/components/UI/Icon/Icon';
import SearchBar from '@/components/SearchBar/SearchBar';

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="main-container">
            <Link href="/" className="logo-part">
                <img src="/logo-navy.svg" alt="sehriyo-logo"></img>
                <span>Портал ученика</span>
            </Link>
            <div className="top-bar">
                <SearchBar></SearchBar>
                <div className="profile-part">
                    <Icon
                        size={20}
                        name="bell"
                        style={{
                            alignSelf: 'center',
                        }}
                    ></Icon>
                    <button className="avatar-part">
                        <span className="avatar"> АМ </span>
                    </button>
                </div>
            </div>
            <div className="side-bar">
                <StudentNavigationBar></StudentNavigationBar>
                <div className="admin-panel">Смена вида</div>
            </div>

            <div className="main-content"> {children} </div>
        </div>
    );
}
