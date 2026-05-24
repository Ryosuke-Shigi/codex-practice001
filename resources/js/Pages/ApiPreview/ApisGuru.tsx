import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import PublicLayout from '@/Layouts/PublicLayout';

type ApiInfo = {
    name: string;
    endpoint: string;
    method: string;
};

type PreviewValue = string | number | boolean | null;
type PreviewMap = Record<string, PreviewValue>;

type ApisGuruItem = {
    api_key: string;
    title: string | null;
    description: string | null;
    provider_key: string;
    service_key: string | null;
    preferred_version: string | null;
    openapi_json_url: string | null;
    openapi_yaml_url: string | null;
    openapi_version: string | null;
};

type ApisGuruResult = {
    api_name: string;
    endpoint: string;
    method: string;
    success: boolean;
    status_code: number | null;
    fetched_at: string | null;
    total_count: number | null;
    response_time_ms: number | null;
    error_message: string | null;
    request_headers: PreviewMap;
    query_parameters: PreviewMap;
    items: ApisGuruItem[] | null;
    raw_payload_preview: string;
};

type ApisGuruProps = {
    api: ApiInfo;
    canFetch?: boolean;
    hasFetched: boolean;
    result: ApisGuruResult | null;
};

function displayValue(value: PreviewValue | undefined) {
    // null や空文字をそのまま出さず、確認画面で未設定だと分かる表示にします。
    if (value === null || value === undefined || value === '') {
        return '未設定';
    }

    return String(value);
}

function formatFetchedAt(value: string | null | undefined) {
    // mock の固定日時と実 API の ISO 文字列のどちらも受け取れるようにします。
    if (!value) {
        return '未取得';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('ja-JP', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    }).format(date);
}

function formatNumber(value: number | null) {
    // mock-error では total_count が null になるため、数値表示をここで吸収します。
    return value === null ? '未設定' : value.toLocaleString();
}

function formatResponseTime(value: number | null) {
    // 通信前やエラー確認用の null 表示をメトリクスカード側へ漏らさないための整形です。
    return value === null ? '未設定' : `${value} ms`;
}

function KeyValueTable({ values }: { values: PreviewMap }) {
    // headers と query parameters の両方で使う小さな key-value 表です。
    const entries = Object.entries(values);

    if (entries.length === 0) {
        return <p className="text-sm text-slate-300">なし</p>;
    }

    return (
        <dl className="grid grid-cols-1 gap-2 text-sm">
            {entries.map(([key, value]) => (
                <div key={key} className="grid gap-1 rounded-md border border-white/10 bg-black/18 p-3 sm:grid-cols-[180px_1fr]">
                    <dt className="font-mono text-xs uppercase text-slate-400">{key}</dt>
                    <dd className="break-all font-mono text-slate-100">{displayValue(value)}</dd>
                </div>
            ))}
        </dl>
    );
}

export default function ApisGuru({ api, canFetch = true, hasFetched, result }: ApisGuruProps) {
    const [isLoading, setIsLoading] = useState(false);
    // mock-error では items が null になるため、表示側では空配列として扱います。
    const previewItems = result?.items ?? [];

    const fetchList = () => {
        // 実 API 確認画面だけが fetch=1 で再訪問し、サーバー側 Repository を呼びます。
        router.get(
            '/api-preview/apis-guru',
            { fetch: '1' },
            {
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <PublicLayout className="bg-slate-950/60 px-4 py-6 sm:px-6 lg:px-8">
            <Head title="APIs.guru Preview" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 py-4">
                <header className="flex flex-col gap-4 border-b border-white/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                            API Preview
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            {api.name}
                        </h1>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-md border border-sky-200/30 bg-sky-200/10 px-2.5 py-1 font-mono text-sky-50">
                                {api.method}
                            </span>
                            <span className="break-all rounded-md border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-cyan-50/90">
                                {api.endpoint}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/*
                            API Catalog 本体の一覧 UI を DB 接続前に確認するためのモック導線です。
                            APIs.guru の疎通 preview と混ぜず、別画面へのリンクとして置きます。
                        */}
                        <Link
                            href="/api-catalog/mock"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                        >
                            API一覧モック
                        </Link>

                        <Link
                            href="/api-preview"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                        >
                            一覧
                        </Link>
                        {canFetch ? (
                            <button
                                type="button"
                                onClick={fetchList}
                                disabled={isLoading}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-200 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-wait disabled:bg-slate-400"
                            >
                                {isLoading ? '取得中' : 'list.json を取得'}
                            </button>
                        ) : (
                            // mock 画面では外部 API を叩かないことが分かるよう固定データ表示にします。
                            <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 bg-white/8 px-4 text-sm font-semibold text-slate-200">
                                固定データ表示
                            </span>
                        )}
                    </div>
                </header>

                {!hasFetched || !result ? (
                    <section className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                        <h2 className="text-lg font-semibold text-white">未取得</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            取得ボタンを実行すると、APIs.guru の list.json を preview 用 Repository から取得して表示します。
                        </p>
                    </section>
                ) : (
                    <>
                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">success</p>
                                <p className={result.success ? 'mt-2 text-2xl font-semibold text-emerald-200' : 'mt-2 text-2xl font-semibold text-rose-200'}>
                                    {String(result.success)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">status_code</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{displayValue(result.status_code)}</p>
                            </div>
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">total_count</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(result.total_count)}</p>
                            </div>
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">response_time</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{formatResponseTime(result.response_time_ms)}</p>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                                <h2 className="text-lg font-semibold text-white">Request</h2>
                                <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
                                    <div className="grid gap-1 rounded-md border border-white/10 bg-black/18 p-3 sm:grid-cols-[140px_1fr]">
                                        <dt className="font-mono text-xs uppercase text-slate-400">endpoint</dt>
                                        <dd className="break-all font-mono text-slate-100">{result.endpoint}</dd>
                                    </div>
                                    <div className="grid gap-1 rounded-md border border-white/10 bg-black/18 p-3 sm:grid-cols-[140px_1fr]">
                                        <dt className="font-mono text-xs uppercase text-slate-400">method</dt>
                                        <dd className="font-mono text-slate-100">{result.method}</dd>
                                    </div>
                                    <div className="grid gap-1 rounded-md border border-white/10 bg-black/18 p-3 sm:grid-cols-[140px_1fr]">
                                        <dt className="font-mono text-xs uppercase text-slate-400">fetched_at</dt>
                                        <dd className="text-slate-100">{formatFetchedAt(result.fetched_at)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                                <h2 className="text-lg font-semibold text-white">Error</h2>
                                {result.error_message ? (
                                    <p className="mt-4 rounded-md border border-rose-300/30 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
                                        {result.error_message}
                                    </p>
                                ) : (
                                    <p className="mt-4 rounded-md border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">
                                        なし
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                                <h2 className="text-lg font-semibold text-white">Request Headers</h2>
                                <div className="mt-4">
                                    <KeyValueTable values={result.request_headers} />
                                </div>
                            </div>
                            <div className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                                <h2 className="text-lg font-semibold text-white">Query Parameters</h2>
                                <div className="mt-4">
                                    <KeyValueTable values={result.query_parameters} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Response Preview</h2>
                                    <p className="mt-1 text-sm text-slate-300">先頭10件</p>
                                </div>
                                <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-xs text-slate-200">
                                    {previewItems.length} / {formatNumber(result.total_count)}
                                </span>
                            </div>

                            {previewItems.length > 0 ? (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-white/15 text-xs uppercase tracking-[0.12em] text-slate-400">
                                                <th className="py-3 pr-4">api_key</th>
                                                <th className="py-3 pr-4">title</th>
                                                <th className="py-3 pr-4">provider_key</th>
                                                <th className="py-3 pr-4">service_key</th>
                                                <th className="py-3 pr-4">preferred_version</th>
                                                <th className="py-3 pr-4">openapi_version</th>
                                                <th className="py-3 pr-4">openapi_json_url</th>
                                                <th className="py-3">openapi_yaml_url</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewItems.map((item) => (
                                                <tr key={item.api_key} className="border-b border-white/10 align-top text-slate-100">
                                                    <td className="max-w-[180px] break-all py-3 pr-4 font-mono text-xs text-cyan-100">
                                                        {item.api_key}
                                                    </td>
                                                    <td className="max-w-[220px] py-3 pr-4">
                                                        <p className="font-semibold text-white">{displayValue(item.title)}</p>
                                                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-300">
                                                            {displayValue(item.description)}
                                                        </p>
                                                    </td>
                                                    <td className="max-w-[160px] break-all py-3 pr-4 font-mono text-xs">
                                                        {item.provider_key}
                                                    </td>
                                                    <td className="max-w-[160px] break-all py-3 pr-4 font-mono text-xs">
                                                        {displayValue(item.service_key)}
                                                    </td>
                                                    <td className="max-w-[150px] break-all py-3 pr-4 font-mono text-xs">
                                                        {displayValue(item.preferred_version)}
                                                    </td>
                                                    <td className="max-w-[150px] break-all py-3 pr-4 font-mono text-xs">
                                                        {displayValue(item.openapi_version)}
                                                    </td>
                                                    <td className="max-w-[220px] break-all py-3 pr-4 font-mono text-xs">
                                                        {displayValue(item.openapi_json_url)}
                                                    </td>
                                                    <td className="max-w-[220px] break-all py-3 font-mono text-xs">
                                                        {displayValue(item.openapi_yaml_url)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="mt-4 rounded-md border border-white/10 bg-black/18 p-3 text-sm text-slate-300">
                                    レスポンス概要なし
                                </p>
                            )}
                        </section>

                        <section className="rounded-lg border border-white/15 bg-slate-950/70 p-5">
                            <h2 className="text-lg font-semibold text-white">Raw Payload Preview</h2>
                            <pre className="mt-4 max-h-[520px] overflow-auto rounded-md border border-white/10 bg-black/35 p-4 text-xs leading-5 text-slate-100">
                                {result.raw_payload_preview}
                            </pre>
                        </section>
                    </>
                )}
            </div>
        </PublicLayout>
    );
}
