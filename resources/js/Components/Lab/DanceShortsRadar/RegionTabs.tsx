import { router } from '@inertiajs/react';

import type { DanceShortsTab, DanceShortsTabCode } from './types';

type RegionTabsProps = {
    tabs: Array<DanceShortsTab & { href?: string }>;
    selectedTab: DanceShortsTabCode;
    onSelectTab?: (tab: DanceShortsTabCode) => void;
};

/*
 * 上昇候補 / まとめ / 日本 / アメリカ / 韓国 のタブ UI だけを担当する表示コンポーネントです。
 *
 * tabs は画面側から props として受け取り、このコンポーネントでは候補データを知りません。
 * タブが候補一覧やモックデータの構造を直接参照しないようにすることで、将来タブが増えたり
 * 定義の取得元が変わっても、タブの責務を「選択中のタブを親へ通知すること」に保てます。
 */
export default function RegionTabs({
    tabs,
    selectedTab,
    onSelectTab,
}: RegionTabsProps) {
    /*
     * 指定順の5タブを横一列で見せます。
     * 各タブの高さを揃え、タブ文字が折り返して周辺レイアウトが動かないようにします。
     */
    return (
        <div
            role="tablist"
            aria-label="表示カテゴリ"
            style={{
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
            }}
            className="grid gap-1 rounded-lg border border-white/24 bg-slate-950/38 p-1 shadow-[0_14px_30px_rgba(2,24,45,0.18)] backdrop-blur-xl sm:gap-2 sm:p-1.5"
        >
            {tabs.map((tab) => {
                const isSelected = tab.code === selectedTab;
                const className = [
                    'min-h-11 whitespace-nowrap rounded-md px-1 text-[11px] font-bold leading-tight transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40 sm:px-3 sm:text-sm',
                    isSelected
                        ? 'bg-white text-slate-950 shadow-[0_10px_22px_rgba(255,255,255,0.2)]'
                        : 'text-cyan-50/82 hover:bg-white/12 hover:text-white',
                ].join(' ');

                if (tab.href !== undefined) {
                    /*
                     * 本番画面では router.get() で region query を変え、サーバー側 Query / Responder から
                     * 再取得した props を受け直します。MOCK と同じタブの見た目を使いながら、
                     * 本番側では React state だけで DB 由来データを切り替えないようにしています。
                     *
                     * href は Responder が生成した URL だけを使います。ここで URLSearchParams を組み立て始めると、
                     * Laravel 側の query validation と React 側の query 生成が二重管理になりやすいためです。
                     */
                    return (
                        <button
                            key={tab.code}
                            id={`dance-shorts-tab-${tab.code}`}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            aria-controls={`dance-shorts-panel-${tab.code}`}
                            onClick={() =>
                                router.get(
                                    tab.href ?? '',
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                            className={`inline-flex items-center justify-center ${className}`}
                        >
                            {tab.label}
                        </button>
                    );
                }

                return (
                    /*
                     * role="tab" と aria-controls を付け、対応する一覧パネルとの関係を明示します。
                     * 画面上は通常のボタン操作ですが、タブ UI として読み上げやすい構造にしています。
                     * href がない場合は MOCK 画面のローカル状態切り替えとして使います。
                     * 本番用の URL 再取得と MOCK 用の状態切り替えを同じ分岐に押し込めず、
                     * props の有無で責務を分けています。
                     */
                    <button
                        key={tab.code}
                        id={`dance-shorts-tab-${tab.code}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`dance-shorts-panel-${tab.code}`}
                        onClick={() => onSelectTab?.(tab.code)}
                        className={className}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
