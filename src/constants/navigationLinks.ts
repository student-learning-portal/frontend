import {
    StudentNavigationLinkProps,
    CatalogNavigationLinkProps,
} from '@/types/navigationLinkProps';

export const studentNavigationLinkProps: StudentNavigationLinkProps[] = [
    {
        title: 'Главная',
        href: '/dashboard',
        iconName: 'home',
    },
    {
        title: 'Каталог',
        href: '/catalog',
        iconName: 'search',
    },
    {
        title: 'Мои курсы',
        href: '/dashboard/my-courses',
        iconName: 'book',
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
        title: 'Аналитика',
        href: '/dashboard/teacher',
        iconName: 'chart',
    },
    {
        title: 'Каталог',
        href: '/catalog',
        iconName: 'search',
    },
    {
        title: 'Настройки',
        href: '/dashboard/settings',
        iconName: 'settings',
    },
];

export const catalogNavigationLinkProps: CatalogNavigationLinkProps[] = [
    {
        title: 'Каталог',
        href: '/catalog',
        iconName: null,
    },
    {
        title: 'Преподаватели',
        href: '/catalog/teachers',
        iconName: null,
    },
];
