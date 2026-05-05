import { Link } from '@inertiajs/react';

import SearchButtons from './SearchButtons';

export type ApiCatalogDetailSearchTarget = {
    title: string;
    providerKey: string;
    description: string;
    apiKey: string;
};

type ApiCatalogDetailHeaderProps = {
    modeLabel: 'Live' | 'Mock';
    returnUrl: string;
    returnComment: string;
    searchTarget: ApiCatalogDetailSearchTarget;
};

export default function ApiCatalogDetailHeader({
    modeLabel,
    returnUrl,
    returnComment,
    searchTarget,
}: ApiCatalogDetailHeaderProps) {
    /*
     * 本番詳細とモック詳細のヘッダー操作を共通化します。
     * 違いは Live/Mock の表示ラベルと returnUrl の入力値だけにし、SearchButtons も同じComponentを使います。
     * このComponent自身は履歴を参照せず、呼び出し元が明示した returnUrl へだけ遷移します。
     */
    return (
        <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                    {modeLabel}
                </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
                <SearchButtons
                    title={searchTarget.title}
                    providerKey={searchTarget.providerKey}
                    description={searchTarget.description}
                    apiKey={searchTarget.apiKey}
                />
                <Link
                    href={returnUrl}
                    title={returnComment}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                >
                    一覧へ戻る
                </Link>
            </div>
        </header>
    );
}
