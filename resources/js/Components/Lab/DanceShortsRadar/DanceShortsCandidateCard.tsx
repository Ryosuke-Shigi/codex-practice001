import DanceShortsStats from './DanceShortsStats';
import DanceShortsThumbnailLink from './DanceShortsThumbnailLink';
import type { DanceShortsCandidate } from './types';

type DanceShortsCandidateCardProps = {
    candidate: DanceShortsCandidate;
    sortKey: string;
    rank: number;
    isActive: boolean;
};

function formatDateTime(value: string | null | undefined) {
    return value === null || value === undefined
        ? '未設定'
        : value.replaceAll('-', '/');
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
}: DanceShortsCandidateCardProps) {
    return (
        <article
            aria-current={isActive ? 'true' : undefined}
            className={[
                'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-1.5 overflow-hidden rounded-lg border p-2 text-white shadow-[0_14px_28px_rgba(2,24,45,0.16)] backdrop-blur-xl sm:grid-cols-[minmax(12rem,42%)_minmax(0,1fr)] sm:grid-rows-[auto_minmax(0,1fr)] sm:gap-2 sm:p-2.5',
                isActive
                    ? 'border-cyan-200/72 bg-slate-900/72 shadow-[0_16px_34px_rgba(34,211,238,0.16)]'
                    : 'border-white/18 bg-slate-950/44',
            ].join(' ')}
        >
            <div className="flex min-w-0 items-center justify-between gap-2 sm:col-span-2">
                <span className="rounded-md border border-cyan-100/26 bg-cyan-100/12 px-2 py-0.5 text-xs font-black tabular-nums text-cyan-50">
                    #{rank}
                </span>
                <span className="truncate rounded-md border border-white/18 bg-white/8 px-2 py-0.5 text-[11px] font-bold text-cyan-50/78">
                    {candidate.region}
                </span>
            </div>

            {/*
                サムネイルクリックだけを YouTube への外部遷移にします。
                カード全体を外部リンクにしないことで、後続でメモや追跡ボタンを足しても操作領域を分けやすくします。
            */}
            <div className="grid min-h-0 min-w-0 content-center sm:row-start-2 sm:h-full">
                <DanceShortsThumbnailLink
                    title={candidate.title}
                    thumbnailUrl={candidate.thumbnail_url}
                    youtubeUrl={candidate.youtube_url}
                    className="h-full"
                    mediaClassName="h-full min-h-0"
                />
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-1 sm:row-start-2 sm:gap-1.5">
                <div className="grid min-w-0 gap-1 sm:gap-1.5">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-base">
                        {candidate.title}
                    </h3>
                    {candidate.channel_title !== undefined && (
                        <p className="truncate text-[11px] font-semibold text-cyan-50/68 sm:text-xs">
                            {candidate.channel_title ?? 'チャンネル名未設定'}
                        </p>
                    )}
                    <p className="text-[11px] font-semibold leading-snug text-cyan-50/62">
                        投稿 {formatDateTime(candidate.published_at)} | 収集{' '}
                        {formatDateTime(candidate.collected_at)}
                    </p>
                </div>
                <div className="mt-auto">
                    <DanceShortsStats candidate={candidate} sortKey={sortKey} />
                </div>
            </div>
        </article>
    );
}
