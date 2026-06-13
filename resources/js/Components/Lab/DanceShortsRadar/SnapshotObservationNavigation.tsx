/**
 * DanceShortsRadar MOCK の snapshot 観測一覧ナビゲーション Component です。
 *
 * 初回観測/最新観測の表示切替だけを担当し、ランキングタブや本体 reload 条件とは分けます。
 */
import type { DanceShortsSnapshotObservationKind } from './types';

type SnapshotObservationNavigationProps = {
    activeView: DanceShortsSnapshotObservationKind | null;
    onOpenFirstObservation: () => void;
    onOpenLatestObservation: () => void;
};

const snapshotObservationActions = [
    {
        kind: 'first',
        label: '初回観測一覧',
        description:
            'previous snapshot が無い動画を、比較元なしの一覧として確認します。',
    },
    {
        kind: 'latest',
        label: '最新観測一覧',
        description:
            '最新 snapshot を持つ動画の現在状態を、比較ランキングとは別に確認します。',
    },
] satisfies Array<{
    kind: DanceShortsSnapshotObservationKind;
    label: string;
    description: string;
}>;

/*
 * snapshot 一覧系へ移動するための MOCK 専用ボタン群です。
 *
 * 通常ランキングや上昇候補タブとは別枠の入口として置き、ボタン操作を親 Page へ通知するだけに留めます。
 * ここではデータ取得、ランキング判定、snapshot 比較は行いません。
 *
 * このコンポーネントを RegionTabs に統合しないのは意図的です。
 * RegionTabs は「ランキング候補を見る切り口」を選ぶ UI で、こちらは「snapshot 一覧系の画面へ移動する」
 * UI です。見た目が近いからといって同じ tablist に入れると、初回観測一覧までランキングの一種に見えてしまいます。
 * そのため、ボタンの文言・説明・active 表示をこのコンポーネント内に閉じ、親 Page には
 * first/latest の表示モードだけを返します。
 */
export default function SnapshotObservationNavigation({
    activeView,
    onOpenFirstObservation,
    onOpenLatestObservation,
}: SnapshotObservationNavigationProps) {
    const handlers = {
        first: onOpenFirstObservation,
        latest: onOpenLatestObservation,
    } satisfies Record<DanceShortsSnapshotObservationKind, () => void>;

    return (
        <section className="grid gap-4 rounded-lg border border-white/22 bg-slate-950/36 p-4 text-white shadow-[0_14px_30px_rgba(2,24,45,0.16)] backdrop-blur-xl lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/62">
                    Snapshot Lists
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                    観測一覧
                </h2>
                <p className="mt-2 text-sm leading-7 text-cyan-50/80">
                    初回観測一覧と最新観測一覧は、通常ランキングとは別の MOCK 画面として確認します。
                </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {snapshotObservationActions.map((action) => {
                    const isActive = action.kind === activeView;

                    return (
                        <button
                            key={action.kind}
                            type="button"
                            aria-pressed={isActive}
                            onClick={handlers[action.kind]}
                            className={[
                                'min-h-16 rounded-md border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40',
                                isActive
                                    ? 'border-white bg-white text-slate-950 shadow-[0_12px_24px_rgba(255,255,255,0.18)]'
                                    : 'border-white/18 bg-white/8 text-cyan-50 hover:bg-white/14',
                            ].join(' ')}
                        >
                            <span className="block text-sm font-bold">
                                {action.label}
                            </span>
                            <span
                                className={[
                                    'mt-1 block text-xs leading-5',
                                    isActive
                                        ? 'text-slate-700'
                                        : 'text-cyan-50/68',
                                ].join(' ')}
                            >
                                {action.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
