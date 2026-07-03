import { ReactNode } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import './AppShell.css';
import StudentNavigationBar from '@/components/StudentNavigationBar/NavigationBar';
import Icon from '@/components/UI/Icon/Icon';
import SearchBar from '@/components/SearchBar/SearchBar';
import Avatar from '@/components/Avatar/Avatar';
import CoinBalance from '@/components/CoinBalance/CoinBalance';
import { StudentNavigationLinkProps } from '@/types/navigationLinkProps';

type AppShellProps = {
    children: ReactNode;
    session: Session | null;
    navigationLinkProps: StudentNavigationLinkProps[];
    portalTitle: string;
    homeHref: string;
};

export default function AppShell({
    children,
    session,
    navigationLinkProps,
    portalTitle,
    homeHref,
}: AppShellProps) {
    const isTeacher = session?.user?.role === 'teacher';

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
