import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Sehriyo',
    description: 'Обучающая платформа для учеников школы Sehriyo',
    icons: {
        icon: '/logo-navy.svg',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
