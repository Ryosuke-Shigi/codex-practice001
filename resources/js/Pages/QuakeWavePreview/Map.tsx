import { Head, Link } from '@inertiajs/react';

import JapanQuakeWaveMapMock, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMapMock';
import PublicLayout from '@/Layouts/PublicLayout';

type MapProps = {
    pins: EarthquakeMapPin[];
};

/*
 * MAP 表示モックの Inertia ページです。
 * ここでは PublicLayout とページ導線だけを担当し、地図の見た目は
 * JapanQuakeWaveMapMock / JapanSimpleMap 側へ分けます。
 *
 * pins は第1段階では空配列ですが、将来 Laravel 側 DTO から渡される
 * 地震ピンデータをそのまま受け取れる props として残しています。
 */
export default function Map({ pins }: MapProps) {
    return (
        <PublicLayout className="px-5 py-8 sm:px-8 lg:px-10">
            <Head title="QuakeWave MAP表示" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 pb-12 pt-4 sm:pt-8">
                <header className="flex items-center justify-between gap-4">
                    <Link
                        href="/quakewave-preview"
                        className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        QuakeWave Preview
                    </Link>
                    <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-950/70 backdrop-blur-xl">
                        MAP表示
                    </span>
                </header>

                <JapanQuakeWaveMapMock pins={pins} />
            </div>
        </PublicLayout>
    );
}
