import type { DanceShortsCandidate } from './types';

type DanceShortsStatsProps = {
    candidate: DanceShortsCandidate;
};

/*
 * 日本語画面なので、数値は ja-JP の桁区切りで統一します。
 * 単位は stats 配列の label/value で明示し、カード側が個別の数値整形を知らなくてよいようにします。
 */
const numberFormatter = new Intl.NumberFormat('ja-JP');

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

export default function DanceShortsStats({ candidate }: DanceShortsStatsProps) {
    /*
     * 表示ラベルはユーザー指定の日本語ラベルに合わせています。
     * previous_view_count / view_diff / views_per_hour はモック段階では仮データで、
     * ここでは計算せず、受け取った props をそのまま表示します。
     */
    const stats = [
        {
            label: '現在の視聴数',
            value: `${formatNumber(candidate.view_count)}回`,
        },
        {
            label: '前回の視聴数',
            value: `${formatNumber(candidate.previous_view_count)}回`,
        },
        {
            label: '視聴数の増加数',
            value: `+${formatNumber(candidate.view_diff)}回`,
        },
        {
            label: '1時間あたりの視聴増加数',
            value: `${formatNumber(candidate.views_per_hour)}回/時`,
        },
        {
            label: 'いいね数',
            value: `${formatNumber(candidate.like_count)}件`,
        },
    ];

    return (
        <dl className="grid gap-0.5 text-sm">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-white/10 py-2 first:border-t-0"
                >
                    <dt className="min-w-0 text-cyan-50/68">{stat.label}</dt>
                    <dd className="shrink-0 font-semibold tabular-nums text-white">
                        {stat.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
