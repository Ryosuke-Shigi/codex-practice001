/**
 * API Discovery Hub モック詳細の Page Component です。
 *
 * モック一覧からの戻り導線と詳細UIを確認するためのページで、本番保存メモ CRUD には接続しません。
 */
import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';

import ApiCatalogDetailBody, {
    type ApiCatalogDetailTechnicalRow,
} from '@/Components/ApiCatalog/ApiCatalogDetailBody';
import ApiCatalogDetailHeader from '@/Components/ApiCatalog/ApiCatalogDetailHeader';
import ApiCatalogDetailHero from '@/Components/ApiCatalog/ApiCatalogDetailHero';
import ApiCatalogNotesPanel from '@/Components/ApiCatalog/ApiCatalogNotesPanel';
import { extractProviderDomain } from '@/Components/ApiCatalog/apiCatalogDomain';
import PublicLayout from '@/Layouts/PublicLayout';
import { mockApiCatalogItems, type ApiCatalogListItem } from './mockApiCatalogData';

/*
 * モック詳細の戻るボタンで許可する唯一のルート境界です。
 * Preview から確認する画面ですが、戻り先は Preview 画面そのものではなくモック一覧に閉じます。
 */
const API_CATALOG_MOCK_LIST_URL = '/api-catalog/mock';

type MockDetailProps = {
    apiKey: string;
    returnUrl: string;
};

function safeDecodeURIComponent(value: string) {
    try {
        return decodeURIComponent(value);
    } catch {
        // ルートパラメータが既に decode 済みでも詳細画面を落とさないための保険です。
        return value;
    }
}

function normalizeMockCatalogListReturnUrl(value: string) {
    /*
     * モック詳細は表示確認用の一覧へだけ戻します。
     * 本番一覧や履歴由来のURLを受けても、共通ヘッダーには渡しません。
     * 本番側と同じ共通ヘッダーを使うため、呼び出し元で境界を明示します。
     */
    if (
        value === API_CATALOG_MOCK_LIST_URL ||
        value.startsWith(`${API_CATALOG_MOCK_LIST_URL}?`)
    ) {
        return value;
    }

    return API_CATALOG_MOCK_LIST_URL;
}

function findMockApiCatalogItem(apiKey: string) {
    const decodedApiKey = safeDecodeURIComponent(apiKey);

    /*
     * 本実装では apiKey を Query Action へ渡して Repository から取得します。
     * 今回は React 側モックデータだけで詳細表示を確認するため、固定配列から検索します。
     */
    return mockApiCatalogItems.find(
        (item) => item.apiKey === apiKey || item.apiKey === decodedApiKey,
    );
}

function buildTechnicalRows(
    item: ApiCatalogListItem,
    domain: string,
): ApiCatalogDetailTechnicalRow[] {
    /*
     * 技術情報は初期表示から隠し、必要な時だけ確認する UI にします。
     * OpenAPI 本文や paths / schemas は別導線の責務なので、ここでは表示しません。
     */
    return [
        ['apiKey', item.apiKey],
        ['providerKey', item.providerKey],
        ['serviceKey', item.serviceKey],
        ['domain', domain],
        ['preferredVersion', item.preferredVersion],
        ['openapiVersion', item.openapiVersion],
        ['sourceLatestUpdatedAt', item.sourceLatestUpdatedAt],
    ];
}

export default function MockDetail({ apiKey, returnUrl }: MockDetailProps) {
    const mockReturnUrl = normalizeMockCatalogListReturnUrl(returnUrl);
    const item = useMemo(() => findMockApiCatalogItem(apiKey), [apiKey]);

    if (!item) {
        return (
            <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
                <Head title="API Catalog Mock Detail" />

                <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 pb-5">
                    <header className="flex flex-wrap items-center justify-end gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
                        <Link
                            href={mockReturnUrl}
                            aria-label="APIモック一覧へ戻る"
                            title="APIモック一覧へ戻る"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            {/* returnUrl は route 側でモック一覧 URL に限定済みです。 */}
                            戻る
                        </Link>
                    </header>

                    <section className="rounded-2xl border border-white/35 bg-slate-950/38 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_22px_44px_rgba(2,24,45,0.24)] backdrop-blur-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                            API Discovery Hub
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold text-white">APIが見つかりません</h1>
                        <p className="mt-4 break-all text-sm leading-7 text-cyan-50/84">
                            指定された apiKey はモックデータに存在しません: {safeDecodeURIComponent(apiKey)}
                        </p>
                    </section>
                </div>
            </PublicLayout>
        );
    }

    /*
     * モック詳細も本番と同じ domain 抽出ルールに寄せます。
     * モック固定データのカテゴリ値は入力データとして残しますが、表示UIの責務には混ぜません。
     */
    const domain = extractProviderDomain(item.providerKey);
    const technicalRows = buildTechnicalRows(item, domain);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${item.title} Mock Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <ApiCatalogDetailHeader
                    modeLabel="Mock"
                    returnUrl={mockReturnUrl}
                    returnAccessibleLabel="APIモック一覧へ戻る"
                    searchTarget={item}
                />

                <ApiCatalogDetailHero
                    title={item.title}
                    providerKey={item.providerKey}
                    serviceKey={item.serviceKey}
                    domain={domain}
                    preferredVersion={item.preferredVersion}
                />

                <ApiCatalogDetailBody
                    title={item.title}
                    description={item.description}
                    technicalRows={technicalRows}
                    notesPanel={
                        <ApiCatalogNotesPanel notes={item.savedNotes} isPersistable={false} />
                    }
                    isTechnicalCollapsible={true}
                    defaultTechnicalOpen={false}
                />
            </div>
        </PublicLayout>
    );
}
