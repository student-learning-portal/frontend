import './payments.css';
import { getMe } from '@/lib/api/profile';
import { getHistory, TransactionEntry } from '@/lib/api/purchase';
import Icon from '@/components/UI/Icon/Icon';

function formatCoins(amount: number): string {
    return `${amount.toLocaleString('ru-RU')} монет`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const STATUS_LABEL: Record<string, string> = {
    succeeded: 'Оплата',
    refunded: 'Возврат',
    attempted: 'В обработке',
    failed: 'Не прошла',
};

function TransactionRow({ tx }: { tx: TransactionEntry }) {
    const isRefund = tx.status === 'refunded';
    const label = STATUS_LABEL[tx.status] ?? tx.status;

    return (
        <li className="payments__row">
            <div className="payments__row-main">
                <span className="payments__row-title">
                    {tx.course_title || 'Курс удалён'}
                </span>
                <span className="payments__row-date">
                    {formatDate(tx.created_at)}
                </span>
            </div>
            <span
                className={`payments__row-status payments__row-status--${tx.status}`}
            >
                {label}
            </span>
            <span
                className={`payments__row-amount payments__row-amount--${
                    isRefund ? 'credit' : 'debit'
                }`}
            >
                {isRefund ? '+' : '−'}
                {formatCoins(tx.amount)}
            </span>
        </li>
    );
}

export default async function Page() {
    const [me, transactions] = await Promise.all([getMe(), getHistory()]);

    return (
        <div className="payments">
            <div className="payments__head">
                <h1 className="payments__title">Платежи</h1>
                <p className="payments__subtitle">
                    Баланс монет и история покупок курсов.
                </p>
            </div>

            <div className="payments__balance-card">
                <span className="payments__balance-icon">
                    <Icon name="wallet" size={24} />
                </span>
                <div className="payments__balance-info">
                    <span className="payments__balance-label">
                        Баланс монет
                    </span>
                    <span className="payments__balance-value">
                        {formatCoins(me?.balance ?? 0)}
                    </span>
                </div>
                <p className="payments__balance-note">
                    Монеты — виртуальная валюта песочницы. Реальные деньги не
                    списываются.
                </p>
            </div>

            <div className="payments__history">
                <h2 className="payments__history-title">История операций</h2>
                {transactions.length === 0 ? (
                    <p className="payments__empty">
                        Пока нет ни одной операции. Купите курс в каталоге,
                        чтобы увидеть историю здесь.
                    </p>
                ) : (
                    <ul className="payments__list">
                        {transactions.map((tx) => (
                            <TransactionRow key={tx.transaction_id} tx={tx} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
