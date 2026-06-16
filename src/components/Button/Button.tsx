import './Button.css';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: string;
};

export default function Button({ children, variant, ...rest }: Props) {
    return (
        <button className={`base-button ${variant}`} {...rest}>
            {children}
        </button>
    );
}
