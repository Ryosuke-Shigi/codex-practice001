import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';

import PublicLayout from '@/Layouts/PublicLayout';
import { mockApiCatalogItems, type ApiCatalogListItem } from './mockApiCatalogData';

type MockDetailProps = {
    apiKey: string;
};

function safeDecodeURIComponent(value: string) {
    try {
        return decodeURIComponent(value);
    } catch {
        // ルートパラメータが既に decode 済みでも詳細画面を落とさないための保険です。
        return value;
    }
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

function buildTechnicalRows(item: ApiCatalogListItem) {
    /*
     * 技術情報は初期表示から隠し、必要な時だけ確認する UI にします。
     * OpenAPI 本文や paths / schemas はまだ取得・表示しません。
     */
    return [
        ['apiKey', item.apiKey],
        ['providerKey', item.providerKey],
        ['serviceKey', item.serviceKey],
        ['domain', item.domain],
        ['preferredVersion', item.preferredVersion],
        ['openapiVersion', item.openapiVersion],
        ['sourceLatestUpdatedAt', item.sourceLatestUpdatedAt],
        ['googleSearchUrl', item.googleSearchUrl],
    ];
}

export default function MockDetail({ apiKey }: MockDetailProps) {
    const [memo, setMemo] = useState('');
    const [isTechnicalOpen, setIsTechnicalOpen] = useState(false);
    const item = useMemo(() => findMockApiCatalogItem(apiKey), [apiKey]);

    if (!item) {
        return (
            <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
                <Head title="API Catalog Mock Detail" />

                <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 pb-5">
                    <header className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/api-catalog/mock"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            戻る
                        </Link>
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
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

    const technicalRows = buildTechnicalRows(item);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title={`${item.title} Mock Detail`} />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 pb-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/api-catalog/mock"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            戻る
                        </Link>
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
                    </div>

                    <a
                        href={item.googleSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-bold text-cyan-50 shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                    >
                        Search
                    </a>
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
                                {item.title}
                            </h1>
                            <p className="mt-3 break-all text-sm font-semibold text-cyan-100/78">
                                {item.providerKey} / {item.serviceKey} / {item.domain}
                            </p>
                        </div>

                        <span className="w-fit rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1.5 text-xs font-semibold text-cyan-50">
                            {item.preferredVersion}
                        </span>
                    </div>
                </motion.section>

                <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                    <section className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                        <p className="mt-4 text-sm leading-7 text-cyan-50/86">{item.description}</p>

                        <div className="mt-7">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">調査メモ</h3>
                                    <p className="mt-1 text-xs font-semibold text-cyan-100/64">
                                        保存されません / モック入力です
                                    </p>
                                </div>
                                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-50/78">
                                    {memo.length} chars
                                </span>
                            </div>

                            {/*
                                メモ欄は保存処理なしの画面モックです。
                                saved_api_notes などの永続化設計は本実装時に別途決めます。
                            */}
                            <textarea
                                value={memo}
                                onChange={(event) => setMemo(event.target.value)}
                                placeholder="このAPIについての調査メモを書く"
                                className="mt-3 min-h-[180px] w-full resize-y rounded-2xl border border-white/30 bg-white/14 p-4 text-sm leading-7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] outline-none backdrop-blur-xl placeholder:text-cyan-50/50 focus:border-cyan-100/75 focus:ring-4 focus:ring-cyan-100/24"
                            />
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                        <button
                            type="button"
                            onClick={() => setIsTechnicalOpen((current) => !current)}
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-left text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                            aria-expanded={isTechnicalOpen}
                        >
                            <span>{isTechnicalOpen ? '技術情報を隠す' : '技術情報を表示'}</span>
                            <span aria-hidden="true">{isTechnicalOpen ? '↑' : '↓'}</span>
                        </button>

                        {isTechnicalOpen && (
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
                        )}
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}
