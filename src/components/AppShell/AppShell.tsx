import { ReactNode } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import './AppShell.css';
import StudentNavigationBar from '@/components/StudentNavigationBar/NavigationBar';
import Avatar from '@/components/Avatar/Avatar';
import CoinBalance from '@/components/CoinBalance/CoinBalance';
import { StudentNavigationLinkProps } from '@/types/navigationLinkProps';
import { UserRole } from '@/models/User';

const ROLE_LABEL: Record<UserRole, string> = {
    teacher: 'Преподаватель',
    student: 'Ученик',
    admin: 'Администратор',
};

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
    const roleLabel = ROLE_LABEL[session?.user?.role ?? 'student'];

    return (
        <div className="main-container">
            <Link href={homeHref} className="logo-part">
                <img src="/logo-navy.svg" alt="sehriyo-logo"></img>
                <span>{portalTitle}</span>
            </Link>
            <div className="top-bar">
                <div className="profile-part">
                    <CoinBalance />
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
                <div className="admin-panel">{roleLabel}</div>
            </div>
            <div className="main-content">{children}</div>
        </div>
    );
}
