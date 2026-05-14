import { useState, type ReactNode } from 'react';
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
    mapOverlay?: ReactNode;
    refreshAction?: {
        buttonLabel: string;
        disabledLabel: string;
        statusLabel: string;
        description: string;
        isRefreshing: boolean;
        errorMessage: string | null;
        onRefresh: () => void;
    };
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
    mapOverlay,
    refreshAction,
}: JapanQuakeWaveMapProps) {
    /*
     * レイヤー表示状態は画面表示だけの状態として、このコンポーネント内に閉じます。
     * DB保存済み pins の取得条件や Repository には影響させず、地図・ピン・波紋・
     * プレート境界線を独立した表示レイヤーとして扱います。
     */
    const [layers, setLayers] = useState<MapLayerVisibility>(defaultLayerVisibility);
    const [isRefreshPanelOpen, setIsRefreshPanelOpen] = useState(false);

    return (
        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(520px,1.28fr)]">
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

                {refreshAction && (
                    <div className="mt-6 max-w-xl rounded-lg border border-white/25 bg-slate-950/24 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-white">
                                    地図データ更新
                                </h2>
                                <p role="status" aria-live="polite" className="mt-2 text-sm font-semibold leading-6 text-white">
                                    {refreshAction.statusLabel}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-expanded={isRefreshPanelOpen}
                                onClick={() => setIsRefreshPanelOpen((current) => !current)}
                                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-cyan-100/45 bg-cyan-100/18 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/28 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/55 disabled:cursor-wait disabled:opacity-60"
                            >
                                {isRefreshPanelOpen ? '閉じる' : '開く'}
                            </button>
                        </div>

                        {isRefreshPanelOpen && (
                            <div className="mt-4 border-t border-white/15 pt-4">
                                <p className="text-sm font-semibold leading-6 text-white">
                                    {refreshAction.statusLabel}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-cyan-50/75">
                                    {refreshAction.description}
                                </p>
                                {refreshAction.errorMessage && (
                                    <p className="mt-3 rounded-md border border-rose-200/35 bg-rose-200/10 px-3 py-2 text-sm leading-6 text-rose-50">
                                        {refreshAction.errorMessage}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={refreshAction.onRefresh}
                                    disabled={refreshAction.isRefreshing}
                                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-100/45 bg-cyan-100/18 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/28 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/55 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {refreshAction.isRefreshing ? refreshAction.disabledLabel : refreshAction.buttonLabel}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {pins.length === 0 && (
                    <div className="mt-6 max-w-xl rounded-lg border border-white/25 bg-slate-950/24 p-4 text-sm font-semibold leading-6 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
                        保存済みの地震ピンはありません。
                    </div>
                )}
            </motion.div>

            <motion.div
                className="relative flex min-h-[520px] flex-col gap-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.8, ease: 'easeOut' }}
            >
                <div className="relative overflow-hidden rounded-lg border border-white/30 bg-slate-950/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_26px_70px_rgba(2,24,45,0.25)] backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/18 to-transparent" />
                    {/*
                        mapOverlay は、地図コンテナ基準で重ねる操作UIの差し込み口です。
                        JapanQuakeWaveMap 自体は DB pins の取得条件や件数制限を持たないため、
                        表示件数スライダーの state と絞り込み処理は呼び出し元ページに置きます。
                    */}
                    {mapOverlay}
                    <div className="relative h-full min-h-[520px] p-4 sm:p-6">
                        <JapanSimpleMap pins={pins} layers={layers} />
                    </div>
                </div>

                <MapLayerControlPanel layers={layers} onChange={setLayers} />
            </motion.div>
        </section>
    );
}
