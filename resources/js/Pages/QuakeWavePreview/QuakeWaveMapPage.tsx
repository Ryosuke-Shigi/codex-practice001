import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import MapRefreshPanel from '@/Components/JapanQuakeWaveMap/MapRefreshPanel';
import PinDisplayLimitSlider from '@/Components/JapanQuakeWaveMap/PinDisplayLimitSlider';
import QuakeDateRangeFilter, {
    type QuakeDateRange,
} from '@/Components/JapanQuakeWaveMap/QuakeDateRangeFilter';
import QuakeIntensitySwitchFilter from '@/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';
import { useQuakeMapRefresh } from '@/Pages/QuakeWavePreview/hooks/useQuakeMapRefresh';
import { useVisibleEarthquakePins } from '@/Pages/QuakeWavePreview/hooks/useVisibleEarthquakePins';

type QuakeWaveMapFilters = {
    startDate: string | null;
    endDate: string | null;
};

type QuakeWaveMapPageProps = {
    pins: EarthquakeMapPin[];
    filters: QuakeWaveMapFilters;
};

const quakeWaveMapReturn = getStageProjectReturnLink(
    'japan-quake-wave-map',
);

function dateRangeFromFilters(filters: QuakeWaveMapFilters): QuakeDateRange {
    return {
        startDate: filters.startDate ?? '',
        endDate: filters.endDate ?? '',
    };
}

/**
 * DB pins 用のページ入口です。
 * Controller -> QueryAction -> Repository -> Responder で組み立てた Inertia props を受け取り、
 * 共通表示コンポーネントの JapanQuakeWaveMap に渡します。ここでは仮データを作りません。
 */
export default function QuakeWaveMapPage({ pins, filters }: QuakeWaveMapPageProps) {
    const [dateRange, setDateRange] = useState<QuakeDateRange>(() => dateRangeFromFilters(filters));

    /*
     * Page は「どの部品をどこに置くか」だけを読む入口に寄せます。
     * 震度フィルター、表示件数、表示順の算出は React 側の見え方調整なので hook に閉じ、
     * JapanQuakeWaveMap には最終的に描画する pins と操作UIだけを渡します。
     */
    const {
        filteredPins,
        visiblePins,
        selectedIntensities,
        setSelectedIntensities,
        pinDisplayLimit,
        setPinDisplayLimit,
    } = useVisibleEarthquakePins(pins);

    /*
     * 地図データ更新は POST 開始、2系統の status polling、完了後の pins 再取得までで
     * 1つの画面状態です。Page には通信手順を置かず、MapRefreshPanel 用の props だけを
     * hook から受け取ることで、表示コンポーネントへ axios や polling の責務を流しません。
     */
    const { refreshAction } = useQuakeMapRefresh({ dateRange });

    const reloadPinsByDateRange = (nextDateRange: QuakeDateRange) => {
        /*
         * 日付範囲は DB 取得条件なので Inertia で再取得します。
         * 一方で震度ON/OFFと表示件数は取得済み pins の表示状態に留め、Repository や DTO の
         * 読み取り条件へ混ぜない方針です。
         */
        setDateRange(nextDateRange);

        router.get(
            '/quakewave-preview/map',
            {
                startDate: nextDateRange.startDate,
                endDate: nextDateRange.endDate,
            },
            {
                only: ['pins', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        setDateRange(dateRangeFromFilters(filters));
    }, [filters.startDate, filters.endDate]);

    return (
        <PublicLayout
            withEffect={false}
            className="bg-[radial-gradient(circle_at_18%_8%,rgba(165,243,252,0.24),transparent_36%),linear-gradient(155deg,#164e63_0%,#0891b2_48%,#0e7490_100%)] px-4 py-6 sm:px-8 sm:py-8 lg:px-10"
        >
            <Head title="QuakeWave Map" />

            <div className="mx-auto flex min-h-screen w-full min-w-0 max-w-7xl flex-col gap-8 pb-12 pt-4 sm:pt-8">
                <JapanQuakeWaveMap
                    pins={visiblePins}
                    variant="product"
                    showIntroduction={false}
                    mapOverlay={(
                        <PinDisplayLimitSlider
                            value={pinDisplayLimit}
                            availablePinCount={filteredPins.length}
                            displayedPinCount={visiblePins.length}
                            onChange={setPinDisplayLimit}
                        />
                    )}
                    mapTopContent={(
                        <QuakeDateRangeFilter
                            value={dateRange}
                            onChange={reloadPinsByDateRange}
                        />
                    )}
                    controlPanelsBeforeLayers={(
                        <QuakeIntensitySwitchFilter
                            selectedIntensities={selectedIntensities}
                            onChange={setSelectedIntensities}
                            layout="single-row"
                        />
                    )}
                    detailPanelPlacement="below"
                    detailPanelCollapsible
                    detailPanelDefaultOpen={false}
                />

                <footer className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-start gap-2 sm:flex sm:justify-between sm:gap-4">
                    <div className="min-w-0 [&_button]:w-full [&_button]:min-w-0 [&_button]:px-2 sm:[&_button]:min-w-28 sm:[&_button]:px-5">
                        <MapRefreshPanel action={refreshAction} compact />
                    </div>
                    <Link
                        href={quakeWaveMapReturn.href}
                        aria-label={quakeWaveMapReturn.ariaLabel}
                        title={quakeWaveMapReturn.title}
                        className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border border-white/35 bg-white/15 px-2 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:px-4 sm:text-sm"
                    >
                        {quakeWaveMapReturn.label}
                    </Link>
                    <Link
                        href="/quakewave-preview"
                        className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border border-cyan-100/35 bg-cyan-50/15 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-50/90 backdrop-blur-xl transition hover:bg-cyan-50/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:px-3 sm:text-xs sm:tracking-[0.22em]"
                    >
                        Preview Tools
                    </Link>
                </footer>
            </div>
        </PublicLayout>
    );
}
