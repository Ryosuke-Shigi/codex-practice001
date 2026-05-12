import { Head, Link } from '@inertiajs/react';

import EarthquakePin, {
    type EarthquakePinPreview,
} from '@/Components/JapanQuakeWaveMap/EarthquakePin';
import EarthquakeRipple, {
    type EarthquakeRipplePreview,
} from '@/Components/JapanQuakeWaveMap/EarthquakeRipple';
import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import PublicLayout from '@/Layouts/PublicLayout';

const mockPins: EarthquakeMapPin[] = [
    {
        eventId: 'mock-001',
        sourceEntryId: 1,
        title: '震源・震度情報',
        areaName: '青森県東方沖',
        headline: '仮データによる地震情報表示です。',
        rawCoordinate: '+41.0+142.5-50000/',
        latitude: '41.0000000',
        longitude: '142.5000000',
        depthMeter: 50000,
        magnitude: '4.0',
        maxIntensity: '2',
        occurredAt: '2026-05-11T11:27:00+09:00',
        reportedAt: '2026-05-11T11:31:00+09:00',
        comment: 'モック用の表示確認データです。',
    },
    {
        eventId: 'mock-002',
        sourceEntryId: 2,
        title: '震源・震度情報',
        areaName: '紀伊水道',
        headline: '仮データによる地震情報表示です。',
        rawCoordinate: '+33.8+135.1-30000/',
        latitude: '33.8000000',
        longitude: '135.1000000',
        depthMeter: 30000,
        magnitude: '5.1',
        maxIntensity: '4',
        occurredAt: '2026-05-11T10:42:00+09:00',
        reportedAt: '2026-05-11T10:46:00+09:00',
        comment: 'モック用の表示確認データです。',
    },
    {
        eventId: 'mock-003',
        sourceEntryId: 3,
        title: '震源・震度情報',
        areaName: '日向灘',
        headline: '仮データによる地震情報表示です。',
        rawCoordinate: '+32.1+132.1-20000/',
        latitude: '32.1000000',
        longitude: '132.1000000',
        depthMeter: 20000,
        magnitude: '6.0',
        maxIntensity: '5-',
        occurredAt: '2026-05-11T09:12:00+09:00',
        reportedAt: '2026-05-11T09:16:00+09:00',
        comment: 'モック用の表示確認データです。',
    },
];

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

/*
 * モック用のページ入口です。
 * このページだけが仮データを作り、共通表示コンポーネントの JapanQuakeWaveMap に渡します。
 * 地図表示コンポーネント名には Mock を含めず、Mock はページとデータ作成側に限定します。
 */
export default function JapanQuakeWaveMapMockPage() {
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
                    pins={mockPins}
                    eyebrow="QuakeWave Mock"
                    title="地図全体モック"
                    summary="上の部品を仮データの日本地図に重ね、表示ON/OFFや詳細表示のまとまりを確認します。"
                />
            </div>
        </PublicLayout>
    );
}
