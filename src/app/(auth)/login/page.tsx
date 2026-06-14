'use client';

import Button from '@/components/Button/Button';
import './loginPage.css';
import Input from '@/components/Input/Input';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const greetings = ['Добро пожаловать', 'Xush kelibsiz', 'Welcome'];

    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % greetings.length);
                setIsVisible(true);
            }, 500);
        }, 4000);
        return () => {
            clearInterval(interval);
        };
    }, [greetings.length]);

    return (
        <div className="login-container">
            <h2
                key={index}
                className={`greeting-header${!isVisible ? ' fading' : ''}`}
            >
                {greetings[index]}
            </h2>
            <div className="input-area">
                <div className="label"> Email </div>
                <Input placeholder="Введите email" type="email"></Input>
            </div>
            <div className="input-area">
                <div className="label">
                    <div className="label-name"> Пароль </div>
                    <div className="password-change-link"> Забыли пароль? </div>
                </div>
                <Input placeholder="Введите пароль" type="password"></Input>
            </div>
            <Button
                style={{ height: '44px' }}
                onClick={() => {
                    router.push('/');
                }}
            >
                Войти
            </Button>
        </div>
    );
}
