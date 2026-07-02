import { ReactNode } from 'react';
import './mainPage.css';
import Link from 'next/link';
import { auth } from '@/auth';
import StudentNavigationBar from '@/components/StudentNavigationBar/NavigationBar';
import Icon from '@/components/UI/Icon/Icon';
import SearchBar from '@/components/SearchBar/SearchBar';
import Avatar from '@/components/Avatar/Avatar';
import CoinBalance from '@/components/CoinBalance/CoinBalance';
import {
    studentNavigationLinkProps,
    teacherNavigationLinkProps,
} from '@/constants/navigationLinks';

export default async function MainLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();
    const isTeacher = session?.user?.role === 'teacher';

    const navigationLinkProps = isTeacher
        ? teacherNavigationLinkProps
        : studentNavigationLinkProps;
    const portalTitle = isTeacher ? 'Портал преподавателя' : 'Портал ученика';
    const homeHref = isTeacher ? '/dashboard/teacher' : '/dashboard';

    return (
        <div className="main-container">
            <Link href={homeHref} className="logo-part">
                <img src="/logo-navy.svg" alt="sehriyo-logo"></img>
                <span>{portalTitle}</span>
            </Link>
            <div className="top-bar">
                <SearchBar></SearchBar>
                <div className="profile-part">
                    <CoinBalance />
                    <Icon
                        size={20}
                        name="bell"
                        style={{
                            alignSelf: 'center',
                        }}
                    ></Icon>
                    <Avatar
                        name={session?.user?.fullName}
                        role={session?.user?.role}
                    />
                </div>
            </div>
            <div className="side-bar">
                <StudentNavigationBar
                    navigationLinkProps={navigationLinkProps}
                ></StudentNavigationBar>
                <div className="admin-panel">
                    {isTeacher ? 'Преподаватель' : 'Ученик'}
                </div>
            </div>
            <div className="main-content">{children}</div>
        </div>
    );
}
