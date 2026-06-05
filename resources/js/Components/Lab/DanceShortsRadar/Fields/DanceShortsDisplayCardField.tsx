import DanceShortsCardDisplayField from '../Cards/DanceShortsDisplayCardField';
import type {
    DanceShortsDisplaySelectGroup,
    DanceShortsDisplaySelectGroupKey,
} from '../displaySelectGroups';
import type {
    DanceShortsDisplayCardField as DanceShortsDisplayCardFieldProps,
    DanceShortsDisplayCardWindowRequest,
} from '../types';

/*
 * Page から見た card field の入口です。
 *
 * ここでは Field 名を揃えるために薄く包み、実際の ranking / rising のカード種別分岐は
 * Cards 側の adapter に委譲します。windowRequest は追加 window API の query だけに使い、
 * 受け取った visibleCards の sort / slice はここでも Cards 側でも行いません。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    windowRequest,
    selectGroups,
    activeSelectGroup,
}: {
    displayCardField: DanceShortsDisplayCardFieldProps;
    windowRequest: DanceShortsDisplayCardWindowRequest;
    selectGroups: DanceShortsDisplaySelectGroup[];
    activeSelectGroup: DanceShortsDisplaySelectGroupKey;
}) {
    return (
        <DanceShortsCardDisplayField
            displayCardField={displayCardField}
            windowRequest={windowRequest}
            selectGroups={selectGroups}
            activeSelectGroup={activeSelectGroup}
        />
    );
}
