'use client';

import './Select.css';
import { useEffect, useRef, useState } from 'react';
import { SelectOption } from '@/types/selectOption';
import Icon from '@/components/UI/Icon/Icon';

type Props = {
    selectValues: SelectOption[];
    value: string;
    onChange: (value: string) => void;
};

export default function Select({ selectValues, value, onChange }: Props) {
    const [isListVisible, setIsListVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsListVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = selectValues.find((o) => o.value === value) ?? selectValues[0];

    return (
        <div className="select-container" ref={ref}>
            <button
                className={`select ${isListVisible ? 'open' : ''}`}
                onClick={() => setIsListVisible((prev) => !prev)}
            >
                <span>{selectedOption.title}</span>
                <span className={`select-icon ${isListVisible ? 'rotate' : ''}`}>
                    <Icon size={18} name="chevronDown" style={{ color: 'var(--navy-56)' }} />
                </span>
            </button>
            <div className={`option-list ${isListVisible ? 'visible' : ''}`}>
                {selectValues.map((option) => (
                    <button
                        key={option.value}
                        className={`option ${value === option.value ? 'selected' : ''}`}
                        onClick={() => {
                            onChange(option.value);
                            setIsListVisible(false);
                        }}
                    >
                        {option.title}
                        {value === option.value && (
                            <Icon size={18} name="check" style={{ color: 'var(--navy-56)' }} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}