import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

function read(): boolean {
    return window.matchMedia?.(query).matches ?? false;
}

function subscribe(listener: () => void): () => void {
    const media = window.matchMedia?.(query);
    media?.addEventListener('change', listener);

    return () => media?.removeEventListener('change', listener);
}

export default function usePrefersReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, read, () => false);
}
