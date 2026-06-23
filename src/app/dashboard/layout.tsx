import { ReactNode } from 'react';
import './mainPage.css';
import Link from 'next/link';
import StudentNavigationBar from '@/components/StudentNavigationBar/NavigationBar';
import Icon from '@/components/UI/Icon/Icon';
import SearchBar from '@/components/SearchBar/SearchBar';
import LogoutButton from '@/components/LogoutButton/LogoutButton';
import { studentNavigationLinkProps } from '@/constants/navigationLinks';

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="main-container">
            <Link href="/dashboard" className="logo-part">
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
                    <LogoutButton />
                </div>
            </div>
            <div className="side-bar">
                <StudentNavigationBar
                    navigationLinkProps={studentNavigationLinkProps}
                ></StudentNavigationBar>
                <div className="admin-panel">Смена вида</div>
            </div>
            <div className="main-content"> {children} ddfdfdfdfd</div>
        </div>
    );
}
