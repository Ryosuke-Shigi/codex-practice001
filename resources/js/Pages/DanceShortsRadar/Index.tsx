import { Head, Link, router } from '@inertiajs/react';

import DanceShortsDisplayCardField from '@/Components/Lab/DanceShortsRadar/Cards/DanceShortsDisplayCardField';
import RegionTabs from '@/Components/Lab/DanceShortsRadar/RegionTabs';
import { DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES } from '@/Components/Lab/DanceShortsRadar/types';
import type {
    DanceShortsDisplayCardField as DanceShortsDisplayCardFieldProps,
    DanceShortsTab,
} from '@/Components/Lab/DanceShortsRadar/types';
import PublicLayout from '@/Layouts/PublicLayout';

/*
 * DanceShortsRadar の通常ランキング本画面です。
 *
 * 本データ用 Responder が、現在条件に対応する displayCardField を表示用 props shape へ
 * 変換して渡します。この Page は受け取ったカードフィールドを表示コンポーネントへ流し、
 * DB 取得や snapshot metric の再計算は行いません。
 */
type RegionTab = DanceShortsTab & {
    href: string;
    isActive: boolean;
};

type ComparisonDayOption = {
    value: number;
    label: string;
    href: string;
    isActive: boolean;
};

type SortKeyOption = {
    value: string;
    label: string;
    href: string;
    isActive: boolean;
};

type DanceShortsRadarIndexProps = {
    filters: {
        region: string | null;
        selectedTab: string;
        comparisonDays: number;
        limit: number;
        sortKey: string;
    };
    regionTabs: RegionTab[];
    regions: DanceShortsTab[];
    displayCardField: DanceShortsDisplayCardFieldProps;
    comparisonDayOptions: ComparisonDayOption[];
    sortKeyOptions: SortKeyOption[];
};

function OptionButtons({
    label,
    options,
}: {
    label: string;
    options: Array<ComparisonDayOption | SortKeyOption>;
}) {
    /*
     * 比較日数と並び順の操作も、タブと同じく Responder が作った href を router.get() に渡します。
     * Page 側で query を再生成しないことで、region / comparisonDays / sort / limit の保持ルールを
     * Laravel 側へ集約し、React は「押された選択肢を Inertia 遷移に渡す」だけに留めます。
     */
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
                            router.get(option.href, {}, { preserveScroll: true })
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

export default function DanceShortsRadarIndex({
    filters,
    regionTabs,
    displayCardField,
    comparisonDayOptions,
    sortKeyOptions,
}: DanceShortsRadarIndexProps) {
    /*
     * 本番画面では region の切り替えを URL query に残してサーバー再取得します。
     * 既存の確認画面の RegionTabs はローカル state だけで切り替えますが、本画面で同じことをすると
     * comparisonDays / sort の query が選択中 region とズレやすくなります。
     * そのため、表示コンポーネントは共通化しつつ、href 付きタブとして使うことで
     * 「見え方は既存表示仕様と同じ、データ取得は本番 Query 経由」という境界を保ちます。
     */
    const displayTabs = regionTabs;
    const selectedTab = displayCardField.selectedTab;
    const selectedTabDefinition =
        displayTabs.find((regionTab) => regionTab.code === selectedTab) ??
        displayTabs.find((regionTab) => regionTab.isActive) ??
        displayTabs[0];

    /*
     * 表示対象のカード配列は displayCardField.cards として Laravel 側で確定済みです。
     * Page 側では allCandidates / candidatesByRegion / risingCandidates から選び直さず、
     * 1つの表示フィールドへ渡します。
     *
     * Page が見る type は、並び順 UI を出すかどうかの表示制御だけです。
     * 「RISING ならどの候補を表示するか」「ALL ならどの地域を集約するか」は
     * Query Action / DTO / Responder 側で固定します。
     */
    const isRisingField =
        displayCardField.type === DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING;

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Dance Shorts Radar" />

            <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 pb-10">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-emerald-50/72">
                            Dance Shorts Radar
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                            通常ランキング
                        </h1>
                    </div>
                    <Link
                        href="/lab"
                        className="inline-flex min-h-10 items-center rounded-md border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                    >
                        Labへ戻る
                    </Link>
                </header>

                <section className="grid gap-4 rounded-lg border border-white/18 bg-slate-950/38 p-4 text-white shadow-[0_16px_36px_rgba(4,25,42,0.16)] backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-cyan-50/78">
                            {selectedTabDefinition?.label ?? '地域未選択'} /{' '}
                            {displayCardField.comparisonDays}日比較 /{' '}
                            {displayCardField.cards.length}
                            件
                        </p>
                        <p className="mt-1 text-xs text-cyan-50/60">
                            {isRisingField
                                ? `上昇候補順 / limit: ${filters.limit}`
                                : `sort_key: ${displayCardField.sortKey} / limit: ${filters.limit}`}
                        </p>
                    </div>
                    <div
                        className={[
                            'grid min-w-0 gap-3 lg:min-w-[520px]',
                            isRisingField ? '' : 'sm:grid-cols-2',
                        ].join(' ')}
                    >
                        <OptionButtons
                            label="比較日数"
                            options={comparisonDayOptions}
                        />
                        {!isRisingField && (
                            /*
                             * 上昇候補は Service / Responder が固定順で渡す観測候補です。
                             * React 側で sortKey を使って並び替えたり、metric を再計算したりしないため、
                             * 上昇候補タブではユーザー選択の並び順 UI を表示しません。
                             */
                            <OptionButtons
                                label="並び順"
                                options={sortKeyOptions}
                            />
                        )}
                    </div>
                </section>

                {displayTabs.length > 0 && (
                    <RegionTabs
                        tabs={displayTabs}
                        selectedTab={selectedTab ?? 'JP'}
                    />
                )}

                <DanceShortsDisplayCardField
                    displayCardField={displayCardField}
                    selectedTabDefinition={selectedTabDefinition}
                />
            </main>
        </PublicLayout>
    );
}
