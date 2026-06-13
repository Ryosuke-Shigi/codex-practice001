/**
 * API Catalog 詳細ページ本文の表示 Component です。
 *
 * 技術行と notes panel の表示枠だけを担当し、API仕様本文の取得や保存メモ操作は別 Component / backend に委譲します。
 */
import { useState, type ReactNode } from 'react';

export type ApiCatalogDetailTechnicalRow = [label: string, value: string | null];

type ApiCatalogDetailBodyProps = {
    title: string;
    description: string | null;
    notesPanel: ReactNode;
    technicalRows: ApiCatalogDetailTechnicalRow[];
    isTechnicalCollapsible?: boolean;
    defaultTechnicalOpen?: boolean;
};

function displayValue(value: string | null) {
    return value && value.trim() !== '' ? value : 'n/a';
}

export default function ApiCatalogDetailBody({
    title,
    description,
    notesPanel,
    technicalRows,
    isTechnicalCollapsible = false,
    defaultTechnicalOpen = false,
}: ApiCatalogDetailBodyProps) {
    const [isTechnicalOpen, setIsTechnicalOpen] = useState(defaultTechnicalOpen);

    /*
     * 本文と技術情報の表示だけを担当します。
     * NotesPanel の保存可否や保存URLは呼び出し元から完成済みのReactNodeとして受け取り、
     * このComponentにはDB取得・保存判断を入れません。
     */
    const technicalRowsContent = (
        <dl className="mt-4 grid gap-2 text-sm">
            {technicalRows.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/15 bg-black/18 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/56">
                        {label}
                    </dt>
                    <dd className="mt-1 break-all font-mono text-xs leading-5 text-cyan-50/88">
                        {displayValue(value)}
                    </dd>
                </div>
            ))}
        </dl>
    );

    return (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
            <section className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                <h2 className="text-2xl font-semibold text-white">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-cyan-50/86">
                    {displayValue(description)}
                </p>

                {notesPanel}
            </section>

            <aside className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl sm:p-6">
                {isTechnicalCollapsible ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setIsTechnicalOpen((current) => !current)}
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-left text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                            aria-expanded={isTechnicalOpen}
                        >
                            <span>{isTechnicalOpen ? '技術情報を隠す' : '技術情報を表示'}</span>
                            <span aria-hidden="true">{isTechnicalOpen ? '↑' : '↓'}</span>
                        </button>

                        {isTechnicalOpen && technicalRowsContent}
                    </>
                ) : (
                    <>
                        <h2 className="text-lg font-semibold text-white">技術情報</h2>
                        {technicalRowsContent}
                    </>
                )}
            </aside>
        </div>
    );
}
