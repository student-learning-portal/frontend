'use client';

import './CoinBalance.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMe } from '@/lib/api/profile';
import { onCoinBalanceUpdate } from './coinBalanceEvents';

export default function CoinBalance() {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            const me = await getMe();
            if (!active || !me) return;
            setBalance(me.balance);
        })();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        return onCoinBalanceUpdate((newBalance) => setBalance(newBalance));
    }, []);

    if (balance === null) return null;

    return (
        <Link
            href="/dashboard/payments"
            className="coin-balance"
            title="Баланс монет"
        >
            <span className="coin-balance__icon">🪙</span>
            <span className="coin-balance__value">
                {balance.toLocaleString('ru-RU')}
            </span>
        </Link>
    );
}
