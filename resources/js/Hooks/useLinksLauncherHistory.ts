import type { Page, PendingVisit } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useSyncExternalStore } from 'react';

const historyKey = 'LinksLauncher:arrival';
const legacyHistoryKey = 'LinksLanchar:arrival';
const historyChangedEvent = 'links-launcher:history-changed';
const launcherRoute = /^\/(?:portfolio\/links-(?:lanchar|launcher)|links-(?:lanchars|launchers)\/[\da-fA-F]{8}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{12})(?=[?#]|$)/;

type Arrival = {
    url: string;
};

// remember直後はReactのPageに書き込みが反映されていない。復元値とpropsの両方で同じ書き込みを確認する。
let lastWrite: { props: Page['props']; arrival: Arrival } | undefined;

function localPath(href: string): string | null {
    const origin = window.location.origin;
    const path = href.startsWith(origin + '/') ? href.slice(origin.length) : href;

    return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : null;
}

/** 旧一覧の2経路だけ綴りを変え、履歴比較用のUUID・query・hashはそのまま残す。 */
export function canonicalLauncherHistoryUrl(href: string): string | null {
    const path = localPath(href);
    if (path === null || !launcherRoute.test(path)) {
        return null;
    }

    return path.replace(launcherRoute, (route) => route.replace('lanchar', 'launcher'));
}

function isArrival(value: unknown): value is Arrival {
    return typeof value === 'object'
        && value !== null
        && 'url' in value
        && typeof value.url === 'string';
}

function historyPath(href: string): string | null {
    return canonicalLauncherHistoryUrl(href) ?? localPath(href);
}

function rememberedMarker(key: string, page?: Page): unknown {
    if (page === undefined || (page.rememberedState === undefined && window.history.state === null)) {
        return router.restore(key);
    }
    if (key === historyKey && lastWrite && lastWrite.props === page.props
        && router.restore(key) === lastWrite.arrival) {
        return lastWrite.arrival;
    }

    // Inertia 2.3.21のrestoreは欠けたキーを初期履歴から補う。popstateでは復号済みの当該Pageだけを読む。
    return page.rememberedState?.[key];
}

function hasLegacyArrival(path: string, page?: Page): boolean {
    const arrival = rememberedMarker(legacyHistoryKey, page);
    if (!isArrival(arrival)) {
        return false;
    }

    const launcher = canonicalLauncherHistoryUrl(arrival.url);
    if (launcher !== null) {
        return launcher === path;
    }

    return localPath(arrival.url) === path && path.startsWith('/projects?')
        && new URL(path, window.location.origin).searchParams.get('view') === 'stages';
}

function hasArrival(page?: Page): boolean {
    const path = historyPath(window.location.href);
    if (path === null) {
        return false;
    }
    const arrival = rememberedMarker(historyKey, page);

    return arrival === undefined || arrival === null
        ? hasLegacyArrival(path, page)
        : isArrival(arrival) && arrival.url === path;
}

/** アプリ内で遷移してできた履歴項目に、画面内で戻れる状態を残します。 */
export function rememberLinksLauncherArrival(page: Page): void {
    const url = historyPath(page.url);

    if (url === null || url !== historyPath(window.location.href)) {
        return;
    }

    const arrival = { url };
    lastWrite = { props: page.props, arrival };
    router.remember(arrival, historyKey);
    window.dispatchEvent(new Event(historyChangedEvent));
}

/**
 * Inertiaは再読込時にrememberedStateを消すため、初期化より前に現在の項目を読みます。
 * 再読込直後の同じURLに限り、アプリ内で遷移したときの状態を復元します。
 */
export function prepareLinksLauncherHistoryReload(): void {
    const navigation = performance.getEntriesByType('navigation')[0];

    if (!(navigation && 'type' in navigation && navigation.type === 'reload')
        || window.history.state === null) {
        return;
    }

    const initialUrl = historyPath(window.location.href);
    // createInertiaAppがsetupの前に履歴を復号します。Appの描画でrouter.initが走る前に取得します。
    if (initialUrl === null || !hasArrival()) {
        return;
    }

    const stop = router.on('navigate', ({ detail: { page } }) => {
        stop();
        if (historyPath(page.url) === initialUrl) {
            rememberLinksLauncherArrival(page);
        }
    });
}

/**
 * 旧版の履歴を開くとInertiaはそのPageを表示せず、元URLをGETして同じ項目を置換する。
 * 復号した旧項目から到着印だけを読み、そのGETが現在の公開画面を取得できたときに引き継ぐ。
 */
export function observeStaleLauncherArrival(version: Page['version'], legacyShow: string, currentShow: string): () => void {
    type Refresh = {
        entry: unknown;
        source: string;
        target: string;
        marked: Promise<boolean>;
        visit?: PendingVisit;
        response?: Page;
        succeeded?: boolean;
    };
    let refresh: Refresh | undefined;
    const clear = () => { refresh = undefined; };
    const capture = () => {
        clear();
        const source = localPath(window.location.href);
        const target = canonicalLauncherHistoryUrl(window.location.href);
        if (!version || source === null || target === null || source === target || !window.history.state?.page) {
            return;
        }

        const marked = router.decryptHistory().then((saved) => {
            const marker = saved.rememberedState?.[legacyHistoryKey];
            return saved.component === legacyShow && typeof saved.url === 'string'
                && typeof saved.version === 'string' && saved.version.length > 0 && saved.version !== version
                && localPath(saved.url) === source && isArrival(marker)
                && localPath(marker.url) === source;
        }, () => false);
        refresh = { entry: window.history.state, source, target, marked };
    };

    window.addEventListener('popstate', capture);
    const stops = [
        router.on('start', ({ detail: { visit } }) => {
            if (refresh && !refresh.visit && refresh.entry === window.history.state && visit.replace
                && visit.preserveState === true && visit.preserveScroll === true
                && visit.method === 'get' && !visit.async && !visit.prefetch
                && localPath(visit.url.href) === refresh.source) {
                refresh.visit = visit;
            } else {
                clear();
            }
        }),
        router.on('beforeUpdate', ({ detail: { page } }) => {
            // HTTPのPage URLはqueryを並べ替えることがあり、fragmentも送信されない。
            if (refresh?.visit && refresh.entry === window.history.state && page.component === currentShow
                && page.version === version
                && localPath(page.url)?.split(/[?#]/, 1)[0] === refresh.target.split(/[?#]/, 1)[0]) {
                refresh.response = page;
            } else {
                clear();
            }
        }),
        router.on('success', ({ detail: { page } }) => {
            if (refresh?.response === page) {
                refresh.succeeded = true;
            }
        }),
        router.on('finish', ({ detail: { visit } }) => {
            const pending = refresh;
            if (!pending || pending.visit !== visit) {
                return;
            }
            const page = pending.response;
            if (!visit.completed || !pending.succeeded || !page) {
                clear();
                return;
            }
            const freshEntry = window.history.state;
            void pending.marked.then((marked) => {
                if (refresh !== pending) {
                    return;
                }
                if (!marked || freshEntry !== window.history.state || localPath(window.location.href) !== localPath(page.url)) {
                    clear();
                    return;
                }
                if (localPath(page.url) === pending.target) {
                    clear();
                    rememberLinksLauncherArrival(page);
                    return;
                }

                // 最新のpropsを保持し、同じ履歴項目のURLだけを元のquery・fragmentへ戻す。
                router.replace({
                    url: pending.target,
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: (updated) => {
                        if (refresh === pending && updated.component === currentShow && updated.version === version
                            && updated.props === page.props && localPath(updated.url) === pending.target) {
                            rememberLinksLauncherArrival(updated);
                        }
                    },
                    onFinish: () => {
                        if (refresh === pending) clear();
                    },
                });
            });
        }),
        router.on('navigate', clear), // 置換GETはnavigateを発行しない。他の履歴へ移れば引き継がない。
        router.on('error', clear),
        router.on('invalid', clear),
        router.on('exception', clear),
    ];

    return () => {
        clear();
        window.removeEventListener('popstate', capture);
        stops.forEach((stop) => stop());
    };
}

/**
 * 同じPageの更新と履歴追加を同定し、Inertiaの遷移成功時に履歴へ保存します。
 * 初期表示や履歴復帰のnavigateだけでは、新しい遷移として扱いません。
 */
export function observeLinksLauncherArrivals(
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
                rememberLinksLauncherArrival(page);
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

export default function useLinksLauncherHistory(): boolean {
    const page = usePage();
    const canGoBack = useSyncExternalStore(subscribe, () => hasArrival(page), () => false);

    useEffect(() => {
        // 旧Pageのreplaceより先にrememberすると、Inertiaが旧URLを履歴へ書き戻す。
        const url = historyPath(window.location.href);
        if (canGoBack && url !== null && localPath(page.url) === url
            && rememberedMarker(historyKey, page) == null && hasLegacyArrival(url, page)) {
            rememberLinksLauncherArrival(page);
        }
    }, [page, canGoBack]);

    return canGoBack;
}
