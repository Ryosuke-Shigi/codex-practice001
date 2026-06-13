/**
 * DanceShortsRadar 本画面の補助メッセージ Field Component です。
 *
 * displayHeaderField 由来の文言を表示し、ランキング条件や sort option の生成は扱いません。
 */
import type { DanceShortsDisplayHeaderField as DanceShortsDisplayMessageFieldProps } from '../types';

export default function DanceShortsDisplayMessageField({
    displayMessageField,
    showSortKeyOptions,
}: {
    displayMessageField: DanceShortsDisplayMessageFieldProps;
    showSortKeyOptions: boolean;
}) {
    /*
     * MessageField は表示結果への短い補足だけを担当します。
     * 3行目は現在条件を薄く横並びで出し、件数のようなカード側の情報は出しません。
     */
    return (
        <section className="rounded-lg border border-slate-700/[0.08] bg-white/[0.015] px-2.5 py-1.5 text-slate-800 shadow-[0_8px_18px_rgba(80,105,140,0.035)] backdrop-blur-[3px]">
            <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                {displayMessageField.title}
            </p>
            <p className="line-clamp-1 text-[11px] font-semibold text-slate-600 sm:text-xs">
                {displayMessageField.description}
            </p>
            <div
                className={[
                    'mt-1 grid min-w-0 gap-1 text-[10px] font-bold text-slate-600 sm:text-[11px]',
                    showSortKeyOptions ? 'grid-cols-3' : 'grid-cols-2',
                ].join(' ')}
            >
                <span className="truncate rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-center">
                    {displayMessageField.selectedTabLabel}
                </span>
                <span className="truncate rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-center">
                    {displayMessageField.comparisonDaysLabel}
                </span>
                {showSortKeyOptions && (
                    <span className="truncate rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-center">
                        {displayMessageField.sortLabel}
                    </span>
                )}
            </div>
        </section>
    );
}
