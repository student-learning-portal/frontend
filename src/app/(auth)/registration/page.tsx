'use client';

import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';
import './registrationPage.css';
import Input from '@/components/UI/Input/Input';
import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/actions';

export default function Page() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    useRouter();
    const [chosenRole, setChosenRole] = useState('student');

    const [, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <form action={formAction} className="registration-container">
            <h2> Создать аккаунт </h2>
            <div className="role-container">
                <Button
                    onClick={() => setChosenRole('student')}
                    variant={chosenRole === 'student' ? 'primary' : 'secondary'}
                    type="button"
                >
                    <Icon size={20} name="graduation"></Icon>
                    Ученик
                </Button>
                <Button
                    onClick={() => setChosenRole('teacher')}
                    variant={chosenRole === 'teacher' ? 'primary' : 'secondary'}
                    type="button"
                >
                    <Icon size={20} name="users"></Icon>
                    Преподаватель
                </Button>
            </div>
            <div className="input-area">
                <div className="label"> Имя </div>
                <Input placeholder="Введите имя" required></Input>
            </div>
            <div className="input-area">
                <div className="label"> Email </div>
                <Input placeholder="Введите email" required></Input>
            </div>
            <div className="input-area">
                <div className="label">Пароль</div>
                <Input
                    placeholder="Введите пароль"
                    type={isPasswordVisible ? 'text' : 'password'}
                    variant="children"
                    required
                >
                    <button
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                    >
                        <Icon
                            size={20}
                            name={isPasswordVisible ? 'closedEye' : 'eye'}
                        ></Icon>
                    </button>
                </Input>
            </div>
            <div className="input-area">
                <div className="label">Подтвердите пароль</div>
                <Input
                    placeholder="Повторите пароль"
                    type={isPasswordVisible ? 'text' : 'password'}
                    variant="children"
                >
                    <button
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                    >
                        <Icon
                            size={20}
                            name={isPasswordVisible ? 'closedEye' : 'eye'}
                        ></Icon>
                    </button>
                </Input>
            </div>
            <Button style={{ height: '44px' }} disabled={isPending}>
                Зарегистрироваться
            </Button>
        </form>
    );
}
