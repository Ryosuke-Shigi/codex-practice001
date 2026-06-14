/**
 * 工事発注 idea-board の基本概念カード Component です。
 *
 * 説明用カードを表示するだけにし、実装済み Form / Action / Service の責務とは接続しません。
 */
import { overviewCards } from './constructionBillingPresentationData';

export default function BasicConceptCards() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Concept
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                概要
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">
                CSVを境界にして、案件登録の入口と、登録後の作業・請求・領収管理を分けて説明します。
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {overviewCards.map((card) => (
                    <article
                        key={card.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                    >
                        <h3 className="font-semibold">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/78">
                            {card.detail}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
