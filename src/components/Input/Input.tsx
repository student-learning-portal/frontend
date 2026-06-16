import './Input.css';
import { InputHTMLAttributes, ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
    variant?: string;
    children?: ReactNode;
};

export default function Input({ variant, children, ...rest }: Props) {
    return children ? (
        <div className="input-container">
            <input className={`base-input ${variant}`} {...rest}></input>
            <div className="children-container">{children}</div>
        </div>
    ) : (
        <input className={`base-input ${variant}`} {...rest}></input>
    );
}
