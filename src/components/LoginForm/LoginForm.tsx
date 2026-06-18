'use client';

import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import { useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/UI/Icon/Icon';
import { authenticate } from '@/lib/actions';

export default function LoginForm() {
    const greetings = ['Добро пожаловать', 'Xush kelibsiz', 'Welcome'];

    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [state, formAction, isPending] = useActionState(authenticate, {
        error: null,
        email: '',
    });
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

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
        <form action={formAction} className="login-container">
            <h2
                key={index}
                className={`greeting-header${!isVisible ? ' fading' : ''}`}
            >
                {greetings[index]}
            </h2>
            <div className="input-area">
                <div className="label"> Email </div>
                <Input
                    placeholder="Введите email"
                    type="email"
                    name="email"
                    defaultValue={state.email}
                    required
                ></Input>
            </div>
            <div className="input-area">
                <div className="label">
                    <div className="label-name"> Пароль </div>
                    <div className="password-change-link"> Забыли пароль? </div>
                </div>
                <Input
                    placeholder="Введите пароль"
                    type={isPasswordVisible ? 'text' : 'password'}
                    variant="children"
                    name="password"
                    required
                >
                    <button
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        type="button"
                    >
                        <Icon
                            size={20}
                            name={isPasswordVisible ? 'closedEye' : 'eye'}
                        ></Icon>
                    </button>
                </Input>
                <input type="hidden" name="redirectTo" value={callbackUrl} />
            </div>
            <div>{state.error}</div>
            <Button style={{ height: '44px' }} disabled={isPending}>
                Войти
            </Button>
        </form>
    );
}
