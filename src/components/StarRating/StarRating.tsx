'use client';

import './StarRating.css';
import { useState } from 'react';

type Props = {
    // Текущее значение (среднее по курсу/учителю или собственная оценка).
    value?: number;
    // Верхняя граница шкалы (у бэкенда — 10).
    max?: number;
    // Только показ (с дробным заполнением звёзд), без возможности кликать.
    readOnly?: boolean;
    disabled?: boolean;
    // Размер звезды в пикселях.
    size?: number;
    onRate?: (score: number) => void;
};

export default function StarRating({
    value = 0,
    max = 10,
    readOnly = false,
    disabled = false,
    size = 18,
    onRate,
}: Props) {
    const [hover, setHover] = useState<number | null>(null);

    if (readOnly) {
        const pct = Math.max(0, Math.min(100, (value / max) * 100));
        return (
            <span
                className="star-rating star-rating--readonly"
                style={{ fontSize: size }}
                aria-label={`Рейтинг ${value.toFixed(1)} из ${max}`}
            >
                <span className="star-rating__track">
                    {Array.from({ length: max }).map((_, i) => (
                        <span key={i} className="star-rating__star">
                            ★
                        </span>
                    ))}
                    <span
                        className="star-rating__fill"
                        style={{ width: `${pct}%` }}
                    >
                        {Array.from({ length: max }).map((_, i) => (
                            <span key={i} className="star-rating__star">
                                ★
                            </span>
                        ))}
                    </span>
                </span>
            </span>
        );
    }

    const active = hover ?? value;
    return (
        <span
            className="star-rating star-rating--input"
            style={{ fontSize: size }}
            role="radiogroup"
            aria-label="Поставить оценку"
        >
            {Array.from({ length: max }).map((_, i) => {
                const score = i + 1;
                return (
                    <button
                        key={score}
                        type="button"
                        disabled={disabled}
                        className={`star-rating__btn${
                            score <= active ? ' star-rating__btn--on' : ''
                        }`}
                        onMouseEnter={() => setHover(score)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(score)}
                        onBlur={() => setHover(null)}
                        onClick={() => onRate?.(score)}
                        aria-label={`Оценка ${score} из ${max}`}
                        title={String(score)}
                    >
                        ★
                    </button>
                );
            })}
        </span>
    );
}
