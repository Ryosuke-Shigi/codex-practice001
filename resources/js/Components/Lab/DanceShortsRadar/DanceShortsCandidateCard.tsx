import DanceShortsStats from './DanceShortsStats';
import DanceShortsThumbnailLink from './DanceShortsThumbnailLink';
import type { DanceShortsCandidate } from './types';

type DanceShortsCandidateCardProps = {
    candidate: DanceShortsCandidate;
    index: number;
};

/*
 * 候補1件分のカード表示です。
 *
 * このコンポーネントは候補の見せ方に集中し、クリック時の外部リンクは DanceShortsThumbnailLink、
 * 数値のラベルと整形は DanceShortsStats へ分けています。カード内に sort や API 呼び出しを
 * 持たせないことで、候補一覧の表示責務を小さく保ちます。
 */
export default function DanceShortsCandidateCard({
    candidate,
    index,
}: DanceShortsCandidateCardProps) {
    return (
        <article className="grid gap-4 rounded-lg border border-white/22 bg-slate-950/44 p-4 text-white shadow-[0_18px_36px_rgba(2,24,45,0.18)] backdrop-blur-xl md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)]">
            <div className="min-w-0">
                {/*
                    サムネイルクリックだけを YouTube への外部遷移にします。
                    カード全体を外部リンクにしないことで、後続でメモや追跡ボタンを足しても操作領域を分けやすくします。
                */}
                <DanceShortsThumbnailLink
                    title={candidate.title}
                    thumbnailUrl={candidate.thumbnail_url}
                    youtubeUrl={candidate.youtube_url}
                />
                <p className="mt-2 text-xs font-semibold text-cyan-50/66">
                    {candidate.youtube_url === null
                        ? 'YouTube URL は未取得です'
                        : 'サムネイルからYouTubeを別タブで開けます'}
                </p>
            </div>

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-white/24 bg-white/10 px-2.5 py-1 text-xs font-bold text-cyan-50">
                        地域: {candidate.region}
                    </span>
                    <span className="rounded-md border border-amber-100/28 bg-amber-100/12 px-2.5 py-1 text-xs font-bold text-amber-50">
                        表示順 {index + 1}
                    </span>
                </div>

                {/*
                    タイトルと投稿日は、YouTube API / DB 実装後も候補カードの基本情報として残る想定です。
                    published_at はモック段階では文字列のまま受け取り、日付変換やタイムゾーン処理はまだ入れません。
                */}
                <p className="mt-3 text-xs font-bold text-cyan-100/60">
                    タイトル
                </p>
                <h3 className="mt-1 text-xl font-semibold leading-tight text-white">
                    {candidate.title}
                </h3>
                {candidate.channel_title !== undefined && (
                    <p className="mt-2 text-sm font-semibold text-cyan-50/72">
                        {candidate.channel_title ?? 'チャンネル名未設定'}
                    </p>
                )}

                <dl className="mt-3 grid gap-2 text-sm text-cyan-50/78">
                    <div>
                        <dt className="text-xs font-bold text-cyan-100/60">
                            投稿日
                        </dt>
                        <dd className="mt-1 font-semibold text-white">
                            {candidate.published_at ?? '未設定'}
                        </dd>
                    </div>
                    {candidate.collected_at !== undefined && (
                        <div>
                            <dt className="text-xs font-bold text-cyan-100/60">
                                収集日時
                            </dt>
                            <dd className="mt-1 font-semibold text-white">
                                {candidate.collected_at ?? '未設定'}
                            </dd>
                        </div>
                    )}
                </dl>

                <div className="mt-4">
                    <DanceShortsStats candidate={candidate} />
                </div>
            </div>
        </article>
    );
}
