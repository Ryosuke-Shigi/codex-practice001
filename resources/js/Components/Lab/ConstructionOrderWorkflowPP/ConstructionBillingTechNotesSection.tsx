/**
 * 工事発注 idea-board の技術候補・注意事項 section Component です。
 *
 * 候補技術と構想上の注意事項を表示するだけで、本番設定や実処理には接続しません。
 */
import {
    conceptNotes,
    techStackCards,
} from './constructionBillingPresentationData';

export default function ConstructionBillingTechNotesSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Stack / Notes
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                技術スタック候補
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                CSV検知、非同期登録、案件・請求管理を検討するうえで候補になる技術を、構想上の素材として並べます。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {techStackCards.map((card) => (
                    <article
                        key={card.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                    >
                        <h3 className="text-base font-semibold">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/78">
                            {card.detail}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-5 rounded-lg border border-cyan-100/28 bg-cyan-100/10 p-4">
                <h3 className="text-base font-semibold text-cyan-50">保留・注意事項</h3>
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {conceptNotes.map((note) => (
                        <article
                            key={note.title}
                            className="rounded-lg border border-white/12 bg-slate-950/30 p-3 text-cyan-50"
                        >
                            <p className="font-semibold">{note.title}</p>
                            <p className="mt-2 text-sm leading-6 opacity-85">
                                {note.detail}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
