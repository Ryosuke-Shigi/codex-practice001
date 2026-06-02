import DanceShortsCardDisplayField from '../Cards/DanceShortsDisplayCardField';
import type {
    DanceShortsDisplayCardField as DanceShortsDisplayCardFieldProps,
    DanceShortsDisplayCardWindowRequest,
} from '../types';

/*
 * Page から見た card field の入口です。
 *
 * ここでは Field 名を揃えるために薄く包み、実際の ranking / rising のカード種別分岐は
 * Cards 側の既存 adapter に委譲します。select/header の状態値は受け取らず、card field を
 * 下側の差し替え領域として保つための境界になっています。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    windowRequest,
}: {
    displayCardField: DanceShortsDisplayCardFieldProps;
    windowRequest: DanceShortsDisplayCardWindowRequest;
}) {
    return (
        <DanceShortsCardDisplayField
            displayCardField={displayCardField}
            windowRequest={windowRequest}
        />
    );
}
