import { IconNames } from '@/components/Icon/Icon';
import { Url } from 'node:url';

export type NavigationLinkProps = {
    title: string;
    href: string | Url;
    iconName: IconNames;
};
