/**
 * API Preview 一覧の Inertia Page Component です。
 *
 * Action / Responder から渡された preview 対象を表示し、本体機能の同期や保存処理は呼び出しません。
 */
import { Head, Link } from '@inertiajs/react';

import PublicLayout from '@/Layouts/PublicLayout';

type ApiPreviewTarget = {
    id: string;
    name: string;
    summary: string;
    endpoint: string;
    method: string;
    href: string;
    links: ApiPreviewLink[];
    status: string;
    enabled: boolean;
    open_in_new_window: boolean;
};

type ApiPreviewLink = {
    label: string;
    href: string;
    style: 'primary' | 'secondary' | 'danger';
};

type IndexProps = {
    apis: ApiPreviewTarget[];
};

function statusClassName(status: string) {
    // Ready と Planned の見分けだけをここで閉じ込め、カード側の JSX を軽くします。
    return status === 'Ready'
        ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50'
        : 'border-amber-300/50 bg-amber-300/15 text-amber-50';
}

function statusLabel(status: string) {
    return status === 'Ready' ? '利用可' : '準備中';
}

function linkClassName(style: ApiPreviewLink['style']) {
    // 実取得、成功モック、エラーモックの導線を色で区別します。
    if (style === 'danger') {
        return 'border border-rose-200/30 bg-rose-200/10 text-rose-50 hover:bg-rose-200/16 focus-visible:ring-rose-100';
    }

    if (style === 'secondary') {
        return 'border border-white/20 bg-white/10 text-white hover:bg-white/16 focus-visible:ring-cyan-200';
    }

    return 'bg-cyan-200 text-slate-950 hover:bg-cyan-100 focus-visible:ring-cyan-100';
}

export default function Index({ apis }: IndexProps) {
    return (
        <PublicLayout className="bg-slate-950/55 px-4 py-6 sm:px-6 lg:px-8">
            <Head title="API確認" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 py-4">
                <header className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                            開発確認
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            API確認
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                            外部APIの疎通、応答データ、ヘッダー、クエリ、エラー応答を本体実装前に確認するための画面です。
                        </p>
                    </div>

                    <Link
                        href="/projects/api-discovery-hub"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                        Hubへ戻る
                    </Link>
                </header>

                {/*
                    API Discovery Hub 本体画面のモック入口枠です。
                    一覧、詳細などの画面モックを API Preview の疎通確認カードとは分けて並べます。
                */}
                <section className="rounded-lg border border-cyan-100/25 bg-cyan-100/8 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                                API Discovery Hub モック
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-white">
                                本体画面モック
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/80">
                                DB 接続前に、本体側の画面単位で UI と操作感を確認するための入口です。
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Link
                            href="/api-catalog/mock"
                            className="group flex min-h-[130px] flex-col justify-between rounded-lg border border-cyan-100/30 bg-slate-950/60 p-4 transition hover:border-cyan-100/60 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                        >
                            <div>
                                <span className="inline-flex rounded-md border border-emerald-300/45 bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                                    利用可
                                </span>
                                <h3 className="mt-3 text-lg font-semibold text-white">
                                    一覧表示
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-200/80">
                                    API カード、検索、provider/domain 絞り込み、ページ送りを確認します。
                                </p>
                            </div>
                            <span className="mt-4 text-sm font-bold text-cyan-100 transition group-hover:text-white">
                                モックを開く
                            </span>
                        </Link>

                        {/*
                            詳細画面モックはまず代表データの stripe.com を開きます。
                            本実装では一覧から選んだ apiKey を使って詳細へ遷移する想定です。
                        */}
                        <Link
                            href="/api-catalog/mock/stripe.com"
                            className="group flex min-h-[130px] flex-col justify-between rounded-lg border border-cyan-100/30 bg-slate-950/60 p-4 transition hover:border-cyan-100/60 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                        >
                            <div>
                                <span className="inline-flex rounded-md border border-emerald-300/45 bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                                    利用可
                                </span>
                                <h3 className="mt-3 text-lg font-semibold text-white">
                                    詳細画面
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-200/80">
                                    API タイトル、説明、メモ入力欄、技術情報の開閉表示を確認します。
                                </p>
                            </div>
                            <span className="mt-4 text-sm font-bold text-cyan-100 transition group-hover:text-white">
                                モックを開く
                            </span>
                        </Link>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {apis.map((api) => (
                        <article
                            key={api.id}
                            className="flex min-h-[220px] flex-col justify-between rounded-lg border border-white/15 bg-slate-950/70 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.22)]"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(api.status)}`}>
                                        {statusLabel(api.status)}
                                    </span>
                                    <span className="rounded-md border border-sky-200/30 bg-sky-200/10 px-2.5 py-1 font-mono text-xs text-sky-50">
                                        {api.method}
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-white">{api.name}</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-200/80">{api.summary}</p>
                                </div>

                                <p className="break-all rounded-md border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs leading-5 text-cyan-50/90">
                                    {api.endpoint}
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col gap-2">
                                {api.enabled ? (
                                    /*
                                        links がある API は複数導線を表示します。
                                        ない場合は将来追加 API 用の単一リンクとして扱います。
                                    */
                                    (api.links.length > 0 ? api.links : [
                                        {
                                            label: '確認画面を開く',
                                            href: api.href,
                                            style: 'primary' as const,
                                        },
                                    ]).map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            target={api.open_in_new_window ? '_blank' : undefined}
                                            rel={api.open_in_new_window ? 'noopener noreferrer' : undefined}
                                            className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 ${linkClassName(link.style)}`}
                                        >
                                            {link.label}
                                        </a>
                                    ))
                                ) : (
                                    <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-slate-300">
                                        追加予定
                                    </span>
                                )}
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </PublicLayout>
    );
}
