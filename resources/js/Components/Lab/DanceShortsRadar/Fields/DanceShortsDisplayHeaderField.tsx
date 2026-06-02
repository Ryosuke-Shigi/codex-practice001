import type { DanceShortsDisplayHeaderField as DanceShortsDisplayHeaderFieldProps } from '../types';

export default function DanceShortsDisplayHeaderField({
    displayHeaderField,
}: {
    displayHeaderField: DanceShortsDisplayHeaderFieldProps;
}) {
    /*
     * displayHeaderField は select と card の間に常時出す状態説明です。
     *
     * title / description は現在のタブが何を意味するかを示し、右側のラベル群は
     * 現在 query に対応する比較日数、カード件数、並び順を示します。
     * ここに href、active 状態、カード配列を入れないことで、操作 UI とカード表示の責務を分けます。
     */
    return (
        <section className="rounded-lg border border-white/18 bg-slate-950/36 p-4 text-white shadow-[0_16px_34px_rgba(4,25,42,0.14)] backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-cyan-100/64">
                        {displayHeaderField.selectedTabLabel}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                        {displayHeaderField.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/78">
                        {displayHeaderField.description}
                    </p>
                </div>

                <div className="grid min-w-44 gap-2 text-sm text-cyan-50/78 sm:grid-cols-3 lg:grid-cols-1">
                    <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                        {displayHeaderField.comparisonDaysLabel}
                    </span>
                    <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                        {displayHeaderField.cardCountLabel}
                    </span>
                    <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                        {displayHeaderField.sortLabel}
                    </span>
                </div>
            </div>
        </section>
    );
}
