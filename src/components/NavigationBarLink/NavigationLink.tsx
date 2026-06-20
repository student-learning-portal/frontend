import './NavigationLink.css';
import Link from 'next/link';
import { Url } from 'node:url';
import Icon from '@/components/UI/Icon/Icon';
import { IconNames } from '@/types/iconNames';
import React, { CSSProperties } from 'react';

type Props = {
    title: string;
    href: string | Url;
    iconName?: IconNames | null;
    onClick: () => void;
    active: boolean;
    linkStyle?: CSSProperties;
    style?: React.CSSProperties | undefined;
};

export default function NavigationLink({
    title,
    href,
    iconName,
    onClick,
    active,
    linkStyle,
}: Props) {
    return (
        <Link
            href={href}
            className={`link-container ${active && 'active'}`}
            onClick={onClick}
            style={linkStyle}
        >
            {iconName && <Icon name={iconName} size={20}></Icon>}
            <span> {title} </span>
        </Link>
    );
}
