import {
    DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES,
    type DanceShortsDisplayCardField,
    type DanceShortsTab,
} from '../types';
import DanceShortRankingCardList from './DanceShortRankingCardList';
import DanceShortRisingCardList from './DanceShortRisingCardList';
import EmptyDisplayCardField from './EmptyDisplayCardField';

type DanceShortsDisplayCardFieldProps = {
    displayCardField: DanceShortsDisplayCardField;
    selectedTabDefinition?: DanceShortsTab;
};

/*
 * Laravel 側で確定した表示カードフィールドを描画するコンポーネントです。
 *
 * ranking / rising のどちらを描くかだけを見て既存カード表示へ流し込みます。
 * ALL / JP / US / KR / RISING の候補配列選択は Action / DTO / Responder 側で済ませ、
 * React では allCandidates や candidatesByRegion から表示対象を選び直しません。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    selectedTabDefinition,
}: DanceShortsDisplayCardFieldProps) {
    /*
     * この switch は「どのカード配列を表示するか」ではなく、「確定済みカード配列を
     * どのカードリストコンポーネントで描くか」だけを決めます。
     *
     * displayCardField.cards の中身と順序は Laravel 側で確定済みなので、ここでは filter / sort /
     * region 判定を追加しません。React 側にランキング条件の意味づけが戻ってくると、
     * URL query と実際の表示対象がずれるためです。
     */
    switch (displayCardField.type) {
        case DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING:
            return (
                <DanceShortRankingCardList
                    cards={displayCardField.cards}
                    comparisonDays={displayCardField.comparisonDays}
                    selectedTabDefinition={selectedTabDefinition}
                    selectedTab={displayCardField.selectedTab}
                    emptyMessage={displayCardField.emptyMessage}
                />
            );

        case DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING:
            return (
                <DanceShortRisingCardList
                    cards={displayCardField.cards}
                    comparisonDays={displayCardField.comparisonDays}
                    emptyMessage={displayCardField.emptyMessage}
                />
            );

        default: {
            /*
             * TypeScript 上は ranking / rising の union で閉じていますが、サーバー側の将来拡張や
             * 一時的な props 不整合があっても空状態として安全に倒します。
             */
            const fallbackMessage =
                (displayCardField as { emptyMessage?: string }).emptyMessage ??
                '表示できるカードはまだありません。';

            return (
                <EmptyDisplayCardField message={fallbackMessage} />
            );
        }
    }
}
