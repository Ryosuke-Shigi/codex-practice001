import { Head, Link } from '@inertiajs/react';

import PublicLayout from '@/Layouts/PublicLayout';

type QuakeWavePreviewMock = {
    id: string;
    title: string;
    summary: string;
    status: string;
    href: string;
};

type IndexProps = {
    mocks: QuakeWavePreviewMock[];
};

function statusClassName(status: string) {
    return status === 'Ready'
        ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50'
        : 'border-amber-300/50 bg-amber-300/15 text-amber-50';
}

export default function Index({ mocks }: IndexProps) {
    /*
     * QuakeWave Preview は API Preview と同じく「本実装前の確認入口」です。
     * 今回は MAP 表示だけが実際に開けるモックなので、route props から対象を拾い、
     * OBENTO 構造のいちばん大きい区画に配置します。
     */
    const mapMock = mocks.find((mock) => mock.id === 'map-display') ?? mocks[0];

    return (
        <PublicLayout effect="none" className="bg-slate-950/55 px-4 py-6 sm:px-6 lg:px-8">
            <Head title="QuakeWave Preview" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 py-4">
                <header className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                            Development Tool
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            QuakeWave Preview
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                            地震波可視化 UI を、本実装・API 接続・DB 保存に入る前に画面単位で確認するための入口です。
                        </p>
                    </div>

                    <Link
                        href="/lab"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                        Lab
                    </Link>
                </header>

                {/*
                    OBENTO 構造は「主役の大きい区画」と「将来追加する小区画」を
                    先に見せるための入口レイアウトです。Planned の区画はまだ画面遷移を
                    持たせず、ピン、波紋、詳細パネル、凡例の責務だけを予告します。
                */}
                <section className="grid grid-cols-1 gap-3 md:grid-cols-6 xl:grid-cols-12">
                    {mapMock && (
                        <Link
                            href={mapMock.href}
                            className="group flex min-h-[300px] flex-col justify-between rounded-lg border border-cyan-100/35 bg-cyan-100/10 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)] transition hover:border-cyan-100/70 hover:bg-cyan-100/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 md:col-span-6 xl:col-span-7 xl:row-span-2"
                        >
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(mapMock.status)}`}>
                                        {mapMock.status}
                                    </span>
                                    <span className="rounded-md border border-cyan-100/30 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                                        Primary
                                    </span>
                                </div>
                                <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                                    {mapMock.title}
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/85">
                                    {mapMock.summary}
                                </p>
                            </div>
                            <span className="mt-8 text-sm font-bold text-cyan-100 transition group-hover:text-white">
                                モックを開く
                            </span>
                        </Link>
                    )}

                    <article className="flex min-h-[144px] flex-col justify-between rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-3 xl:col-span-5">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                Planned
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                ピン表示
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            Laravel 側 DTO から渡す pins を地図上へ重ねる予定です。
                        </p>
                    </article>

                    <article className="flex min-h-[144px] flex-col justify-between rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-3 xl:col-span-5">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                Planned
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                波紋レイヤー
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            震源や強度に応じたアニメーションを重ねる区画です。
                        </p>
                    </article>

                    <article className="flex min-h-[160px] flex-col justify-between rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-2 xl:col-span-4">
                        <div>
                            <span className="inline-flex rounded-md border border-sky-200/35 bg-sky-200/10 px-2.5 py-1 text-xs font-semibold text-sky-50">
                                Props
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                pins
                            </h3>
                        </div>
                        <p className="mt-4 font-mono text-xs leading-5 text-cyan-50/80">
                            EarthquakeMapPin[]
                        </p>
                    </article>

                    <article className="flex min-h-[160px] flex-col justify-between rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-2 xl:col-span-4">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                Planned
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                詳細パネル
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            地震イベント選択後の表示領域として残します。
                        </p>
                    </article>

                    <article className="flex min-h-[160px] flex-col justify-between rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-2 xl:col-span-4">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                Planned
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                凡例
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            色、震度、マグニチュードの読み取り補助を置く予定です。
                        </p>
                    </article>
                </section>
            </div>
        </PublicLayout>
    );
}
