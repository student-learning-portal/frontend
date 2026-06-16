import { Url } from 'node:url';
import { IconNames } from '@/types/iconNames';

export type NavigationLinkProps = {
    title: string;
    href: string | Url;
    iconName: IconNames;
};
