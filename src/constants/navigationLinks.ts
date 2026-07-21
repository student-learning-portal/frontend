import { StudentNavigationLinkProps } from '@/types/navigationLinkProps';

export const studentNavigationLinkProps: StudentNavigationLinkProps[] = [
    {
        title: 'Мои курсы',
        href: '/dashboard/my-courses',
        iconName: 'book',
    },
    {
        title: 'Каталог',
        href: '/catalog',
        iconName: 'search',
    },
    {
        title: 'Результаты',
        href: '/dashboard/results',
        iconName: 'chart',
    },
    {
        title: 'Платежи',
        href: '/dashboard/payments',
        iconName: 'wallet',
    },
    {
        title: 'Настройки',
        href: '/dashboard/settings',
        iconName: 'settings',
    },
];

export const teacherNavigationLinkProps: StudentNavigationLinkProps[] = [
    {
        title: 'Главная',
        href: '/dashboard/teacher',
        iconName: 'home',
    },
    {
        title: 'Мои курсы',
        href: '/dashboard/teacher/courses',
        iconName: 'book',
    },
    {
        title: 'Настройки',
        href: '/dashboard/settings',
        iconName: 'settings',
    },
];

// A teacher waiting on (or refused) approval only has the waiting screen and
// their own settings — every other teacher route is closed to them anyway.
export const pendingTeacherNavigationLinkProps: StudentNavigationLinkProps[] = [
    {
        title: 'Статус заявки',
        href: '/dashboard/pending',
        iconName: 'clock',
    },
    {
        title: 'Настройки',
        href: '/dashboard/settings',
        iconName: 'settings',
    },
];

export const adminNavigationLinkProps: StudentNavigationLinkProps[] = [
    {
        title: 'Заявки',
        href: '/dashboard/admin',
        iconName: 'users',
    },
    {
        title: 'Настройки',
        href: '/dashboard/settings',
        iconName: 'settings',
    },
];
