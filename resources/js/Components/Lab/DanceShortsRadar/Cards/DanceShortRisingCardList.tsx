import DanceShortsRisingCandidateCard from '../DanceShortsRisingCandidateCard';
import type { DanceShortsRisingCandidate } from '../types';
import EmptyDisplayCardField from './EmptyDisplayCardField';

type DanceShortRisingCardListProps = {
    cards: DanceShortsRisingCandidate[];
    emptyMessage: string;
};

/*
 * 上昇候補用カードリストの薄い adapter です。
 *
 * 上昇候補は通常ランキングとはカード props の意味が違うため、専用カードへそのまま流します。
 * 見出し、説明文、比較日数、件数は displayHeaderField 側で表示します。
 */
export default function DanceShortRisingCardList({
    cards,
    emptyMessage,
}: DanceShortRisingCardListProps) {
    /*
     * 上昇候補カードは、通常ランキングとは異なる意味の props を持ちます。
     * ただし「どの動画が上昇候補か」「どの順序で見せるか」は Service / Action 側で確定済みです。
     * この adapter では受け取った cards を並べるだけにし、React 独自の候補判定を戻しません。
     */
    if (cards.length === 0) {
        return <EmptyDisplayCardField message={emptyMessage} />;
    }

    return (
        <section id="dance-shorts-card-field" className="grid gap-4">
            {cards.map((candidate, index) => (
                <DanceShortsRisingCandidateCard
                    key={`${candidate.source_region}-${candidate.youtube_url ?? candidate.youtube_video_id ?? candidate.title}`}
                    title={candidate.title}
                    publishedAt={candidate.published_at}
                    sourceRegion={candidate.source_region}
                    sourceRegionLabel={candidate.source_region_label}
                    sourceCollectedAt={candidate.source_collected_at}
                    japanStatus={candidate.japan_status}
                    viewCountDelta={candidate.view_count_delta}
                    viewGrowthRate={candidate.view_growth_rate}
                    japanViewCountDelta={
                        candidate.japan_view_count_delta ?? null
                    }
                    thumbnailUrl={candidate.thumbnail_url}
                    youtubeUrl={candidate.youtube_url}
                    tags={candidate.tags}
                    observationNote={candidate.observation_note}
                    rank={index + 1}
                    isActive={false}
                />
            ))}
        </section>
    );
}
