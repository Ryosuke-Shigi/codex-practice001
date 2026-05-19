import { Link } from '@inertiajs/react';

export default function ConceptHero() {
    return (
        <header className="min-w-0 rounded-lg border border-white/20 bg-slate-950/62 p-5 shadow-[0_22px_54px_rgba(2,6,23,0.24)] backdrop-blur-2xl sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-4xl">
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-cyan-100/35 bg-cyan-100/14 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                            PP
                        </span>
                        <span className="rounded-md border border-emerald-100/30 bg-emerald-100/12 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                            構想説明用
                        </span>
                    </div>
                    <h1 className="mt-4 break-words text-3xl font-semibold leading-tight text-white sm:text-5xl">
                        工事発注管理・請求システム 構想まとめ
                    </h1>
                    <p className="mt-4 text-base leading-8 text-slate-100/88">
                        このシステムは、工事、発注、請求の状態を分けて管理し、必要な確認資料はExcelで出力できるようにする構想ページです。
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-200/78">
                        Formは入力と操作、Excelは確認・出力・既存業務との接続、Systemは状態管理と業務ルールを担当します。Excel運用を残しながら、判断の本体はシステム側に寄せる見せ方にしています。
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1">
                    <Link
                        href="/lab/construction-order-workflow-mock"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        操作モックを見る
                    </Link>
                    <Link
                        href="/lab"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cyan-100/40 bg-cyan-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        Lab 一覧へ
                    </Link>
                </div>
            </div>
        </header>
    );
}
