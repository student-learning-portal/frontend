'use client';

import './InputRange.css';
import { InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
    value: number;
    onChange: (value: number) => void;
};

export default function InputRange({ value, onChange, ...props }: Props) {
    return (
        <div className="input-range-container">
            <span className="input-range-text">До {value}</span>
            <input
                {...props}
                className="input-range"
                type="range"
                value={value}
                onChange={(event) => {
                    onChange(Number(event.target.value));
                }}
            ></input>
        </div>
    );
}
