import { router } from '@inertiajs/react';

const projectSelectPage = 'Projects/Select';

let pendingNavigation: Set<() => void> | undefined;

/** 初期Pageのswapが済むまで、互換訪問による割り込みを防ぎます。 */
export function deferProjectSelectNavigation(): () => void {
    const pending = new Set<() => void>();
    pendingNavigation = pending;

    const stop = router.on('navigate', ({ detail: { page } }) => {
        stop();
        pendingNavigation = undefined;

        if (page.component === projectSelectPage) {
            pending.forEach((navigate) => navigate());
        }

        pending.clear();
    });

    return () => {
        stop();
        if (pendingNavigation === pending) {
            pendingNavigation = undefined;
        }
        pending.clear();
    };
}

export function whenProjectSelectReady(navigate: () => void): (() => void) | undefined {
    const pending = pendingNavigation;
    if (pending === undefined) {
        navigate();
        return;
    }

    pending.add(navigate);

    return () => { pending.delete(navigate); };
}
