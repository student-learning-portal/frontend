import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Sehriyo',
    description: 'Обучающая платформа для учеников школы Sehriyo',
    icons: {
        icon: [
            {
                url: '/favicon-light.svg',
                media: '(prefers-color-scheme: light)',
            },
            {
                url: '/favicon-dark.svg',
                media: '(prefers-color-scheme: dark)',
            },
        ],
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
