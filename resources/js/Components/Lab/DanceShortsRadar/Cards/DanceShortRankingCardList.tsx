import DanceShortsCandidateCard from '../DanceShortsCandidateCard';
import type { DanceShortsCandidate } from '../types';
import EmptyDisplayCardField from './EmptyDisplayCardField';

type DanceShortRankingCardListProps = {
    cards: DanceShortsCandidate[];
    emptyMessage: string;
};

/*
 * 通常ランキング用カードリストの薄い adapter です。
 *
 * 既存の DanceShortsCandidateList はモック画面側でも使われるため、移動や大きな props 変更はせず、
 * 本画面の displayCardField ではカード一覧と空状態だけを描きます。
 */
export default function DanceShortRankingCardList({
    cards,
    emptyMessage,
}: DanceShortRankingCardListProps) {
    /*
     * 通常ランキングのカード一覧は、Responder が確定した順序をそのまま描画します。
     * ここで selectedTab や sortKey を見て選び直すと、Laravel 側で固定した表示対象と
     * React 側の表示が二重管理になるため、カード配列以外の画面状態は受け取りません。
     */
    if (cards.length === 0) {
        return <EmptyDisplayCardField message={emptyMessage} />;
    }

    return (
        <section id="dance-shorts-card-field" className="grid gap-4">
            {cards.map((candidate) => (
                <DanceShortsCandidateCard
                    key={`${candidate.region}-${candidate.video_id ?? candidate.youtube_url ?? candidate.title}`}
                    candidate={candidate}
                />
            ))}
        </section>
    );
}
