import type { DanceShortsRegion, DanceShortsRegionCode } from './types';

type RegionTabsProps = {
    regions: DanceShortsRegion[];
    selectedRegion: DanceShortsRegionCode;
    onSelectRegion: (region: DanceShortsRegionCode) => void;
};

/*
 * JP / US / KR の地域タブだけを担当する表示コンポーネントです。
 *
 * regions は画面側から props として受け取り、このコンポーネントでは候補データを知りません。
 * タブが候補一覧やモックデータの構造を直接参照しないようにすることで、将来地域が増えたり
 * region 定義の取得元が変わっても、タブの責務を「選択中の地域を親へ通知すること」に保てます。
 */
export default function RegionTabs({
    regions,
    selectedRegion,
    onSelectRegion,
}: RegionTabsProps) {
    return (
        <div
            role="tablist"
            aria-label="地域"
            className="grid grid-cols-3 gap-2 rounded-lg border border-white/24 bg-slate-950/38 p-1.5 shadow-[0_14px_30px_rgba(2,24,45,0.18)] backdrop-blur-xl"
        >
            {regions.map((region) => {
                const isSelected = region.code === selectedRegion;

                return (
                    /*
                     * role="tab" と aria-controls を付け、対応する一覧パネルとの関係を明示します。
                     * 画面上は通常のボタン操作ですが、タブ UI として読み上げやすい構造にしています。
                     */
                    <button
                        key={region.code}
                        id={`dance-shorts-tab-${region.code}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`dance-shorts-panel-${region.code}`}
                        onClick={() => onSelectRegion(region.code)}
                        className={[
                            'min-h-11 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40',
                            isSelected
                                ? 'bg-white text-slate-950 shadow-[0_10px_22px_rgba(255,255,255,0.2)]'
                                : 'text-cyan-50/82 hover:bg-white/12 hover:text-white',
                        ].join(' ')}
                    >
                        {region.label}
                    </button>
                );
            })}
        </div>
    );
}
