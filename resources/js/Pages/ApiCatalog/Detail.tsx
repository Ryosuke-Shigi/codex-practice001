import { Head, Link } from '@inertiajs/react';
import { motion } from 'motion/react';

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
    googleSearchUrl: string;
};

type DetailProps = {
    apiCatalogItem: ApiCatalogDetailItem;
    returnUrl: string;
};

function displayValue(value: string | null) {
    return value && value.trim() !== '' ? value : 'n/a';
}

function buildTechnicalRows(item: ApiCatalogDetailItem) {
    /*
     * 詳細画面では同期キャッシュのメタ情報だけを確認できるようにします。
     * OpenAPI 定義本文や paths / schemas の取得は別導線の責務なので、ここでは表示しません。
     */
    return [
        ['apiKey', item.apiKey],
        ['providerKey', item.providerKey],
        ['serviceKey', displayValue(item.serviceKey)],
        ['preferredVersion', displayValue(item.preferredVersion)],
        ['openapiVersion', displayValue(item.openapiVersion)],
        ['openapiJsonUrl', displayValue(item.openapiJsonUrl)],
        ['openapiYamlUrl', displayValue(item.openapiYamlUrl)],
        ['sourceLatestUpdatedAt', displayValue(item.sourceLatestUpdatedAt)],
    ];
}

export default function Detail({ apiCatalogItem, returnUrl }: DetailProps) {
    const technicalRows = buildTechnicalRows(apiCatalogItem);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${apiCatalogItem.title} Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Live
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <a
                            href={apiCatalogItem.googleSearchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-bold text-cyan-50 shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                        >
                            Search
                        </a>
                        <Link
                            href={returnUrl}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            {/* returnUrl は Controller 側で本番一覧 URL に限定済みです。 */}
                            一覧へ戻る
                        </Link>
                    </div>
                </header>

                <motion.section
                    className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_22px_48px_rgba(2,24,45,0.24)] backdrop-blur-2xl sm:p-6"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, ease: 'easeOut' }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/72">
                        API Discovery Hub
                    </p>
                    <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-3xl font-semibold text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.34)] sm:text-5xl">
                                {apiCatalogItem.title}
                            </h1>
                            <p className="mt-3 break-all text-sm font-semibold text-cyan-100/78">
                                {apiCatalogItem.providerKey} / {displayValue(apiCatalogItem.serviceKey)}
                            </p>
                        </div>

                        <span className="w-fit rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1.5 text-xs font-semibold text-cyan-50">
                            {displayValue(apiCatalogItem.preferredVersion)}
                        </span>
                    </div>
                </motion.section>

                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                    <section className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <h2 className="text-2xl font-semibold text-white">{apiCatalogItem.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-cyan-50/86">
                            {displayValue(apiCatalogItem.description)}
                        </p>
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
