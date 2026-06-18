import React, { CSSProperties } from 'react';
import { ICONS } from '@/constants/icons';
import { IconNames } from '@/types/iconNames';

type Props = {
    name: IconNames;
    size: number;
    strokeWidth?: string;
    className?: string;
    color?: string;
    style?: CSSProperties;
};

export default function Icon({
    name,
    size,
    color,
    strokeWidth = '1.75',
    className,
    style,
}: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color || 'currentColor'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
        >
            <path d={ICONS[name]}></path>
        </svg>
    );
}
