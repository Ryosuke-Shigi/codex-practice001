/**
 * Lab idea-board / portfolio LP の hero Component です。
 *
 * 説明用 props を表示するだけにし、各 PRODUCT 画面のデータ取得や同期処理とは接続しません。
 */
import type { ReactNode } from 'react';

import { Link } from '@inertiajs/react';

type PortfolioLpHeroMetric = {
    label: string;
    value: string;
    description: string;
};

type PortfolioLpHeroProps = {
    eyebrow: string;
    title: string;
    lead: string;
    description: string;
    status: string;
    keywords: string[];
    metrics: PortfolioLpHeroMetric[];
    children?: ReactNode;
};

/*
 * PortfolioLpHero はアイデアボード紹介ページ共通の「最初に読む領域」です。
 * ここではタイトル、短い価値説明、主要キーワード、本体機能への導線を表示するだけに限定します。
 * 本体機能の状態取得や同期開始はLPの責務ではないため、children にはリンクボタンなどの
 * 静的な表示要素だけを渡す前提です。
 */
export default function PortfolioLpHero({
    eyebrow,
    title,
    lead,
    description,
    status,
    keywords,
    metrics,
    children,
}: PortfolioLpHeroProps) {
    return (
        /*
            min-w-0 / max-w-full / overflow-wrap は、長い英語タイトルや日本語説明が
            モバイル幅で親要素を押し広げないようにするための保険です。
            LPは面接中にスマホ幅で見せる可能性があるため、横スクロールを前提にしません。
        */
        <header className="grid min-w-0 max-w-full gap-6 py-4 [overflow-wrap:anywhere] lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end">
            <div className="min-w-0">
                <nav aria-label="アイデアボードページの戻り導線">
                    <Link
                        href="/lab?category=IDEA-BOARD"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/18 bg-white/10 px-4 text-sm font-semibold text-cyan-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        アイデアボード一覧へ戻る
                    </Link>
                </nav>

                <p className="mt-8 text-xs font-semibold uppercase text-cyan-100/76">
                    {eyebrow}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md border border-emerald-100/35 bg-emerald-100/12 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                        {status}
                    </span>
                    {keywords.map((keyword) => (
                        <span
                            key={keyword}
                            className="max-w-full rounded-md border border-cyan-100/28 bg-cyan-100/10 px-2.5 py-1 text-xs font-semibold text-cyan-50"
                        >
                            {keyword}
                        </span>
                    ))}
                </div>

                <h1 className="mt-5 max-w-full break-words text-4xl font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:text-6xl">
                    {title}
                </h1>
                <p className="mt-4 max-w-4xl break-all text-lg font-semibold leading-8 text-cyan-50 sm:text-xl">
                    {lead}
                </p>
                <p className="mt-4 max-w-4xl break-all text-sm leading-7 text-slate-100/84 sm:text-base sm:leading-8">
                    {description}
                </p>

                {/*
                    children は導線ボタンなど、Hero直下に置きたい静的UIを差し込むための枠です。
                    LP共通Hero側ではリンク先の意味を知らず、ページ側のデータ定義に判断を寄せます。
                */}
                {children && <div className="mt-6">{children}</div>}
            </div>

            <aside
                aria-label="紹介ページの要点"
                className="grid min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-1"
            >
                {metrics.map((metric) => (
                    <div
                        key={metric.label}
                        className="rounded-lg border border-white/14 bg-slate-950/54 p-4 shadow-[0_18px_42px_rgba(2,6,23,0.22)] backdrop-blur-2xl"
                    >
                        <p className="text-xs font-semibold uppercase text-cyan-100/70">
                            {metric.label}
                        </p>
                        <p className="mt-2 break-words text-2xl font-semibold leading-tight text-white [overflow-wrap:anywhere]">
                            {metric.value}
                        </p>
                        <p className="mt-2 break-all text-sm leading-6 text-slate-200/78">
                            {metric.description}
                        </p>
                    </div>
                ))}
            </aside>
        </header>
    );
}
