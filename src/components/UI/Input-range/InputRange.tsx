import './InputRange.css';
import { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function InputRange({ ...props }: Props) {
    return <input className="input-range" type="range" {...props}></input>;
}
