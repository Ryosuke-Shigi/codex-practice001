/**
 * DanceShortsRadar の通常ランキング候補カード Component です。
 *
 * ranking item props を表示し、ランキング計算や selected window の切り出しは Action / Service 側へ分けます。
 */
import type { ReactNode } from 'react';

import DanceShortsStats from './DanceShortsStats';
import DanceShortsThumbnailLink from './DanceShortsThumbnailLink';
import type { DanceShortsCandidate } from './types';

type DanceShortsCandidateCardProps = {
    candidate: DanceShortsCandidate;
    sortKey: string;
    rank: number;
    isActive: boolean;
    thumbnailControls?: {
        topRight: ReactNode;
        bottomLeft: ReactNode;
    };
    contentTransitionClassName?: string;
    contentTransitionKey?: number;
};

function formatDateTime(value: string | null | undefined) {
    return value === null || value === undefined
        ? '未設定'
        : value.replace(/-/g, '/');
}

/*
 * 候補1件分のカード表示です。
 *
 * このコンポーネントは候補の見せ方に集中し、クリック時の外部リンクは DanceShortsThumbnailLink、
 * 数値のラベルと整形は DanceShortsStats へ分けています。sortKey はカード下部の主指標を
 * 選ぶためだけに使い、候補配列の並び替えや window の切り直しには使いません。
 */
export default function DanceShortsCandidateCard({
    candidate,
    sortKey,
    rank,
    isActive,
    thumbnailControls,
    contentTransitionClassName,
    contentTransitionKey = 0,
}: DanceShortsCandidateCardProps) {
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
                key={`candidate-summary-${contentTransitionKey}`}
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
                    {candidate.region}
                </span>
            </div>

            {/*
                サムネイルクリックだけを YouTube への外部遷移にします。
                カード全体を外部リンクにしないことで、後続でメモや追跡ボタンを足しても操作領域を分けやすくします。
            */}
            <div className="grid min-w-0 gap-1">
                {thumbnailControls !== undefined && (
                    <div className="flex min-h-7 items-center justify-end pr-0.5">
                        {thumbnailControls.topRight}
                    </div>
                )}
                <DanceShortsThumbnailLink
                    title={candidate.title}
                    thumbnailUrl={candidate.thumbnail_url}
                    youtubeUrl={candidate.youtube_url}
                    className="w-full"
                />
                {thumbnailControls !== undefined && (
                    <div className="flex min-h-7 items-center justify-start pl-0.5">
                        {thumbnailControls.bottomLeft}
                    </div>
                )}
            </div>

            <div
                key={`candidate-detail-${contentTransitionKey}`}
                className={[
                    'flex min-h-0 min-w-0 flex-col gap-1 sm:gap-1.5',
                    contentClassName,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <div className="grid min-w-0 gap-1 sm:gap-1.5">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800 sm:text-base">
                        {candidate.title}
                    </h3>
                    {candidate.channel_title !== undefined && (
                        <p className="truncate text-[11px] font-semibold text-slate-600 sm:text-xs">
                            {candidate.channel_title ?? 'チャンネル名未設定'}
                        </p>
                    )}
                    <p className="text-[11px] font-semibold leading-snug text-slate-600">
                        投稿 {formatDateTime(candidate.published_at)} | 収集{' '}
                        {formatDateTime(candidate.collected_at)}
                    </p>
                </div>
                <div>
                    <DanceShortsStats candidate={candidate} sortKey={sortKey} />
                </div>
            </div>
        </article>
    );
}
