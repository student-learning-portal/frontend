'use client';

import './NavigationBar.css';
import NavigationBarLink from '@/components/NavigationBarLink/NavigationLink';
import { CSSProperties, useState } from 'react';
import {
    CatalogNavigationLinkProps,
    StudentNavigationLinkProps,
} from '@/types/navigationLinkProps';

type Props = {
    type?: string;
    navigationLinkProps:
        | StudentNavigationLinkProps[]
        | CatalogNavigationLinkProps[];
    linkStyle?: CSSProperties;
};

export default function NavigationBar({
    type,
    navigationLinkProps,
    linkStyle,
}: Props) {
    const [activeTab, setActiveTab] = useState('');

    return (
        <div className={`navigation-bar ${type}`}>
            {navigationLinkProps.map((props) => (
                <NavigationBarLink
                    key={props.title}
                    title={props.title}
                    href={props.href}
                    iconName={props?.iconName}
                    onClick={() => setActiveTab(props.title)}
                    active={activeTab === props.title}
                    linkStyle={linkStyle}
                ></NavigationBarLink>
            ))}
        </div>
    );
}
