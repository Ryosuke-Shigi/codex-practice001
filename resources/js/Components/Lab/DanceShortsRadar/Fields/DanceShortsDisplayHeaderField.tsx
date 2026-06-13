/**
 * DanceShortsRadar 本画面の header props 表示 Field Component です。
 *
 * backend が整えた見出し文言を表示するだけにし、タブや件数の再計算は行いません。
 */
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
        <h1 className="truncate text-lg font-semibold leading-tight text-slate-800 sm:text-xl">
            Dance Shorts Radar
        </h1>
    );
}
