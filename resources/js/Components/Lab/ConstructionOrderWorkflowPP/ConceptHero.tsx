/**
 * 工事発注 idea-board の hero Component です。
 *
 * 構想説明と導線表示だけを担当し、発注データの取得や保存処理は行いません。
 */
import { Link } from '@inertiajs/react';

export default function ConceptHero() {
    return (
        <header className="min-w-0 rounded-lg border border-white/20 bg-slate-950/62 p-5 shadow-[0_22px_54px_rgba(2,6,23,0.24)] backdrop-blur-2xl sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-4xl">
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-cyan-100/35 bg-cyan-100/14 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                            アイデアボード
                        </span>
                        <span className="rounded-md border border-emerald-100/30 bg-emerald-100/12 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                            仕様整理用
                        </span>
                    </div>
                    <h1 className="mt-4 break-words text-3xl font-semibold leading-tight text-white sm:text-5xl">
                        工事発注管理・請求システム 構想まとめ
                    </h1>
                    <p className="mt-4 text-base leading-8 text-slate-100/88">
                        工事案件の発注、作業、請求、領収を一元管理するための構想ページです。案件登録の入口と、登録後の管理・請求を切り離して整理します。
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-200/78">
                        FormとExcelはどちらもCSVを作成・投入する入口に限定します。CSV投入後の検知、退避、非同期登録、案件・発注・作業カード・請求・領収・履歴の管理はSystem側の構想として見せます。
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1">
                    <Link
                        href="/lab/construction-order-workflow-mock"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        MOCKを見る
                    </Link>
                    <Link
                        href="/projects/construction-order"
                        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cyan-100/40 bg-cyan-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        Project Hubへ戻る
                    </Link>
                </div>
            </div>
        </header>
    );
}
