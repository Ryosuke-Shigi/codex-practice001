import { router } from '@inertiajs/react';

import RegionTabs from '../RegionTabs';
import { DANCE_SHORTS_RADAR_RELOAD_OPTIONS } from '../inertiaReloadOptions';
import type {
    DanceShortsDisplaySelectField as DanceShortsDisplaySelectFieldProps,
    DanceShortsSelectOption,
} from '../types';

type OptionButtonsProps<T extends string | number> = {
    label: string;
    options: Array<DanceShortsSelectOption<T>>;
};

/*
 * 比較日数 / 並び順の選択肢を描画する小さな共通部品です。
 *
 * options の href と isActive は Responder が現在 query から作った確定値です。
 * この部品では URLSearchParams を組み立てず、表示対象カードの filter / sort もしません。
 * クリックされた href を Inertia に渡すだけにすることで、query の意味づけを Laravel 側へ保ちます。
 */
function OptionButtons<T extends string | number>({
    label,
    options,
}: OptionButtonsProps<T>) {
    return (
        <section className="min-w-0">
            <p className="text-xs font-semibold text-cyan-50/70">{label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={`${label}-${option.value}`}
                        type="button"
                        aria-pressed={option.isActive}
                        onClick={() =>
                            router.get(
                                option.href,
                                {},
                                DANCE_SHORTS_RADAR_RELOAD_OPTIONS,
                            )
                        }
                        className={[
                            'inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35',
                            option.isActive
                                ? 'border-white bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.18)]'
                                : 'border-white/18 bg-white/8 text-cyan-50 hover:bg-white/14',
                        ].join(' ')}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </section>
    );
}

export default function DanceShortsDisplaySelectField({
    displaySelectField,
}: {
    displaySelectField: DanceShortsDisplaySelectFieldProps;
}) {
    /*
     * displaySelectField は操作 UI の入口です。
     *
     * selectedTab はタブの active 表示、comparisonDayOptions は比較日数ボタン、
     * sortKeyOptions は並び順ボタンにだけ使います。カード件数や説明文は header field、
     * カード配列と空状態は card field が担当するため、このコンポーネントでは参照しません。
     */
    return (
        <section className="grid gap-3 rounded-lg border border-white/18 bg-slate-950/38 p-4 text-white shadow-[0_16px_36px_rgba(4,25,42,0.16)] backdrop-blur-xl">
            {displaySelectField.regionTabs.length > 0 && (
                <RegionTabs
                    tabs={displaySelectField.regionTabs}
                    selectedTab={displaySelectField.selectedTab}
                />
            )}

            <div
                className={[
                    'grid min-w-0 gap-3',
                    displaySelectField.showSortKeyOptions
                        ? 'sm:grid-cols-2'
                        : '',
                ].join(' ')}
            >
                <OptionButtons
                    label="比較日数"
                    options={displaySelectField.comparisonDayOptions}
                />
                {displaySelectField.showSortKeyOptions && (
                    /*
                     * 上昇候補は Laravel 側で固定の上昇候補順に確定したカードを受け取ります。
                     * そのため並び順 UI の表示可否は showSortKeyOptions に従い、React 側で
                     * sortKey を使った独自ソートや独自フィルタは行いません。
                     */
                    <OptionButtons
                        label="並び順"
                        options={displaySelectField.sortKeyOptions}
                    />
                )}
            </div>
        </section>
    );
}
