import RisingCandidatesSection from '../RisingCandidatesSection';
import type {
    DanceShortsAggregationPeriod,
    DanceShortsRisingCandidate,
} from '../types';

type DanceShortRisingCardListProps = {
    cards: DanceShortsRisingCandidate[];
    comparisonDays: number;
    emptyMessage: string;
};

function periodLabel(comparisonDays: number): DanceShortsAggregationPeriod {
    return `${comparisonDays}日` as DanceShortsAggregationPeriod;
}

/*
 * 上昇候補用カードリストの薄い adapter です。
 *
 * 上昇候補は通常ランキングとはカード props の意味が違うため、既存の RisingCandidatesSection を
 * そのまま使います。ここでは comparisonDays を表示ラベルへ変える以外の判断を持たせません。
 */
export default function DanceShortRisingCardList({
    cards,
    comparisonDays,
    emptyMessage,
}: DanceShortRisingCardListProps) {
    return (
        <RisingCandidatesSection
            periodLabel={periodLabel(comparisonDays)}
            candidates={cards}
            emptyMessage={emptyMessage}
        />
    );
}
