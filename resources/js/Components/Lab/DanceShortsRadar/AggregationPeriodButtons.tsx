/**
 * DanceShortsRadar MOCK の集計期間ボタン Component です。
 *
 * 画面内の表示切替だけを担当し、本体ランキングの comparisonDays query とは別の UI state として扱います。
 */
import type { DanceShortsAggregationPeriod } from './types';

type AggregationPeriodButtonsProps = {
    periods: readonly DanceShortsAggregationPeriod[];
    selectedPeriod: DanceShortsAggregationPeriod;
    onSelectPeriod: (period: DanceShortsAggregationPeriod) => void;
};

/*
 * 集計期間の選択 UI だけを担当します。
 *
 * ここでは active 表示とクリック通知だけを扱い、期間ごとの集計計算やデータ取得は行いません。
 * 期間の意味は将来の view_count_delta / view_growth_rate / ランキング再計算に使う想定ですが、
 * このコンポーネントはその計算条件を知りません。親から渡された候補値を横並びのボタンとして
 * 表示し、選ばれた値を親へ返すだけに留めることで、UI と集計ロジックの境界を保ちます。
 */
export default function AggregationPeriodButtons({
    periods,
    selectedPeriod,
    onSelectPeriod,
}: AggregationPeriodButtonsProps) {
    return (
        <section className="rounded-lg border border-white/22 bg-slate-950/36 p-3 text-white shadow-[0_14px_30px_rgba(2,24,45,0.16)] backdrop-blur-xl">
            <div
                role="group"
                aria-label="集計期間"
                className="grid grid-cols-5 gap-1.5 sm:gap-2"
            >
                {periods.map((period) => {
                    /*
                     * active 判定は受け取った selectedPeriod との一致だけで行います。
                     * ここで「7日を初期値にする」などの画面状態を持たせると、
                     * Page が持つ state と二重管理になるため、ボタン側は完全に controlled component として扱います。
                     */
                    const isSelected = period === selectedPeriod;

                    return (
                        <button
                            key={period}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onSelectPeriod(period)}
                            className={[
                                'min-h-10 rounded-md px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40 sm:text-sm',
                                isSelected
                                    ? 'bg-white text-slate-950 shadow-[0_10px_22px_rgba(255,255,255,0.2)]'
                                    : 'border border-white/18 bg-white/8 text-cyan-50/82 hover:bg-white/14 hover:text-white',
                            ].join(' ')}
                        >
                            {period}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
