const EVENT_NAME = 'coin-balance:update';

export function emitCoinBalanceUpdate(balance: number) {
    window.dispatchEvent(
        new CustomEvent<number>(EVENT_NAME, { detail: balance }),
    );
}

export function onCoinBalanceUpdate(callback: (balance: number) => void) {
    function handler(event: Event) {
        callback((event as CustomEvent<number>).detail);
    }
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
}
