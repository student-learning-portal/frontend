import { Url } from 'node:url';
import { IconNames } from '@/types/iconNames';

export type StudentNavigationLinkProps = {
    title: string;
    href: string | Url;
    iconName: IconNames;
};

export type CatalogNavigationLinkProps = {
    title: string;
    href: string | Url;
    iconName: null;
};
