import { router, usePage } from '@inertiajs/react';
import { AxiosHeaders } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import useLinksLauncherHistory, {
    canonicalLauncherHistoryUrl,
    rememberLinksLauncherArrival,
} from '@/Hooks/useLinksLauncherHistory';

import type { LinksLauncherPageProps } from './types';

const visitHeader = 'X-Links-Launcher-Visit';
let visitSequence = 0;

function requestUrl(href: string): string | null {
    try {
        const url = new URL(href, window.location.origin);
        url.hash = '';

        return url.href;
    } catch {
        return null;
    }
}

type Selection = {
    launcherKey: string;
    serverKey: string | null;
    linkKey: string;
};

export default function useLinksLauncherNavigation({
    linksLauncher,
    selectedLinkKey,
    linkList: { links },
}: LinksLauncherPageProps) {
    const { url: pageUrl } = usePage();
    const canGoBack = useLinksLauncherHistory();
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const navigating = useRef(false);
    const stopInvalidListener = useRef<(() => void) | null>(null);
    const clearInvalidListener = useCallback(() => {
        stopInvalidListener.current?.();
        stopInvalidListener.current = null;
    }, []);

    useEffect(() => clearInvalidListener, [clearInvalidListener]);

    const launcherKey = linksLauncher.linksLauncherKey;
    const requestedKey = selection?.launcherKey === launcherKey
        && selection.serverKey === selectedLinkKey
        ? selection.linkKey
        : selectedLinkKey;
    const selectedIndex = Math.max(0, links.findIndex((link) => link.linkKey === requestedKey));
    const selected = links[selectedIndex] ?? null;
    const canSwitch = links.length > 1;

    const select = useCallback((offset: -1 | 1) => {
        if (!canSwitch || navigating.current) {
            return;
        }

        const next = links[(selectedIndex + offset + links.length) % links.length];
        const url = new URL(canonicalLauncherHistoryUrl(pageUrl) ?? pageUrl, window.location.origin);
        url.searchParams.set('selectedLinkKey', next.linkKey);
        const href = url.pathname + url.search + url.hash;

        setSelection({ launcherKey, serverKey: selectedLinkKey, linkKey: next.linkKey });
        router.replace({
            url: href,
            props: (currentProps) => ({ ...currentProps, selectedLinkKey: next.linkKey }),
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (canGoBack) {
                    rememberLinksLauncherArrival(page);
                }
            },
        });
    }, [canGoBack, canSwitch, launcherKey, links, pageUrl, selectedIndex, selectedLinkKey]);

    const openSelected = useCallback(() => {
        if (!selected?.destinationUrl || navigating.current) {
            return;
        }

        const destination = selected.destinationUrl;
        const target = new URL(destination, window.location.origin);
        if (target.origin !== window.location.origin) {
            window.location.assign(destination);
            return;
        }

        const visitId = String(++visitSequence);
        const destinationRequestUrl = requestUrl(destination);

        const finish = () => {
            clearInvalidListener();
            navigating.current = false;
            setIsNavigating(false);
        };

        navigating.current = true;
        setIsNavigating(true);
        router.visit(destination, {
            headers: { [visitHeader]: visitId },
            onStart: () => {
                // Inertiaは通常のHTMLをモーダルにするため、自分のGETに限って通常遷移へ切り替えます。
                stopInvalidListener.current = router.on('invalid', (event) => {
                    const { config, status, headers } = event.detail.response;
                    if (event.defaultPrevented
                        || config.headers.get(visitHeader) !== visitId
                        || config.method?.toLowerCase() !== 'get'
                        || config.url === undefined
                        || requestUrl(config.url) !== destinationRequestUrl
                        || status < 200
                        || status >= 300) {
                        return;
                    }

                    const contentType = headers instanceof AxiosHeaders
                        ? headers.get('Content-Type')
                        : headers['content-type'] ?? headers['Content-Type'];
                    if (typeof contentType !== 'string'
                        || contentType.split(';', 1)[0].trim().toLowerCase() !== 'text/html') {
                        return;
                    }

                    event.preventDefault();
                    clearInvalidListener();
                    window.location.assign(destination);
                });
            },
            onCancel: finish,
            onFinish: finish,
        });
    }, [clearInvalidListener, selected]);

    return {
        canGoBack,
        canSwitch,
        isNavigating,
        openSelected,
        select,
        selected,
        previous: canSwitch ? links[(selectedIndex - 1 + links.length) % links.length] : null,
        next: canSwitch ? links[(selectedIndex + 1) % links.length] : null,
    };
}
