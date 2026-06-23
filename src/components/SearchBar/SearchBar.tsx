'use client';

import './SearchBar.css';
import Icon from '@/components/UI/Icon/Icon';
import { ComponentProps } from 'react';

type SearchBarProps = {
    value?: string;
    onChange?: (value: string) => void;
} & Omit<ComponentProps<'input'>, 'onChange'>;

export default function SearchBar({
    value,
    onChange,
    ...props
}: SearchBarProps) {
    return (
        <div className="search-bar">
            <Icon size={20} name="search" />
            <input
                className="search-field"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                {...props}
            />
        </div>
    );
}
