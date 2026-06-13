/**
 * DanceShortsRadar 候補カード内の統計表示 Component です。
 *
 * props の数値を表示用に整えるだけにし、snapshot 差分や sortKey の正規化は backend / Page へ委譲します。
 */
import type { DanceShortsCandidate } from './types';

type DanceShortsStatsProps = {
    candidate: DanceShortsCandidate;
    sortKey: string;
};

/*
 * 日本語画面なので、数値は ja-JP の桁区切りで統一します。
 * 標準行はいいね数 / コメント数だけに絞り、下部の主指標はサーバー側で確定した sortKey に
 * 対応する metric だけを表示します。ここでは再計算せず、受け取った props を整形するだけです。
 */
const numberFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
});
const compactNumberFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
    notation: 'compact',
});
const percentFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
    style: 'percent',
});

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

function formatCompactNumber(value: number) {
    return compactNumberFormatter.format(value);
}

function formatOptionalCompactNumber(value: number | null) {
    return value === null ? '未取得' : formatCompactNumber(value);
}

function formatOptionalMetric(value: number | null, suffix: string) {
    return value === null ? '算出不可' : `${formatNumber(value)}${suffix}`;
}

function formatPreviousViewCount(value: number | null) {
    return value === null ? '比較元なし' : `${formatNumber(value)}回`;
}

function formatViewDiff(value: number | null) {
    if (value === null) {
        return '算出不可';
    }

    return `${value >= 0 ? '+' : ''}${formatNumber(value)}回`;
}

function formatGrowthRate(value: number | null | undefined) {
    return value === null || value === undefined
        ? '算出不可'
        : percentFormatter.format(value);
}

type PrimaryMetric =
    | {
          kind: 'single';
          label: string;
          value: string;
      }
    | {
          kind: 'currentViewCount';
          currentValue: string;
          previousValue: string;
      };

function primaryMetricFor(
    candidate: DanceShortsCandidate,
    sortKey: string,
): PrimaryMetric {
    if (sortKey === 'view_growth_rate') {
        return {
            kind: 'single',
            label: '伸び率',
            value: formatGrowthRate(candidate.view_growth_rate),
        };
    }

    if (sortKey === 'views_per_hour') {
        return {
            kind: 'single',
            label: '1時間あたりの視聴増加数',
            value: formatOptionalMetric(candidate.views_per_hour, '回/時'),
        };
    }

    if (sortKey === 'current_view_count') {
        return {
            kind: 'currentViewCount',
            currentValue: `${formatNumber(candidate.view_count)}回`,
            previousValue: formatPreviousViewCount(
                candidate.previous_view_count,
            ),
        };
    }

    return {
        kind: 'single',
        label: '視聴増加数',
        value: formatViewDiff(candidate.view_diff),
    };
}

export default function DanceShortsStats({
    candidate,
    sortKey,
}: DanceShortsStatsProps) {
    const primaryMetric = primaryMetricFor(candidate, sortKey);

    return (
        <div className="grid gap-2">
            <p className="truncate text-xs font-semibold tabular-nums text-slate-700">
                いいね {formatOptionalCompactNumber(candidate.like_count)} | コメント{' '}
                {formatOptionalCompactNumber(candidate.comment_count ?? null)}
            </p>

            {primaryMetric.kind === 'single' ? (
                <dl className="rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-2.5 py-2 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                        <dt className="min-w-0 truncate font-semibold text-slate-600">
                            {primaryMetric.label}
                        </dt>
                        <dd className="shrink-0 font-bold tabular-nums text-slate-800">
                            {primaryMetric.value}
                        </dd>
                    </div>
                </dl>
            ) : (
                <dl className="rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-0.5">
                        <dt className="min-w-0 truncate font-semibold text-slate-600">
                            現在の視聴数
                        </dt>
                        <dd className="shrink-0 font-bold tabular-nums text-slate-800">
                            {primaryMetric.currentValue}
                        </dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-t border-slate-700/10 py-0.5">
                        <dt className="min-w-0 truncate font-semibold text-slate-600">
                            前回の視聴数
                        </dt>
                        <dd className="shrink-0 font-bold tabular-nums text-slate-800">
                            {primaryMetric.previousValue}
                        </dd>
                    </div>
                </dl>
            )}
        </div>
    );
}
