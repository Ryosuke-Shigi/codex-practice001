import type { DanceShortsDisplayHeaderField as DanceShortsDisplayMessageFieldProps } from '../types';

export default function DanceShortsDisplayMessageField({
    displayMessageField,
}: {
    displayMessageField: DanceShortsDisplayMessageFieldProps;
}) {
    /*
     * MessageField は表示結果への短い補足だけを担当します。
     * 3行目は現在条件を薄く横並びで出し、Header の題字とは重複させません。
     */
    return (
        <section className="rounded-lg border border-white/16 bg-slate-950/28 px-2.5 py-1.5 text-white shadow-[0_8px_18px_rgba(4,25,42,0.1)] backdrop-blur-xl">
            <p className="truncate text-xs font-bold text-cyan-50 sm:text-sm">
                {displayMessageField.title}
            </p>
            <p className="line-clamp-1 text-[11px] font-semibold text-cyan-50/72 sm:text-xs">
                {displayMessageField.description}
            </p>
            <div className="mt-1 grid min-w-0 grid-cols-4 gap-1 text-[10px] font-bold text-cyan-50/72 sm:text-[11px]">
                <span className="truncate rounded-md border border-white/14 bg-white/8 px-1.5 py-0.5 text-center">
                    {displayMessageField.selectedTabLabel}
                </span>
                <span className="truncate rounded-md border border-white/14 bg-white/8 px-1.5 py-0.5 text-center">
                    {displayMessageField.comparisonDaysLabel}
                </span>
                <span className="truncate rounded-md border border-white/14 bg-white/8 px-1.5 py-0.5 text-center">
                    {displayMessageField.sortLabel}
                </span>
                <span className="truncate rounded-md border border-white/14 bg-white/8 px-1.5 py-0.5 text-center">
                    {displayMessageField.cardCountLabel}
                </span>
            </div>
        </section>
    );
}
