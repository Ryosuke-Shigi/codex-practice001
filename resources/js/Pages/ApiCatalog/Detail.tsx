import { Head } from '@inertiajs/react';

import ApiCatalogDetailHeader from '@/Components/ApiCatalog/ApiCatalogDetailHeader';
import ApiCatalogDetailHero from '@/Components/ApiCatalog/ApiCatalogDetailHero';
import ApiCatalogNotesPanel from '@/Components/ApiCatalog/ApiCatalogNotesPanel';
import { extractProviderDomain } from '@/Components/ApiCatalog/apiCatalogDomain';
import PublicLayout from '@/Layouts/PublicLayout';

type ApiCatalogDetailItem = {
    id: number;
    apiKey: string;
    title: string;
    description: string;
    providerKey: string;
    serviceKey: string | null;
    preferredVersion: string | null;
    openapiVersion: string | null;
    openapiJsonUrl: string | null;
    openapiYamlUrl: string | null;
    sourceLatestUpdatedAt: string | null;
    isActive: boolean;
};

type DetailProps = {
    apiCatalogItem: ApiCatalogDetailItem;
    returnUrl: string;
};

function displayValue(value: string | null) {
    return value && value.trim() !== '' ? value : 'n/a';
}

function buildTechnicalRows(item: ApiCatalogDetailItem, domain: string) {
    /*
     * 詳細画面では同期キャッシュのメタ情報だけを確認できるようにします。
     * OpenAPI 定義本文や paths / schemas の取得は別導線の責務なので、ここでは表示しません。
     */
    return [
        ['apiKey', item.apiKey],
        ['providerKey', item.providerKey],
        ['serviceKey', displayValue(item.serviceKey)],
        ['domain', displayValue(domain)],
        ['preferredVersion', displayValue(item.preferredVersion)],
        ['openapiVersion', displayValue(item.openapiVersion)],
        ['openapiJsonUrl', displayValue(item.openapiJsonUrl)],
        ['openapiYamlUrl', displayValue(item.openapiYamlUrl)],
        ['sourceLatestUpdatedAt', displayValue(item.sourceLatestUpdatedAt)],
    ];
}

export default function Detail({ apiCatalogItem, returnUrl }: DetailProps) {
    /*
     * 本番DBに domain カラムは追加しません。
     * 詳細表示でも一覧と同じ provider_key 抽出ルールを使い、表示差分を入力データ側で吸収します。
     */
    const domain = extractProviderDomain(apiCatalogItem.providerKey);
    const technicalRows = buildTechnicalRows(apiCatalogItem, domain);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${apiCatalogItem.title} Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <ApiCatalogDetailHeader
                    modeLabel="Live"
                    returnUrl={returnUrl}
                    returnComment="returnUrl は Controller 側で本番一覧 URL に限定済みです。"
                    searchTarget={apiCatalogItem}
                />

                <ApiCatalogDetailHero
                    title={apiCatalogItem.title}
                    providerKey={apiCatalogItem.providerKey}
                    serviceKey={apiCatalogItem.serviceKey}
                    domain={domain}
                    preferredVersion={apiCatalogItem.preferredVersion}
                />

                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                    <section className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <h2 className="text-2xl font-semibold text-white">{apiCatalogItem.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-cyan-50/86">
                            {displayValue(apiCatalogItem.description)}
                        </p>

                        <ApiCatalogNotesPanel />
                    </section>

                    <aside className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <h2 className="text-lg font-semibold text-white">技術情報</h2>
                        <dl className="mt-4 grid gap-2 text-sm">
                            {technicalRows.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-white/15 bg-black/18 p-3"
                                >
                                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/56">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 break-all font-mono text-xs leading-5 text-cyan-50/88">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
