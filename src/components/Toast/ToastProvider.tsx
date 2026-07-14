'use client';

import './Toast.css';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    ReactNode,
} from 'react';

export type ToastType = 'error' | 'success' | 'info';

type Toast = {
    id: number;
    type: ToastType;
    text: string;
};

type ToastContextValue = {
    show: (text: string, type?: ToastType) => void;
    error: (text: string) => void;
    success: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Сколько всплывашка держится на экране (мс).
const DURATION = 3500;

const ICONS: Record<ToastType, string> = {
    error: '⚠',
    success: '✓',
    info: 'ℹ',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counter = useRef(0);

    const remove = useCallback((id: number) => {
        setToasts((list) => list.filter((t) => t.id !== id));
    }, []);

    const show = useCallback(
        (text: string, type: ToastType = 'error') => {
            if (!text) return;
            const id = ++counter.current;
            setToasts((list) => [...list, { id, type, text }]);
            setTimeout(() => remove(id), DURATION);
        },
        [remove],
    );

    const error = useCallback((text: string) => show(text, 'error'), [show]);
    const success = useCallback(
        (text: string) => show(text, 'success'),
        [show],
    );

    // Стабильная ссылка на значение контекста, иначе каждый показ тоста
    // ре-рендерит провайдер, меняет ссылку и вызывает бесконечный цикл
    // в useEffect-ах потребителей, завязанных на `toast`.
    const value = useMemo(
        () => ({ show, error, success }),
        [show, error, success],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-viewport" role="region" aria-live="polite">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast toast--${t.type}`}
                        role="alert"
                        onClick={() => remove(t.id)}
                    >
                        <span className="toast__icon">{ICONS[t.type]}</span>
                        <span className="toast__text">{t.text}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Хук для показа всплывашек из любого клиентского компонента.
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error(
            'useToast должен использоваться внутри <ToastProvider>',
        );
    }
    return ctx;
}
