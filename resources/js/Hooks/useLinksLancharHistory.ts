import { router, usePage } from '@inertiajs/react';
import { useSyncExternalStore } from 'react';

const historyKey = 'LinksLanchar:arrival';
const historyChangedEvent = 'links-lanchar:history-changed';

type Arrival = {
    url: string;
};

function asPath(href: string): string {
    const url = new URL(href, window.location.origin);

    return url.pathname + url.search + url.hash;
}

function isArrival(value: unknown): value is Arrival {
    return typeof value === 'object'
        && value !== null
        && 'url' in value
        && typeof value.url === 'string';
}

function currentPath(): string {
    return asPath(window.location.href);
}

function hasArrival(): boolean {
    const arrival = router.restore<unknown>(historyKey);

    return isArrival(arrival) && arrival.url === currentPath();
}

/** アプリ内で遷移してできた履歴項目に、画面内で戻れる状態を残します。 */
export function rememberLinksLancharArrival(pageUrl: string): void {
    const url = asPath(pageUrl);

    if (url !== currentPath()) {
        return;
    }

    router.remember({ url } satisfies Arrival, historyKey);
    window.dispatchEvent(new Event(historyChangedEvent));
}

/**
 * Inertiaは再読込時にrememberedStateを消すため、初期化より前に現在の項目を読みます。
 * 再読込直後の同じURLに限り、アプリ内で遷移したときの状態を復元します。
 */
export function prepareLinksLancharHistoryReload(): void {
    const navigation = performance.getEntriesByType('navigation')[0];

    if (!(navigation && 'type' in navigation && navigation.type === 'reload')
        || window.history.state === null) {
        return;
    }

    const initialUrl = currentPath();
    // createInertiaAppがsetupの前に履歴を復号します。Appの描画でrouter.initが走る前に取得します。
    const arrival = router.restore<unknown>(historyKey);
    if (!isArrival(arrival) || arrival.url !== initialUrl) {
        return;
    }

    const stop = router.on('navigate', ({ detail: { page } }) => {
        stop();
        if (asPath(page.url) === initialUrl) {
            rememberLinksLancharArrival(initialUrl);
        }
    });
}

/**
 * 同じPageの更新と履歴追加を同定し、Inertiaの遷移成功時に履歴へ保存します。
 * 初期表示や履歴復帰のnavigateだけでは、新しい遷移として扱いません。
 */
export function observeLinksLancharArrivals(
    isTargetPage: (page: { component: string; url: string }) => boolean,
): () => void {
    let candidate: { page: { component: string; url: string }; pushed: boolean } | null = null;

    const stops = [
        router.on('beforeUpdate', ({ detail: { page } }) => {
            candidate = isTargetPage(page) ? { page, pushed: false } : null;
        }),
        router.on('navigate', ({ detail: { page } }) => {
            if (candidate?.page === page) {
                candidate.pushed = true;
            }
        }),
        router.on('success', ({ detail: { page } }) => {
            if (candidate?.page !== page) {
                return;
            }

            const { pushed } = candidate;
            candidate = null;
            // navigate中に履歴へ書くとInertiaが処理中のPage参照が変わるため、成功時まで待ちます。
            if (pushed) {
                rememberLinksLancharArrival(page.url);
            }
        }),
        router.on('error', () => {
            candidate = null;
        }),
    ];

    return () => {
        candidate = null;
        stops.forEach((stop) => stop());
    };
}

function subscribe(listener: () => void): () => void {
    const stop = router.on('navigate', listener);
    window.addEventListener(historyChangedEvent, listener);

    return () => {
        stop();
        window.removeEventListener(historyChangedEvent, listener);
    };
}

export default function useLinksLancharHistory(): boolean {
    // Page更新と、遷移完了時に記録した状態の両方を反映します。
    usePage();

    return useSyncExternalStore(subscribe, hasArrival, () => false);
}
