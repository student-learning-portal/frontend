import './Input.css';
import { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
    variant?: string;
};

export default function Input({ variant, ...rest }: Props) {
    return <input className={`base-input ${variant}`} {...rest}></input>;
}
