import { ReactNode } from 'react';
import { auth } from '@/auth';
import AppShell from '@/components/AppShell/AppShell';
import {
    adminNavigationLinkProps,
    pendingTeacherNavigationLinkProps,
    studentNavigationLinkProps,
    teacherNavigationLinkProps,
} from '@/constants/navigationLinks';
import { isAwaitingApproval } from '@/lib/roles';

export default async function MainLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();
    const role = session?.user?.role;
    // A teacher still in the approval queue gets the stripped-down navigation:
    // the teacher pages would only 403 until an administrator confirms them.
    const isPendingTeacher = isAwaitingApproval(
        role,
        session?.user?.teacherStatus,
    );

    let navigationLinkProps = studentNavigationLinkProps;
    let portalTitle = 'Портал ученика';
    let homeHref = '/dashboard';

    if (role === 'admin') {
        navigationLinkProps = adminNavigationLinkProps;
        portalTitle = 'Панель администратора';
        homeHref = '/dashboard/admin';
    } else if (isPendingTeacher) {
        navigationLinkProps = pendingTeacherNavigationLinkProps;
        portalTitle = 'Портал преподавателя';
        homeHref = '/dashboard/pending';
    } else if (role === 'teacher') {
        navigationLinkProps = teacherNavigationLinkProps;
        portalTitle = 'Портал преподавателя';
        homeHref = '/dashboard/teacher';
    }

    return (
        <AppShell
            session={session}
            navigationLinkProps={navigationLinkProps}
            portalTitle={portalTitle}
            homeHref={homeHref}
        >
            {children}
        </AppShell>
    );
}
