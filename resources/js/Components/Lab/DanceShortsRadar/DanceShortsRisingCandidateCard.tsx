import DanceShortsThumbnailLink from './DanceShortsThumbnailLink';
import type { DanceShortsRegionCode } from './types';

type DanceShortsRisingCandidateCardProps = {
    title: string;
    sourceRegion: DanceShortsRegionCode;
    sourceRegionLabel: string;
    japanStatus: string;
    viewCountDelta: number;
    viewGrowthRate: number | null;
    japanViewCountDelta: number | null;
    thumbnailUrl: string | null;
    youtubeUrl: string | null;
    tags: string[];
    observationNote: string;
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
    sourceRegion,
    sourceRegionLabel,
    japanStatus,
    viewCountDelta,
    viewGrowthRate,
    japanViewCountDelta,
    thumbnailUrl,
    youtubeUrl,
    tags,
    observationNote,
}: DanceShortsRisingCandidateCardProps) {
    return (
        <article className="grid gap-4 rounded-lg border border-white/22 bg-slate-950/44 p-4 text-white shadow-[0_18px_36px_rgba(2,24,45,0.18)] backdrop-blur-xl md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)]">
            <div className="min-w-0">
                {/*
                    サムネイルリンクは既存カードと同じ専用コンポーネントを使います。
                    外部リンクの target / rel の扱いを一箇所へ寄せ、上昇候補カード側ではリンク安全設定を持ちません。
                */}
                <DanceShortsThumbnailLink
                    title={title}
                    thumbnailUrl={thumbnailUrl}
                    youtubeUrl={youtubeUrl}
                />
                <p className="mt-2 text-xs font-semibold text-cyan-50/66">
                    サムネイルからYouTubeを別タブで開けます
                </p>
            </div>

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    {/*
                        「先行地域」は上昇候補タブで特に重要な文脈です。
                        candidate.region ではなく sourceRegion として受けることで、日本向けランキングの地域コードと
                        海外側で先に伸びている地域の意味を分けています。
                    */}
                    <span className="rounded-md border border-white/24 bg-white/10 px-2.5 py-1 text-xs font-bold text-cyan-50">
                        先行地域: {sourceRegionLabel}
                    </span>
                    <span className="rounded-md border border-white/24 bg-white/10 px-2.5 py-1 text-xs font-bold text-cyan-50">
                        地域コード: {sourceRegion}
                    </span>
                </div>

                <p className="mt-3 text-xs font-bold text-cyan-100/60">
                    タイトル
                </p>
                <h3 className="mt-1 text-xl font-semibold leading-tight text-white">
                    {title}
                </h3>

                <p className="mt-3 rounded-md border border-cyan-100/18 bg-cyan-100/10 px-3 py-2 text-sm leading-6 text-cyan-50/82">
                    {observationNote}
                </p>

                {/*
                    viewCountDelta / viewGrowthRate は Service / Responder から受け取った値です。
                    React 側で再計算せず、null は 0 に変換しないことで「算出不可」を保ちます。
                */}
                <dl className="mt-4 grid gap-0.5 text-sm">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-white/10 py-2 first:border-t-0">
                        <dt className="min-w-0 text-cyan-50/68">
                            日本側の状態
                        </dt>
                        <dd className="max-w-[12rem] text-right font-semibold text-white sm:max-w-none">
                            {japanStatus}
                        </dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-white/10 py-2">
                        <dt className="min-w-0 text-cyan-50/68">
                            海外側の視聴数増加量
                        </dt>
                        <dd className="shrink-0 font-semibold tabular-nums text-white">
                            +{formatNumber(viewCountDelta)}回
                        </dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-white/10 py-2">
                        <dt className="min-w-0 text-cyan-50/68">
                            海外側の増加率
                        </dt>
                        <dd className="shrink-0 font-semibold tabular-nums text-white">
                            {formatGrowthRate(viewGrowthRate)}
                        </dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-white/10 py-2">
                        <dt className="min-w-0 text-cyan-50/68">
                            日本側の視聴数増加量
                        </dt>
                        <dd className="shrink-0 font-semibold tabular-nums text-white">
                            {formatJapanViewCountDelta(japanViewCountDelta)}
                        </dd>
                    </div>
                </dl>

                {tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md border border-white/18 bg-white/8 px-2.5 py-1 text-xs font-bold text-cyan-50/78"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
