import './NavigationBarLink.css';
import Link from 'next/link';
import { Url } from 'node:url';
import Icon from '@/components/Icon/Icon';
import { IconNames } from '@/types/iconNames';

type Props = {
    title: string;
    href: string | Url;
    iconName: IconNames;
    onClick: () => void;
    active: boolean;
};

export default function NavigationBarLink({
    title,
    href,
    iconName,
    onClick,
    active,
}: Props) {
    return (
        <Link
            href={href}
            className={`link-container ${active && 'active'}`}
            onClick={onClick}
        >
            <Icon name={iconName} size={20}></Icon>
            <span> {title} </span>
        </Link>
    );
}
