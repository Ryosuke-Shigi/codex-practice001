import DanceShortsStats from '../Lab/DanceShortsRadar/DanceShortsStats';
import DanceShortsThumbnailLink from '../Lab/DanceShortsRadar/DanceShortsThumbnailLink';
import type { DanceShortsCandidate, DanceShortsRisingCandidate } from '../Lab/DanceShortsRadar/types';

type Props = {
    candidate: DanceShortsCandidate | DanceShortsRisingCandidate;
    rank: number;
    sortKey: string;
    contentTransitionClassName?: string;
    contentTransitionKey?: number;
};

const number = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('ja-JP', { style: 'percent', maximumFractionDigits: 1 });

/** PRODUCT専用の表示。候補判定・再集計・並び替えはサーバーに残します。 */
export default function RadarCandidateCard({ candidate, rank, sortKey, contentTransitionClassName, contentTransitionKey = 0 }: Props) {
    const rising = 'source_region' in candidate;
    const collectedAt = rising ? candidate.source_collected_at : candidate.collected_at;

    return (
        <article aria-current="true" className="radar-candidate">
            <div key={contentTransitionKey} className={['radar-candidate__information', contentTransitionClassName].filter(Boolean).join(' ')}>
                <div className="radar-candidate__identity">
                    <span data-radar-rank className="radar-candidate__rank">{rank}<small>位</small></span>
                    <span className="radar-candidate__region">観測地域 {rising ? `${candidate.source_region_label} / ${candidate.source_region}` : candidate.region}</span>
                </div>
                <h3 title={candidate.title}>{candidate.title}</h3>
                {rising ? (
                    <>
                        <dl className="radar-candidate__metrics">
                            <div><dt>海外側の視聴増加数</dt><dd>+{number.format(candidate.view_count_delta)}<small>回</small></dd></div>
                            <div><dt>海外側の増加率</dt><dd>{candidate.view_growth_rate === null ? '算出不可' : percent.format(candidate.view_growth_rate)}</dd></div>
                            <div className="radar-candidate__japan"><dt>日本側</dt><dd>{candidate.japan_status}<span>{candidate.japan_view_count_delta === null || candidate.japan_view_count_delta === undefined ? '未観測' : `+${number.format(candidate.japan_view_count_delta)}回`}</span></dd></div>
                        </dl>
                        <p className="radar-candidate__reason" title={candidate.observation_note}>{candidate.observation_note}</p>
                        {candidate.tags.length > 0 && <ul className="radar-candidate__tags">{candidate.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
                    </>
                ) : <><DanceShortsStats candidate={candidate} sortKey={sortKey} />{candidate.comparison_status !== undefined && <p className="radar-candidate__comparison-status">{candidate.comparison_status}</p>}</>}
                {candidate.channel_title !== undefined && <p className="radar-candidate__metadata">{candidate.channel_title ?? 'チャンネル名未設定'}</p>}
                <p className="radar-candidate__metadata">投稿 {candidate.published_at?.replace(/-/g, '/') ?? '未設定'}<br />収集 {collectedAt?.replace(/-/g, '/') ?? '未設定'}</p>
            </div>
            <div className="radar-candidate__media">
                {/* 公開版はカードの同一性と同時に画像状態を切替え、遅延中の旧リンクを残しません。 */}
                <DanceShortsThumbnailLink
                    key={`${candidate.video_id ?? candidate.title}:${candidate.thumbnail_url}:${candidate.youtube_url}`}
                    title={candidate.title}
                    thumbnailUrl={candidate.thumbnail_url}
                    youtubeUrl={candidate.youtube_url}
                    className="radar-candidate__thumbnail"
                />
            </div>
        </article>
    );
}
