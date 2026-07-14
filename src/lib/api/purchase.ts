'use server';

import { auth } from '@/auth';
import { translateError } from './apiError';

export type CheckoutData = {
    transaction_id: string;
    status: string;
    amount: number;
    currency: string;
    balance: number;
    payment_session_id: string;
    redirect_url: string;
};

export type RefundData = {
    transaction_id: string;
    status: string;
    amount: number;
    currency: string;
    balance: number;
};

export type TransactionEntry = {
    transaction_id: string;
    course_id: string;
    course_title: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
};

export type PurchaseResult<T> =
    | { ok: true; data: T }
    | { ok: false; code: PurchaseErrorCode; message: string };

export type PurchaseErrorCode =
    | 'unauthenticated'
    | 'insufficient_funds'
    | 'already_purchased'
    | 'not_found'
    | 'unknown';

async function postJson<T>(
    path: string,
    body: unknown,
): Promise<PurchaseResult<T>> {
    const session = await auth();
    if (!session?.accessToken) {
        return {
            ok: false,
            code: 'unauthenticated',
            message: 'Войдите в аккаунт, чтобы продолжить.',
        };
    }

    const url = `${process.env.BACKEND_URL}${path}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (response.ok) {
            return { ok: true, data: (await response.json()) as T };
        }

        const text = await response.text();
        console.error(`[purchase] ${response.status} ${url} :: ${text}`);

        const message = translateError(response.status, text);

        // Maps the backend's HTTP status back to a typed PurchaseErrorCode so
        // callers can branch on `code` instead of parsing status/text themselves.
        // The message itself is the specific, translated backend error.
        switch (response.status) {
            case 401:
                return { ok: false, code: 'unauthenticated', message };
            case 402:
                return { ok: false, code: 'insufficient_funds', message };
            case 409:
                return { ok: false, code: 'already_purchased', message };
            case 404:
                return { ok: false, code: 'not_found', message };
            default:
                return { ok: false, code: 'unknown', message };
        }
    } catch (err) {
        console.error(`[purchase] fetch failed for ${url}:`, err);
        return {
            ok: false,
            code: 'unknown',
            message: 'Сервер недоступен. Попробуйте позже.',
        };
    }
}

export async function checkout(courseId: string) {
    return postJson<CheckoutData>('/api/v1/purchase/checkout', {
        course_id: courseId,
    });
}

export async function refund(courseId: string) {
    return postJson<RefundData>('/api/v1/purchase/refund', {
        course_id: courseId,
    });
}

export async function getHistory(): Promise<TransactionEntry[]> {
    const session = await auth();
    if (!session?.accessToken) return [];

    const url = `${process.env.BACKEND_URL}/api/v1/purchase/history`;
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error(`[purchase] ${response.status} from ${url}`);
            return [];
        }
        const data = (await response.json()) as {
            transactions: TransactionEntry[];
        };
        return data.transactions ?? [];
    } catch (err) {
        console.error(`[purchase] fetch failed for ${url}:`, err);
        return [];
    }
}
