import type { DanceShortsDisplayHeaderField as DanceShortsDisplayHeaderFieldProps } from '../types';

export default function DanceShortsDisplayHeaderField({
    displayHeaderField: _displayHeaderField,
}: {
    displayHeaderField: DanceShortsDisplayHeaderFieldProps;
}) {
    /*
     * Header は画面全体の題字だけを担当します。
     * 選択中条件やカード件数は select / card 側に置き、ここでは重複表示しません。
     */
    return (
        <h1 className="truncate text-lg font-semibold leading-tight text-white sm:text-xl">
            Dance Shorts Radar
        </h1>
    );
}
