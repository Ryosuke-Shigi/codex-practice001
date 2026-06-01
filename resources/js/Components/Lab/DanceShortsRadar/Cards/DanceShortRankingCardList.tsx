import DanceShortsCandidateList from '../DanceShortsCandidateList';
import type {
    DanceShortsAggregationPeriod,
    DanceShortsCandidate,
    DanceShortsTab,
    DanceShortsTabCode,
} from '../types';

type DanceShortRankingCardListProps = {
    cards: DanceShortsCandidate[];
    comparisonDays: number;
    selectedTabDefinition?: DanceShortsTab;
    selectedTab: DanceShortsTabCode;
    emptyMessage: string;
};

function periodLabel(comparisonDays: number): DanceShortsAggregationPeriod {
    return `${comparisonDays}日` as DanceShortsAggregationPeriod;
}

/*
 * 通常ランキング用カードリストの薄い adapter です。
 *
 * 既存の DanceShortsCandidateList はモック画面側でも使われるため、移動や大きな props 変更はせず、
 * displayCardField の ranking cards を既存コンポーネントへ橋渡しします。
 */
export default function DanceShortRankingCardList({
    cards,
    comparisonDays,
    selectedTabDefinition,
    selectedTab,
    emptyMessage,
}: DanceShortRankingCardListProps) {
    /*
     * selectedTabDefinition は regionTabs から取れた表示名・説明文です。
     * 万一タブ定義が見つからない場合でも、カード一覧自体は Action が確定した selectedTab で
     * 表示できるように最小限の fallback を用意します。
     */
    const regionTab = selectedTabDefinition ?? {
        code: selectedTab,
        label: selectedTab,
        description: '保存済み snapshot ランキング',
    };

    return (
        <DanceShortsCandidateList
            regionTab={regionTab}
            candidates={cards}
            periodLabel={periodLabel(comparisonDays)}
            emptyMessage={emptyMessage}
        />
    );
}
