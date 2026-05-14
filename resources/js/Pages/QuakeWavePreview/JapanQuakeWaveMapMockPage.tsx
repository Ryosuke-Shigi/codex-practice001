import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import EarthquakePin, {
    type EarthquakePinPreview,
} from '@/Components/JapanQuakeWaveMap/EarthquakePin';
import EarthquakeRipple, {
    type EarthquakeRipplePreview,
} from '@/Components/JapanQuakeWaveMap/EarthquakeRipple';
import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import PinDisplayLimitSlider, {
    PIN_DISPLAY_LIMIT_INITIAL,
} from '@/Components/JapanQuakeWaveMap/PinDisplayLimitSlider';
import QuakeDateRangeFilter, {
    type QuakeDateRange,
} from '@/Components/JapanQuakeWaveMap/QuakeDateRangeFilter';
import QuakeIntensitySwitchFilter, {
    quakeIntensityKey,
    quakeIntensityKeys,
    quakeIntensitySortRank,
    type QuakeIntensityKey,
} from '@/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter';
import PublicLayout from '@/Layouts/PublicLayout';

type MockPinSeed = {
    areaName: string;
    latitude: number;
    longitude: number;
    depthMeter: number;
    magnitude: string;
    maxIntensity: string | null;
};

const mockPinSeeds: MockPinSeed[] = [
    {
        areaName: '北海道東方沖',
        latitude: 43.4,
        longitude: 145.8,
        depthMeter: 40000,
        magnitude: '7.1',
        maxIntensity: '7',
    },
    {
        areaName: '十勝沖',
        latitude: 41.9,
        longitude: 143.7,
        depthMeter: 50000,
        magnitude: '6.8',
        maxIntensity: '6+',
    },
    {
        areaName: '根室半島南東沖',
        latitude: 43.0,
        longitude: 145.2,
        depthMeter: 30000,
        magnitude: '6.5',
        maxIntensity: '6-',
    },
    {
        areaName: '相模湾',
        latitude: 35.1,
        longitude: 139.4,
        depthMeter: 20000,
        magnitude: '5.9',
        maxIntensity: '5+',
    },
    {
        areaName: '四国沖',
        latitude: 32.4,
        longitude: 134.7,
        depthMeter: 30000,
        magnitude: '6.2',
        maxIntensity: '6-',
    },
    {
        areaName: '北海道南西沖',
        latitude: 42.0,
        longitude: 139.5,
        depthMeter: 18000,
        magnitude: '5.7',
        maxIntensity: '5+',
    },
    {
        areaName: '静岡県西部',
        latitude: 34.8,
        longitude: 137.9,
        depthMeter: 12000,
        magnitude: '3.1',
        maxIntensity: '1',
    },
    {
        areaName: '内浦湾',
        latitude: 42.3,
        longitude: 140.7,
        depthMeter: 11000,
        magnitude: '3.4',
        maxIntensity: '1',
    },
    {
        areaName: '震度未判定海域',
        latitude: 35.9,
        longitude: 140.4,
        depthMeter: 45000,
        magnitude: '4.2',
        maxIntensity: null,
    },
    {
        areaName: '詳細不明震源',
        latitude: 34.0,
        longitude: 136.0,
        depthMeter: 30000,
        magnitude: '4.0',
        maxIntensity: '不明',
    },
    {
        areaName: '青森県東方沖',
        latitude: 41.0,
        longitude: 142.5,
        depthMeter: 50000,
        magnitude: '4.0',
        maxIntensity: '2',
    },
    {
        areaName: '紀伊水道',
        latitude: 33.8,
        longitude: 135.1,
        depthMeter: 30000,
        magnitude: '5.1',
        maxIntensity: '4',
    },
    {
        areaName: '日向灘',
        latitude: 32.1,
        longitude: 132.1,
        depthMeter: 20000,
        magnitude: '6.0',
        maxIntensity: '5-',
    },
    { areaName: '釧路沖', latitude: 42.9, longitude: 145.2, depthMeter: 60000, magnitude: '4.8', maxIntensity: '3' },
    { areaName: '浦河沖', latitude: 42.1, longitude: 142.8, depthMeter: 70000, magnitude: '5.2', maxIntensity: '4' },
    { areaName: '岩手県沖', latitude: 39.6, longitude: 142.1, depthMeter: 50000, magnitude: '4.5', maxIntensity: '3' },
    { areaName: '宮城県沖', latitude: 38.3, longitude: 142.0, depthMeter: 40000, magnitude: '5.4', maxIntensity: '4' },
    { areaName: '福島県沖', latitude: 37.4, longitude: 141.8, depthMeter: 50000, magnitude: '5.8', maxIntensity: '5-' },
    { areaName: '茨城県沖', latitude: 36.4, longitude: 141.1, depthMeter: 40000, magnitude: '4.9', maxIntensity: '3' },
    { areaName: '千葉県東方沖', latitude: 35.5, longitude: 141.2, depthMeter: 30000, magnitude: '4.6', maxIntensity: '3' },
    { areaName: '東京湾', latitude: 35.5, longitude: 139.8, depthMeter: 70000, magnitude: '3.8', maxIntensity: '2' },
    { areaName: '伊豆大島近海', latitude: 34.8, longitude: 139.4, depthMeter: 10000, magnitude: '4.2', maxIntensity: '3' },
    { areaName: '駿河湾', latitude: 34.8, longitude: 138.5, depthMeter: 20000, magnitude: '4.4', maxIntensity: '3' },
    { areaName: '長野県中部', latitude: 36.2, longitude: 137.8, depthMeter: 10000, magnitude: '3.6', maxIntensity: '2' },
    { areaName: '新潟県中越地方', latitude: 37.3, longitude: 138.8, depthMeter: 12000, magnitude: '4.1', maxIntensity: '3' },
    { areaName: '能登半島沖', latitude: 37.5, longitude: 137.1, depthMeter: 15000, magnitude: '4.7', maxIntensity: '4' },
    { areaName: '富山湾', latitude: 37.0, longitude: 137.3, depthMeter: 18000, magnitude: '3.5', maxIntensity: '2' },
    { areaName: '福井県嶺北', latitude: 36.1, longitude: 136.2, depthMeter: 9000, magnitude: '3.9', maxIntensity: '2' },
    { areaName: '大阪湾', latitude: 34.5, longitude: 135.0, depthMeter: 12000, magnitude: '4.0', maxIntensity: '3' },
    { areaName: '兵庫県南東部', latitude: 34.8, longitude: 135.2, depthMeter: 15000, magnitude: '4.3', maxIntensity: '3' },
    { areaName: '鳥取県中部', latitude: 35.4, longitude: 133.8, depthMeter: 11000, magnitude: '4.2', maxIntensity: '4' },
    { areaName: '島根県東部', latitude: 35.2, longitude: 133.2, depthMeter: 10000, magnitude: '3.7', maxIntensity: '2' },
    { areaName: '広島県北部', latitude: 34.8, longitude: 132.8, depthMeter: 12000, magnitude: '3.8', maxIntensity: '2' },
    { areaName: '伊予灘', latitude: 33.7, longitude: 132.3, depthMeter: 50000, magnitude: '4.6', maxIntensity: '3' },
    { areaName: '豊後水道', latitude: 33.2, longitude: 132.0, depthMeter: 40000, magnitude: '5.0', maxIntensity: '4' },
    { areaName: '高知県沖', latitude: 32.8, longitude: 133.5, depthMeter: 30000, magnitude: '4.5', maxIntensity: '3' },
    { areaName: '熊本県熊本地方', latitude: 32.7, longitude: 130.7, depthMeter: 12000, magnitude: '4.4', maxIntensity: '4' },
    { areaName: '鹿児島湾', latitude: 31.4, longitude: 130.6, depthMeter: 10000, magnitude: '4.0', maxIntensity: '3' },
    { areaName: '奄美大島近海', latitude: 28.2, longitude: 129.3, depthMeter: 30000, magnitude: '5.1', maxIntensity: '4' },
    { areaName: '沖縄本島近海', latitude: 26.5, longitude: 128.4, depthMeter: 40000, magnitude: '4.8', maxIntensity: '3' },
    { areaName: '宮古島近海', latitude: 24.8, longitude: 125.4, depthMeter: 50000, magnitude: '5.3', maxIntensity: '4' },
    { areaName: '石垣島近海', latitude: 24.3, longitude: 124.3, depthMeter: 30000, magnitude: '5.0', maxIntensity: '3' },
    { areaName: '三陸沖', latitude: 39.2, longitude: 143.5, depthMeter: 10000, magnitude: '5.6', maxIntensity: '4' },
    { areaName: '父島近海', latitude: 27.1, longitude: 142.0, depthMeter: 60000, magnitude: '5.2', maxIntensity: '3' },
    { areaName: '薩摩半島西方沖', latitude: 31.2, longitude: 129.8, depthMeter: 20000, magnitude: '4.6', maxIntensity: '3' },
];

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function mockDateTime(index: number, offsetMinutes: number) {
    const totalMinutes = (22 * 60 + 50) - index * 20 - offsetMinutes;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    return `2026-05-11T${pad(hour)}:${pad(minute)}:00+09:00`;
}

function pinTimestamp(pin: Pick<EarthquakeMapPin, 'occurredAt' | 'reportedAt'>) {
    const value = pin.reportedAt ?? pin.occurredAt;
    const timestamp = value ? new Date(value).getTime() : Number.NaN;

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function pinKey(pin: EarthquakeMapPin) {
    return `${pin.eventId ?? 'no-event'}:${pin.sourceEntryId}`;
}

function comparePinsForMockDisplay(left: EarthquakeMapPin, right: EarthquakeMapPin) {
    const intensityDifference = quakeIntensitySortRank(right.maxIntensity)
        - quakeIntensitySortRank(left.maxIntensity);

    if (intensityDifference !== 0) {
        return intensityDifference;
    }

    return pinTimestamp(right) - pinTimestamp(left);
}

function pickVisibleMockPins(
    filteredPins: EarthquakeMapPin[],
    selectedIntensities: QuakeIntensityKey[],
    limit: number,
) {
    const sortedPins = [...filteredPins].sort(comparePinsForMockDisplay);

    if (
        selectedIntensities.length === 0
        || selectedIntensities.length === quakeIntensityKeys.length
    ) {
        return sortedPins.slice(0, limit);
    }

    /*
     * モックではフィルター操作感を優先し、少数の震度だけをONにしたときは
     * ONにした震度が表示上限の手前で丸ごと落ちないようにします。
     * そのうえで最終表示順は、震度が大きい順、同じ震度なら新しい順へ戻します。
     */
    const pickedPins: EarthquakeMapPin[] = [];
    const pickedKeys = new Set<string>();

    for (const intensity of selectedIntensities) {
        if (pickedPins.length >= limit) {
            break;
        }

        const pin = sortedPins.find((candidate) => quakeIntensityKey(candidate.maxIntensity) === intensity
            && !pickedKeys.has(pinKey(candidate)));

        if (pin) {
            pickedPins.push(pin);
            pickedKeys.add(pinKey(pin));
        }
    }

    for (const pin of sortedPins) {
        if (pickedPins.length >= limit) {
            break;
        }

        if (!pickedKeys.has(pinKey(pin))) {
            pickedPins.push(pin);
            pickedKeys.add(pinKey(pin));
        }
    }

    return pickedPins.sort(comparePinsForMockDisplay);
}

function coordinatePart(value: number) {
    return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}`;
}

const mockPins: EarthquakeMapPin[] = mockPinSeeds.map((seed, index) => ({
    eventId: `mock-${String(index + 1).padStart(3, '0')}`,
    sourceEntryId: index + 1,
    title: '震源・震度情報',
    areaName: seed.areaName,
    headline: '仮データによる地震情報表示です。',
    rawCoordinate: `${coordinatePart(seed.latitude)}${coordinatePart(seed.longitude)}-${seed.depthMeter}/`,
    latitude: seed.latitude.toFixed(7),
    longitude: seed.longitude.toFixed(7),
    depthMeter: seed.depthMeter,
    magnitude: seed.magnitude,
    maxIntensity: seed.maxIntensity,
    occurredAt: mockDateTime(index, 4),
    reportedAt: mockDateTime(index, 0),
    comment: 'モック用の表示確認データです。',
}));

const mockPinParts: EarthquakePinPreview[] = [
    { label: '震度7', maxIntensity: '7', color: '#ef4444', sizeLabel: 'large' },
    { label: '震度6強', maxIntensity: '6+', color: '#f43f5e', sizeLabel: 'large' },
    { label: '震度5強', maxIntensity: '5+', color: '#a855f7', sizeLabel: 'medium' },
    { label: '震度4', maxIntensity: '4', color: '#38bdf8', sizeLabel: 'small' },
];

const mockRippleParts: EarthquakeRipplePreview[] = [
    { label: '強い波紋', maxIntensity: '7', color: '#ef4444', size: 112, duration: '1.6s', ringCount: 4 },
    { label: '中間波紋', maxIntensity: '5+', color: '#a855f7', size: 92, duration: '2.2s', ringCount: 3 },
    { label: '弱い波紋', maxIntensity: '4', color: '#38bdf8', size: 76, duration: '2.8s', ringCount: 2 },
];

function formatDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    return `${year}-${month}-${day}`;
}

function dateRangeFromToday(): QuakeDateRange {
    const endDate = new Date();
    const startDate = new Date(endDate);

    startDate.setDate(endDate.getDate() - 3);

    return {
        startDate: formatDateInputValue(startDate),
        endDate: formatDateInputValue(endDate),
    };
}

/*
 * モック用のページ入口です。
 * このページだけが仮データを作り、共通表示コンポーネントの JapanQuakeWaveMap に渡します。
 * 地図表示コンポーネント名には Mock を含めず、Mock はページとデータ作成側に限定します。
 */
export default function JapanQuakeWaveMapMockPage() {
    const [pinDisplayLimit, setPinDisplayLimit] = useState(PIN_DISPLAY_LIMIT_INITIAL);
    const [selectedIntensities, setSelectedIntensities] = useState<QuakeIntensityKey[]>(quakeIntensityKeys);
    const [dateRange, setDateRange] = useState<QuakeDateRange>(() => dateRangeFromToday());
    const [mockRefreshCount, setMockRefreshCount] = useState(0);
    const visibleMockPins = useMemo(() => {
        /*
         * モック側だけで震度フィルター、震度順ソート、同震度内の新しい順ソート、件数制限を行います。
         * Inertia 再取得、DB条件、Repository/Service/Action には触れず、操作感確認に閉じています。
         */
        const selectedSet = new Set(selectedIntensities);

        const filteredPins = mockPins.filter((pin) => selectedSet.has(quakeIntensityKey(pin.maxIntensity)));

        return pickVisibleMockPins(filteredPins, selectedIntensities, pinDisplayLimit);
    }, [pinDisplayLimit, selectedIntensities]);
    const mockRefreshStatus = mockRefreshCount === 0
        ? 'モック更新UIの配置確認中です'
        : `モック更新UIを${mockRefreshCount}回操作しました`;

    return (
        <PublicLayout className="px-5 py-8 sm:px-8 lg:px-10">
            <Head title="QuakeWave Map Mock" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 pb-12 pt-4 sm:pt-8">
                <header className="flex items-center justify-between gap-4">
                    <Link
                        href="/quakewave-preview"
                        className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        QuakeWave Preview
                    </Link>
                    <Link
                        href="/quakewave-preview/map"
                        className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-950/70 backdrop-blur-xl transition hover:bg-cyan-50/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        DB Map
                    </Link>
                </header>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <article className="rounded-lg border border-white/20 bg-slate-950/52 p-5 text-white shadow-[0_18px_42px_rgba(2,24,45,0.18)] backdrop-blur-md">
                        <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                            Parts Mock
                        </span>
                        <h1 className="mt-3 text-2xl font-semibold">ピン表示</h1>
                        <p className="mt-3 text-sm leading-6 text-cyan-50/76">
                            地図に載せる前の震源ピン部品を、震度別のサイズと色で確認します。
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {mockPinParts.map((pin) => (
                                <EarthquakePin key={`${pin.label}-${pin.sizeLabel}`} pin={pin} />
                            ))}
                        </div>
                    </article>

                    <article className="rounded-lg border border-white/20 bg-slate-950/52 p-5 text-white shadow-[0_18px_42px_rgba(2,24,45,0.18)] backdrop-blur-md">
                        <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                            Parts Mock
                        </span>
                        <h2 className="mt-3 text-2xl font-semibold">波紋レイヤー</h2>
                        <p className="mt-3 text-sm leading-6 text-cyan-50/76">
                            地図に載せる前の波紋部品を、震度別の大きさ・速度・リング数で確認します。
                        </p>
                        <div className="mt-5 grid gap-5">
                            {mockRippleParts.map((ripple) => (
                                <EarthquakeRipple key={`${ripple.label}-${ripple.ringCount}`} ripple={ripple} />
                            ))}
                        </div>
                    </article>
                </section>

                <JapanQuakeWaveMap
                    pins={visibleMockPins}
                    eyebrow="QuakeWave Mock"
                    title="地図全体モック"
                    summary="仮データの日本地図に、表示件数・日付範囲・震度スイッチ・詳細折りたたみを重ねて操作感を確認します。"
                    mapOverlay={(
                        <PinDisplayLimitSlider
                            value={pinDisplayLimit}
                            availablePinCount={mockPins.length}
                            onChange={setPinDisplayLimit}
                        />
                    )}
                    mapTopContent={(
                        <QuakeDateRangeFilter
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    )}
                    controlPanelsBeforeLayers={(
                        <QuakeIntensitySwitchFilter
                            selectedIntensities={selectedIntensities}
                            onChange={setSelectedIntensities}
                        />
                    )}
                    refreshAction={{
                        buttonLabel: '地図データ更新',
                        disabledLabel: '更新中',
                        statusLabel: mockRefreshStatus,
                        description: `モックでは再取得せず、選択中の日付範囲 ${dateRange.startDate || '未指定'} - ${dateRange.endDate || '未指定'} と配置だけを確認します。`,
                        isRefreshing: false,
                        errorMessage: null,
                        onRefresh: () => setMockRefreshCount((current) => current + 1),
                    }}
                    refreshPanelPlacement="controls"
                    detailPanelPlacement="below"
                    detailPanelCollapsible
                    detailPanelDefaultOpen={false}
                />
            </div>
        </PublicLayout>
    );
}
