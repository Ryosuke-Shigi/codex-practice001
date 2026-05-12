import { Head, Link } from '@inertiajs/react';

import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import PublicLayout from '@/Layouts/PublicLayout';

type QuakeWaveMapPageProps = {
    pins: EarthquakeMapPin[];
};

/*
 * DB pins 用のページ入口です。
 * Controller -> QueryAction -> Repository -> Responder で組み立てた Inertia props を受け取り、
 * 共通表示コンポーネントの JapanQuakeWaveMap に渡します。ここでは仮データを作りません。
 */
export default function QuakeWaveMapPage({ pins }: QuakeWaveMapPageProps) {
    return (
        <PublicLayout className="px-5 py-8 sm:px-8 lg:px-10">
            <Head title="QuakeWave Map" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 pb-12 pt-4 sm:pt-8">
                <header className="flex items-center justify-between gap-4">
                    <Link
                        href="/lab"
                        className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        Lab
                    </Link>
                    <Link
                        href="/quakewave-preview"
                        className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-950/70 backdrop-blur-xl transition hover:bg-cyan-50/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        Preview Tools
                    </Link>
                </header>

                <JapanQuakeWaveMap
                    pins={pins}
                    eyebrow="QuakeWave Map"
                    title="地震情報可視化"
                    summary="DBに保存済みの地震情報を日本地図上へ重ね、震源・震度・波紋を確認します。"
                    sourceLabel="earthquake_map_pins"
                />
            </div>
        </PublicLayout>
    );
}
