import { useState } from 'react';
import { motion } from 'motion/react';

import JapanSimpleMap from '@/Components/JapanQuakeWaveMap/JapanSimpleMap';
import MapLayerControlPanel, {
    type MapLayerVisibility,
} from '@/Components/JapanQuakeWaveMap/MapLayerControlPanel';

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

type JapanQuakeWaveMapProps = {
    pins: EarthquakeMapPin[];
    eyebrow?: string;
    title?: string;
    summary?: string;
    sourceLabel?: string;
};

const defaultLayerVisibility: MapLayerVisibility = {
    showPins: true,
    showRipples: true,
    showIntensityLabels: true,
    showPlateBoundaries: true,
};

/*
 * JapanQuakeWaveMap は QuakeWave の共通地図表示コンポーネントです。
 * 保存済み earthquake_map_pins を受け取り、日本地図・ピン・波紋・詳細表示の
 * 子コンポーネントへ渡します。DB取得や同期開始の責務は持ちません。
 *
 * 本番用ページもモック用ページもこのコンポーネントを使います。
 * Mock という概念はページやデータ作成側に閉じ込め、地図表示の責務はここへ集めます。
 */
export default function JapanQuakeWaveMap({
    pins,
    eyebrow = 'QuakeWave Preview',
    title = '地震情報可視化',
    summary = '取得済みの地震情報を日本地図上へ重ね、震度に応じたピンと波紋で確認します。',
    sourceLabel = 'earthquake_map_pins',
}: JapanQuakeWaveMapProps) {
    /*
     * レイヤー表示状態は画面表示だけの状態として、このコンポーネント内に閉じます。
     * DB保存済み pins の取得条件や Repository には影響させず、地図・ピン・波紋・
     * プレート境界線を独立した表示レイヤーとして扱います。
     */
    const [layers, setLayers] = useState<MapLayerVisibility>(defaultLayerVisibility);

    return (
        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
            <motion.div
                className="max-w-2xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
            >
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-950/70">
                    {eyebrow}
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.35)] sm:text-6xl">
                    {title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-cyan-50/90 drop-shadow-[0_8px_22px_rgba(2,24,45,0.2)]">
                    {summary}
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
                            {sourceLabel}
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="relative flex min-h-[520px] flex-col gap-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.8, ease: 'easeOut' }}
            >
                <div className="relative overflow-hidden rounded-lg border border-white/30 bg-slate-950/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_26px_70px_rgba(2,24,45,0.25)] backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/18 to-transparent" />
                    <div className="relative h-full min-h-[520px] p-4 sm:p-6">
                        <JapanSimpleMap pins={pins} layers={layers} />
                    </div>
                </div>

                <MapLayerControlPanel layers={layers} onChange={setLayers} />
            </motion.div>
        </section>
    );
}
