'use client';

import './StudentNavigationBar.css';
import NavigationBarLink from '@/components/NavigationBarLink/NavigationBarLink';
import { navigationLinkProps } from '@/constants/navigationLinks';
import { useState } from 'react';

export default function StudentNavigationBar() {
    const [activeTab, setActiveTab] = useState('');

    return (
        <div className="navigation-bar">
            {navigationLinkProps.map((props) => (
                <NavigationBarLink
                    key={props.title}
                    title={props.title}
                    href={props.href}
                    iconName={props.iconName}
                    onClick={() => setActiveTab(props.title)}
                    active={activeTab === props.title}
                ></NavigationBarLink>
            ))}
        </div>
    );
}
