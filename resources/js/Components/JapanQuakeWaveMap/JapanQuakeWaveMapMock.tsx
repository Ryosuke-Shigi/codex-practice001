import { motion } from 'motion/react';

import JapanSimpleMap from '@/Components/JapanQuakeWaveMap/JapanSimpleMap';

export type EarthquakeMapPin = {
    eventId: string | null;
    sourceEntryId: number;
    title: string | null;
    areaName: string | null;
    headline: string | null;
    rawCoordinate: string | null;
    latitude: string | null;
    longitude: string | null;
    depthMeter: number | null;
    magnitude: string | null;
    maxIntensity: string | null;
    occurredAt: string | null;
    reportedAt: string | null;
    comment: string | null;
};

type JapanQuakeWaveMapMockProps = {
    pins: EarthquakeMapPin[];
};

/*
 * JapanQuakeWaveMapMock は MAP 表示画面の大枠だけを担当します。
 * 保存済み earthquake_map_pins を受け取り、日本地図・ピン・波紋・詳細表示の
 * 子コンポーネントへ渡します。DB取得や同期開始の責務は持ちません。
 *
 * まだ本番マップへの接続段階なので、文言は「取得済み地震情報」に留め、
 * リアルタイム性や通知のような未実装の期待を出さないようにします。
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
                    QuakeWave Preview
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.35)] sm:text-6xl">
                    地震情報可視化
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-cyan-50/90 drop-shadow-[0_8px_22px_rgba(2,24,45,0.2)]">
                    DBに保存済みの地震情報を日本地図上へ重ね、震度に応じたピンと波紋で確認します。
                </p>

                <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/25 bg-slate-950/24 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                            pins
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">{pins.length}</p>
                    </div>
                    <div className="rounded-lg border border-white/25 bg-slate-950/24 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                            source
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-white">
                            earthquake_map_pins
                        </p>
                    </div>
                </div>
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
