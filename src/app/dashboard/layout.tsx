import { ReactNode } from 'react';
import { auth } from '@/auth';
import AppShell from '@/components/AppShell/AppShell';
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
