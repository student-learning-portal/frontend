'use client';

import './Select.css';
import { ButtonHTMLAttributes, useEffect, useRef, useState } from 'react';
import { SelectOption } from '@/types/selectOption';
import Icon from '@/components/UI/Icon/Icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    selectValues: SelectOption[];
};

export default function Select({ selectValues, ...props }: Props) {
    const [chosenValue, setChosenValue] = useState(selectValues[0].title);
    const [isListVisible, setIsListVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                currentContainer &&
                !currentContainer.contains(event.target as Node)
            ) {
                setIsListVisible(false);
            }
        };
        const currentContainer = ref.current;
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="select-container" ref={ref}>
            <button
                {...props}
                className={`select ${isListVisible ? 'open' : ''}`}
                onClick={() => {
                    setIsListVisible((prev) => !prev);
                }}
            >
                <span>{chosenValue}</span>
                <span
                    className={`select-icon ${isListVisible ? 'rotate' : ''}`}
                >
                    <Icon
                        size={18}
                        name="chevronDown"
                        style={{ color: 'var(--navy-56)' }}
                    ></Icon>
                </span>
            </button>
            <div
                className={`option-list ${isListVisible ? 'visible' : ''}`}
                ref={ref}
            >
                {selectValues.map((option) => (
                    <button
                        key={option.value}
                        value={option.value}
                        className={`option ${chosenValue === option.title ? 'selected' : ''}`}
                        onClick={() => {
                            setChosenValue(option.title);
                            setIsListVisible(false);
                        }}
                    >
                        {option.title}
                        {chosenValue === option.title && (
                            <Icon
                                size={18}
                                name="check"
                                style={{
                                    color: 'var(--navy-56)',
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
