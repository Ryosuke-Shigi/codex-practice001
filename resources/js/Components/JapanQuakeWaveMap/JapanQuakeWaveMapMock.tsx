import { motion } from 'motion/react';

import JapanSimpleMap from '@/Components/JapanQuakeWaveMap/JapanSimpleMap';

export type EarthquakeMapPin = {
    eventId: string;
    title: string;
    latitude: number;
    longitude: number;
    occurredAt: string;
    maxIntensity: string;
    magnitude: number | null;
    depthKm: number | null;
    areaName: string;
    headline: string;
};

type JapanQuakeWaveMapMockProps = {
    pins: EarthquakeMapPin[];
};

/*
 * JapanQuakeWaveMapMock は MAP 表示モックの画面構成だけを担当します。
 * タイトル、説明、地図表示エリアを束ねますが、地震API接続、DB保存、
 * pin の描画、波紋アニメーション、凡例、詳細パネルはまだ持ちません。
 *
 * pins は子コンポーネントへ渡すだけにしておくことで、次段階で
 * 「Laravel DTO -> Inertia props -> React map layer」の流れを差し込みやすくします。
 */
export default function JapanQuakeWaveMapMock({ pins }: JapanQuakeWaveMapMockProps) {
    return (
        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
            <motion.div
                className="max-w-2xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
            >
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-950/70">
                    Lab Mock
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.35)] sm:text-6xl">
                    JapanQuakeWaveMap
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-cyan-50/90 drop-shadow-[0_8px_22px_rgba(2,24,45,0.2)]">
                    水面の上に日本列島を浮かべる、地震波可視化画面の初期モックです。
                </p>
            </motion.div>

            <motion.div
                className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/30 bg-slate-950/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_26px_70px_rgba(2,24,45,0.25)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.8, ease: 'easeOut' }}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/18 to-transparent" />
                <div className="relative h-full min-h-[520px] p-4 sm:p-6">
                    <JapanSimpleMap pins={pins} />
                </div>
            </motion.div>
        </section>
    );
}
