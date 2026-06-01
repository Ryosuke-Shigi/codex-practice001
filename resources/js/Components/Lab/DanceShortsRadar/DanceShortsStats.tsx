import type { DanceShortsCandidate } from './types';

type DanceShortsStatsProps = {
    candidate: DanceShortsCandidate;
};

/*
 * 日本語画面なので、数値は ja-JP の桁区切りで統一します。
 * 単位は stats 配列の label/value で明示し、カード側が個別の数値整形を知らなくてよいようにします。
 */
const numberFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
    style: 'percent',
});

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

function formatOptionalNumber(value: number | null, suffix: string) {
    return value === null ? '未取得' : `${formatNumber(value)}${suffix}`;
}

function formatOptionalMetric(value: number | null, suffix: string) {
    return value === null ? '算出不可' : `${formatNumber(value)}${suffix}`;
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
            value: formatOptionalMetric(candidate.views_per_hour, '回/時'),
        },
        {
            label: 'いいね数',
            value: formatOptionalNumber(candidate.like_count, '件'),
        },
    ];

    if (candidate.view_growth_rate !== undefined) {
        /*
         * view_growth_rate は本データ接続で追加される任意項目です。
         * MOCK の候補にはまだ存在しないため、undefined のときは表示項目自体を増やさず、
         * 本番 Responder が値を渡した場合だけカードに出します。ここでも計算はせず、props の値を表示します。
         */
        stats.push({
            label: '伸び率',
            value:
                candidate.view_growth_rate === null
                    ? '算出不可'
                    : percentFormatter.format(candidate.view_growth_rate),
        });
    }

    if (candidate.comment_count !== undefined) {
        /*
         * comment_count も snapshot 由来の任意項目です。
         * API 側で非公開・欠損になる可能性があるため null は「未取得」として表示し、
         * 0 件と欠損を React 側で混同しないようにします。
         */
        stats.push({
            label: 'コメント数',
            value: formatOptionalNumber(candidate.comment_count, '件'),
        });
    }

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
