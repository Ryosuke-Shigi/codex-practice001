import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef } from 'react';

import type { LinksLauncherPageProps } from '@/Components/LinksLauncher/types';
import { canonicalLauncherHistoryUrl } from '@/Hooks/useLinksLauncherHistory';
import Show from '@/Pages/LinksLauncher/Show';

type SavedLauncherProps = Omit<LinksLauncherPageProps, 'linksLauncher'> & {
    readonly linksLanchar: Omit<LinksLauncherPageProps['linksLauncher'], 'linksLauncherKey'> & {
        readonly linksLancharKey: string;
    };
};

/** 改名前に保存されたInertia Pageを表示し、復帰した履歴項目だけを更新する。 */
export default function SavedLauncher() {
    const { url, props } = usePage<SavedLauncherProps>();
    const replaced = useRef<string | null>(null);
    const canonicalProps = useMemo(() => {
        const { linksLanchar, ...shared } = props;
        const { linksLancharKey, ...details } = linksLanchar;

        return { ...shared, linksLauncher: { ...details, linksLauncherKey: linksLancharKey } };
    }, [props]);

    useEffect(() => {
        const target = canonicalLauncherHistoryUrl(url);
        if (target === null || target !== canonicalLauncherHistoryUrl(window.location.href)
            || replaced.current === url) {
            return;
        }

        replaced.current = url;
        router.replace({
            component: 'LinksLauncher/Show',
            url: target,
            props: canonicalProps,
            preserveScroll: true,
            preserveState: true,
        });
    }, [url, canonicalProps]);

    return <Show {...canonicalProps} />;
}
