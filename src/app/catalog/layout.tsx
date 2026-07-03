import { ReactNode } from 'react';
import { auth } from '@/auth';
import AppShell from '@/components/AppShell/AppShell';
import NavigationBar from '@/components/StudentNavigationBar/NavigationBar';
import {
    studentNavigationLinkProps,
    teacherNavigationLinkProps,
    catalogNavigationLinkProps,
} from '@/constants/navigationLinks';
import './catalogPage.css';

export default async function CatalogLayout({
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
            <div className="catalog-subnav">
                <NavigationBar
                    type="row"
                    navigationLinkProps={catalogNavigationLinkProps}
                ></NavigationBar>
            </div>
            {children}
        </AppShell>
    );
}
