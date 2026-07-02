import { ReactNode } from 'react';
import Link from 'next/link';

import { auth } from '@/auth';
import NavigationBar from '@/components/StudentNavigationBar/NavigationBar';
import { catalogNavigationLinkProps } from '@/constants/navigationLinks';
import './catalogPage.css';
import Button from '@/components/UI/Button/Button';
import Avatar from '@/components/Avatar/Avatar';
import Icon from '@/components/UI/Icon/Icon';
import CoinBalance from '@/components/CoinBalance/CoinBalance';

export default async function CatalogLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();
    return (
        <div className="catalog-container">
            <header className="catalog-header">
                <div className="catalog-navigation">
                    <Link href="/dashboard">
                        <img
                            src="/logo-navy.svg"
                            alt="sehryo-logo"
                            height={24}
                        />
                    </Link>
                    <NavigationBar
                        type="row"
                        navigationLinkProps={catalogNavigationLinkProps}
                        linkStyle={{ color: 'var(--navy)' }}
                    ></NavigationBar>
                </div>
                <div className="profile-navigation">
                    <CoinBalance />
                    <Link href="/dashboard">
                        <Button variant="secondary">
                            <Icon name="grid" size={20}></Icon> Личный
                            кабинет{' '}
                        </Button>
                    </Link>
                    <Avatar
                        name={session?.user?.fullName}
                        role={session?.user?.role}
                    />
                </div>
            </header>
            {children}
        </div>
    );
}
