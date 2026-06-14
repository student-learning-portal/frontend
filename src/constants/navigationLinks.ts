import { NavigationLinkProps } from '@/types/navigationLinkProps';

export const navigationLinkProps: NavigationLinkProps[] = [
    {
        title: 'Главная',
        href: '/',
        iconName: 'home',
    },
    {
        title: 'Каталог',
        href: '/catalog',
        iconName: 'search',
    },
    {
        title: 'Мои курсы',
        href: '/my-courses',
        iconName: 'book',
    },
    {
        title: 'Результаты',
        href: '/results',
        iconName: 'chart',
    },
    {
        title: 'Платежи',
        href: '/payments',
        iconName: 'wallet',
    },
    {
        title: 'Настройки',
        href: '/settings',
        iconName: 'settings',
    },
];
