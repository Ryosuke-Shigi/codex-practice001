import { Link } from '@inertiajs/react';

type MockHeaderProps = {
    currentStatus: string;
};

export default function MockHeader({ currentStatus }: MockHeaderProps) {
    return (
        <header className="rounded-lg border border-white/15 bg-slate-950/70 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.24)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-cyan-100/35 bg-cyan-100/14 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                            見た目モック
                        </span>
                        <span className="rounded-md border border-white/15 bg-white/8 px-2.5 py-1 font-mono text-xs text-slate-200">
                            発注番号 CO-2026-0516-008
                        </span>
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                        工事発注管理・請求システム
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/80">
                        Excel、CSV取込、Laravel側の保存処理、S3画像保存、請求書出力までの全体像を、非エンジニアにも伝わる画面確認用として並べています。
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
                    <div className="rounded-lg border border-emerald-100/55 bg-emerald-200/18 p-4 shadow-[0_14px_30px_rgba(16,185,129,0.16)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/78">
                            現在ステータス
                        </p>
                        <p className="mt-2 text-xl font-bold text-emerald-50">
                            {currentStatus}
                        </p>
                    </div>
                    <Link
                        href="/lab"
                        className="inline-flex min-h-[68px] items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        Lab 一覧へ
                    </Link>
                </div>
            </div>
        </header>
    );
}
