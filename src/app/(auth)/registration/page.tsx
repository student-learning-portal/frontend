'use client';

import Button from '@/components/UI/Button/Button';
import Icon from '@/components/UI/Icon/Icon';
import './registrationPage.css';
import Input from '@/components/UI/Input/Input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const router = useRouter();
    const [chosenRole, setChosenRole] = useState('student');

    return (
        <div className="registration-container">
            <h2> Создать аккаунт </h2>
            <div className="role-container">
                <Button
                    onClick={() => setChosenRole('student')}
                    variant={chosenRole === 'student' ? 'primary' : 'secondary'}
                >
                    <Icon size={20} name="graduation"></Icon>
                    Ученик
                </Button>
                <Button
                    onClick={() => setChosenRole('teacher')}
                    variant={chosenRole === 'teacher' ? 'primary' : 'secondary'}
                >
                    <Icon size={20} name="users"></Icon>
                    Преподаватель
                </Button>
            </div>
            <div className="input-area">
                <div className="label"> Имя </div>
                <Input placeholder="Введите имя"></Input>
            </div>
            <div className="input-area">
                <div className="label"> Email </div>
                <Input placeholder="Введите email"></Input>
            </div>
            <div className="input-area">
                <div className="label">Пароль</div>
                <Input
                    placeholder="Введите пароль"
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
            <Button
                style={{ height: '44px' }}
                onClick={() => {
                    router.push('/');
                }}
            >
                Зарегистрироваться
            </Button>
        </div>
    );
}
