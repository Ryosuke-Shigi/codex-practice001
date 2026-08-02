import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
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
        <PublicLayout className="px-5 py-8 sm:px-8 lg:px-10">
            <Head title="QuakeWave Map" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 pb-12 pt-4 sm:pt-8">
                <header className="flex items-center justify-between gap-4">
                    <Link
                        href={quakeWaveMapReturn.href}
                        aria-label={quakeWaveMapReturn.ariaLabel}
                        title={quakeWaveMapReturn.title}
                        className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        {quakeWaveMapReturn.label}
                    </Link>
                    <Link
                        href="/quakewave-preview"
                        className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-950/70 backdrop-blur-xl transition hover:bg-cyan-50/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        Preview Tools
                    </Link>
                </header>

                <JapanQuakeWaveMap
                    pins={visiblePins}
                    eyebrow="QuakeWave Map"
                    title="地震情報可視化"
                    summary="DBに保存済みの地震情報を日本地図上へ重ね、震源・震度・波紋を確認します。"
                    mapOverlay={(
                        <PinDisplayLimitSlider
                            value={pinDisplayLimit}
                            availablePinCount={filteredPins.length}
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
                        />
                    )}
                    refreshAction={refreshAction}
                    refreshPanelPlacement="controls"
                    detailPanelPlacement="below"
                    detailPanelCollapsible
                    detailPanelDefaultOpen={false}
                />
            </div>
        </PublicLayout>
    );
}
