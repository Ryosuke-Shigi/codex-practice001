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
        : value.replaceAll('-', '/');
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
}: DanceShortsRisingCandidateCardProps) {
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
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cyan-100/30 bg-cyan-100/12 text-xs font-black tabular-nums text-cyan-50">
                    {rank}
                </span>
                <span className="truncate rounded-md border border-white/18 bg-white/8 px-2 py-0.5 text-[11px] font-bold text-cyan-50/78">
                    {sourceRegionLabel} / {sourceRegion}
                </span>
            </div>

            {/*
                サムネイルリンクは既存カードと同じ専用コンポーネントを使います。
                外部リンクの target / rel の扱いを一箇所へ寄せ、上昇候補カード側ではリンク安全設定を持ちません。
            */}
            <div className="grid min-h-0 min-w-0 content-center sm:row-start-2 sm:h-full">
                <DanceShortsThumbnailLink
                    title={title}
                    thumbnailUrl={thumbnailUrl}
                    youtubeUrl={youtubeUrl}
                    className="h-full"
                    mediaClassName="h-full min-h-0"
                />
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-1 sm:row-start-2 sm:gap-1.5">
                <div className="grid min-w-0 gap-1 sm:gap-1.5">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-base">
                        {title}
                    </h3>
                    <p className="text-[11px] font-semibold leading-snug text-cyan-50/62">
                        投稿 {formatDateTime(publishedAt)} | 収集{' '}
                        {formatDateTime(sourceCollectedAt)}
                    </p>

                    <p className="line-clamp-2 rounded-md border border-cyan-100/18 bg-cyan-100/10 px-2.5 py-1.5 text-xs leading-snug text-cyan-50/82">
                        {observationNote}
                    </p>
                </div>

                {/*
                    viewCountDelta / viewGrowthRate は Service / Responder から受け取った値です。
                    React 側で再計算せず、null は 0 に変換しないことで「算出不可」を保ちます。
                */}
                <div className="mt-auto grid gap-1 sm:gap-1.5">
                    <dl className="grid gap-0.5 rounded-md border border-cyan-100/18 bg-cyan-100/10 px-2.5 py-1.5 text-xs">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-0.5">
                            <dt className="min-w-0 truncate font-semibold text-cyan-50/72">
                                海外側の視聴増加数
                            </dt>
                            <dd className="shrink-0 font-bold tabular-nums text-white">
                                +{formatNumber(viewCountDelta)}回
                            </dd>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-t border-white/10 py-0.5">
                            <dt className="min-w-0 truncate font-semibold text-cyan-50/72">
                                海外側の増加率
                            </dt>
                            <dd className="shrink-0 font-bold tabular-nums text-white">
                                {formatGrowthRate(viewGrowthRate)}
                            </dd>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-t border-white/10 py-0.5">
                            <dt className="min-w-0 truncate font-semibold text-cyan-50/72">
                                日本側
                            </dt>
                            <dd className="min-w-0 truncate text-right font-bold tabular-nums text-white">
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
                                    className="rounded-md border border-white/18 bg-white/8 px-2 py-0.5 text-[11px] font-bold text-cyan-50/78"
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
