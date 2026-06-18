import { NavigationLinkProps } from '@/types/navigationLinkProps';

export const navigationLinkProps: NavigationLinkProps[] = [
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
