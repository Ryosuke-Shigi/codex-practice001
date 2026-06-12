import type { ReactNode } from 'react';

import DanceShortsThumbnailLink from './DanceShortsThumbnailLink';
import type { DanceShortsRegionCode } from './types';

type DanceShortsRisingCandidateCardProps = {
    title: string;
    publishedAt: string | null | undefined;
    sourceRegion: DanceShortsRegionCode;
    sourceRegionLabel: string;
    sourceCollectedAt: string | null | undefined;
    japanStatus: string;
    viewCountDelta: number;
    viewGrowthRate: number | null;
    japanViewCountDelta: number | null;
    thumbnailUrl: string | null;
    youtubeUrl: string | null;
    tags: string[];
    observationNote: string;
    rank: number;
    isActive: boolean;
    thumbnailControls?: {
        topRight: ReactNode;
        bottomLeft: ReactNode;
    };
    contentTransitionClassName?: string;
    contentTransitionKey?: number;
};

const numberFormatter = new Intl.NumberFormat('ja-JP');
const percentFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
    style: 'percent',
});

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

function formatGrowthRate(value: number | null) {
    return value === null ? '算出不可' : percentFormatter.format(value);
}

function formatJapanViewCountDelta(value: number | null) {
    return value === null ? '未観測' : `+${formatNumber(value)}回`;
}

function formatDateTime(value: string | null | undefined) {
    return value === null || value === undefined
        ? '未設定'
        : value.replace(/-/g, '/');
}

/*
 * 上昇候補1件分のカード表示です。
 *
 * カードは受け取った props を表示するだけにし、上昇候補判定、期間判定、データ取得は持ちません。
 * 既存の DanceShortsCandidateCard は地域別ランキングの候補を表示するためのカードなので、
 * 上昇候補用には sourceRegion、japanStatus、viewGrowthRate などの意味が伝わる props を別に受けます。
 * これにより「地域別ランキング」と「海外先行の観測候補」を同じ型へ無理に押し込まずに済みます。
 */
export default function DanceShortsRisingCandidateCard({
    title,
    publishedAt,
    sourceRegion,
    sourceRegionLabel,
    sourceCollectedAt,
    japanStatus,
    viewCountDelta,
    viewGrowthRate,
    japanViewCountDelta,
    thumbnailUrl,
    youtubeUrl,
    tags,
    observationNote,
    rank,
    isActive,
    thumbnailControls,
    contentTransitionClassName,
    contentTransitionKey = 0,
}: DanceShortsRisingCandidateCardProps) {
    const contentClassName = [contentTransitionClassName]
        .filter(Boolean)
        .join(' ');

    return (
        <article
            aria-current={isActive ? 'true' : undefined}
            className={[
                'flex max-h-full min-h-0 flex-col gap-1.5 overflow-hidden rounded-lg border p-2 text-slate-800 shadow-[0_14px_28px_rgba(80,105,140,0.08)] backdrop-blur-[3px] sm:gap-2 sm:p-2.5',
                isActive
                    ? 'border-sky-400/[0.28] bg-white/[0.012] shadow-[0_16px_34px_rgba(56,189,248,0.05)]'
                    : 'border-slate-700/[0.08] bg-white/[0.01]',
            ].join(' ')}
        >
            <div
                key={`rising-summary-${contentTransitionKey}`}
                className={[
                    'flex min-w-0 items-center justify-between gap-2',
                    contentClassName,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sky-700/[0.16] bg-sky-100/[0.38] text-xs font-black tabular-nums text-slate-800">
                    {rank}
                </span>
                <span className="truncate rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {sourceRegionLabel} / {sourceRegion}
                </span>
            </div>

            {/*
                サムネイルリンクは既存カードと同じ専用コンポーネントを使います。
                外部リンクの target / rel の扱いを一箇所へ寄せ、上昇候補カード側ではリンク安全設定を持ちません。
            */}
            <div className="grid min-w-0 gap-1">
                {thumbnailControls !== undefined && (
                    <div className="flex min-h-7 items-center justify-end pr-0.5">
                        {thumbnailControls.topRight}
                    </div>
                )}
                <DanceShortsThumbnailLink
                    title={title}
                    thumbnailUrl={thumbnailUrl}
                    youtubeUrl={youtubeUrl}
                    className="w-full"
                />
                {thumbnailControls !== undefined && (
                    <div className="flex min-h-7 items-center justify-start pl-0.5">
                        {thumbnailControls.bottomLeft}
                    </div>
                )}
            </div>

            <div
                key={`rising-detail-${contentTransitionKey}`}
                className={[
                    'flex min-h-0 min-w-0 flex-col gap-1 sm:gap-1.5',
                    contentClassName,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <div className="grid min-w-0 gap-1 sm:gap-1.5">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800 sm:text-base">
                        {title}
                    </h3>
                    <p className="text-[11px] font-semibold leading-snug text-slate-600">
                        投稿 {formatDateTime(publishedAt)} | 収集{' '}
                        {formatDateTime(sourceCollectedAt)}
                    </p>

                    <p className="line-clamp-2 rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs leading-snug text-slate-600">
                        {observationNote}
                    </p>
                </div>

                {/*
                    viewCountDelta / viewGrowthRate は Service / Responder から受け取った値です。
                    React 側で再計算せず、null は 0 に変換しないことで「算出不可」を保ちます。
                */}
                <div className="grid gap-1 sm:gap-1.5">
                    <dl className="grid gap-0.5 rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-0.5">
                            <dt className="min-w-0 truncate font-semibold text-slate-600">
                                海外側の視聴増加数
                            </dt>
                            <dd className="shrink-0 font-bold tabular-nums text-slate-800">
                                +{formatNumber(viewCountDelta)}回
                            </dd>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-t border-slate-700/10 py-0.5">
                            <dt className="min-w-0 truncate font-semibold text-slate-600">
                                海外側の増加率
                            </dt>
                            <dd className="shrink-0 font-bold tabular-nums text-slate-800">
                                {formatGrowthRate(viewGrowthRate)}
                            </dd>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-t border-slate-700/10 py-0.5">
                            <dt className="min-w-0 truncate font-semibold text-slate-600">
                                日本側
                            </dt>
                            <dd className="min-w-0 truncate text-right font-bold tabular-nums text-slate-800">
                                {japanStatus} /{' '}
                                {formatJapanViewCountDelta(japanViewCountDelta)}
                            </dd>
                        </div>
                    </dl>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-md border border-slate-700/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] font-bold text-slate-700"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
