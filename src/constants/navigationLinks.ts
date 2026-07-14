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
