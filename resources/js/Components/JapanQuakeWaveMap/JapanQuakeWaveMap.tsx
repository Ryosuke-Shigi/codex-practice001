/**
 * Japan Quake Wave Map の共通地図表示 Component です。
 *
 * 保存済み pin props を地図・レイヤー・詳細表示へ渡し、DB取得、同期開始、pin生成可否判断は呼び出し元へ分けます。
 */
import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

import EarthquakeMapDetailPanel from '@/Components/JapanQuakeWaveMap/EarthquakeMapDetailPanel';
import JapanSimpleMap from '@/Components/JapanQuakeWaveMap/JapanSimpleMap';
import MapLayerControlPanel, {
    type MapLayerVisibility,
} from '@/Components/JapanQuakeWaveMap/MapLayerControlPanel';
import MapRefreshPanel, {
    type MapRefreshAction,
} from '@/Components/JapanQuakeWaveMap/MapRefreshPanel';

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
    mapTopContent?: ReactNode;
    controlPanelsBeforeLayers?: ReactNode;
    controlPanelsAfterLayers?: ReactNode;
    refreshAction?: MapRefreshAction;
    refreshPanelPlacement?: 'description' | 'controls';
    detailPanelPlacement?: 'side' | 'below';
    detailPanelCollapsible?: boolean;
    detailPanelDefaultOpen?: boolean;
};

const defaultLayerVisibility: MapLayerVisibility = {
    showPins: true,
    showRipples: true,
    showIntensityLabels: true,
    showPlateBoundaries: true,
};

function pinIdentity(pin: EarthquakeMapPin | null) {
    if (!pin) {
        return 'none';
    }

    return `${pin.eventId ?? 'no-event'}:${pin.sourceEntryId}`;
}

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
    mapTopContent,
    controlPanelsBeforeLayers,
    controlPanelsAfterLayers,
    refreshAction,
    refreshPanelPlacement = 'description',
    detailPanelPlacement = 'side',
    detailPanelCollapsible = false,
    detailPanelDefaultOpen = true,
}: JapanQuakeWaveMapProps) {
    /*
     * レイヤー表示状態は画面表示だけの状態として、このコンポーネント内に閉じます。
     * DB保存済み pins の取得条件や Repository には影響させず、地図・ピン・波紋・
     * プレート境界線を独立した表示レイヤーとして扱います。
     */
    const [layers, setLayers] = useState<MapLayerVisibility>(defaultLayerVisibility);
    const [selectedPin, setSelectedPin] = useState<EarthquakeMapPin | null>(pins[0] ?? null);

    useEffect(() => {
        if (pins.length === 0) {
            setSelectedPin(null);
            return;
        }

        const selectedKey = pinIdentity(selectedPin);
        const selectedStillVisible = pins.some((pin) => pinIdentity(pin) === selectedKey);

        if (!selectedStillVisible) {
            setSelectedPin(pins[0]);
        }
    }, [pins, selectedPin]);

    /*
     * モバイル幅では、Grid/Flex の子要素が自身の内容幅を優先して親を押し広げることがあります。
     * 地図・詳細・コントロールはどれもカード内に収まるべき表示部品なので、共通ラッパー側で
     * w-full / min-w-0 を徹底し、震度フィルターや日付入力の内容幅がページ全体の横スクロールに
     * つながらないようにします。
     */
    const mapAndDetailClassName = detailPanelPlacement === 'below'
        ? 'grid h-full min-h-[430px] w-full min-w-0 gap-4 sm:min-h-[472px]'
        : 'grid h-full min-h-[430px] w-full min-w-0 gap-4 sm:min-h-[472px] lg:grid-cols-[minmax(0,1fr)_280px]';

    return (
        /*
         * 右カラムに固定の最小幅を置くとスマホ表示で必ずはみ出すため、右側も minmax(0, ...)
         * にして親幅へ収縮できるようにします。実際の余白や視認性は内側のカード padding と
         * min-height で調整します。
         */
        <section className="grid w-full min-w-0 flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <motion.div
                className="w-full max-w-2xl min-w-0"
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

                {refreshAction && refreshPanelPlacement === 'description' && (
                    <div className="mt-6 max-w-xl">
                        <MapRefreshPanel action={refreshAction} />
                    </div>
                )}

                {pins.length === 0 && (
                    <div className="mt-6 max-w-xl rounded-lg border border-white/25 bg-slate-950/24 p-4 text-sm font-semibold leading-6 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
                        保存済みの地震ピンはありません。
                    </div>
                )}
            </motion.div>

            <motion.div
                className="relative flex min-h-[430px] w-full min-w-0 flex-col gap-4 sm:min-h-[520px]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.8, ease: 'easeOut' }}
            >
                {mapTopContent}

                <div className="relative w-full min-w-0 overflow-hidden rounded-lg border border-white/30 bg-slate-950/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_26px_70px_rgba(2,24,45,0.25)] backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/18 to-transparent" />
                    {/*
                        mapOverlay は、地図コンテナ基準で重ねる操作UIの差し込み口です。
                        JapanQuakeWaveMap 自体は DB pins の取得条件や件数制限を持たないため、
                        表示件数スライダーの state と絞り込み処理は呼び出し元ページに置きます。
                    */}
                    {mapOverlay}
                    {/*
                        地図は主役なのでスマホでも高さを確保しますが、520px固定だと下の操作パネルが
                        遠くなりすぎます。小さい画面だけ430pxへ落とし、sm以上では従来の余白感を保ちます。
                    */}
                    <div className="relative h-full min-h-[430px] w-full min-w-0 p-3 sm:min-h-[520px] sm:p-6">
                        <div className={mapAndDetailClassName}>
                            <JapanSimpleMap
                                pins={pins}
                                layers={layers}
                                selectedPin={selectedPin}
                                onSelectPin={setSelectedPin}
                            />
                            <EarthquakeMapDetailPanel
                                pin={selectedPin}
                                collapsible={detailPanelCollapsible}
                                defaultOpen={detailPanelDefaultOpen}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex w-full min-w-0 flex-col gap-4">
                    {controlPanelsBeforeLayers}
                    <MapLayerControlPanel layers={layers} onChange={setLayers} />
                    {refreshAction && refreshPanelPlacement === 'controls' && (
                        <MapRefreshPanel action={refreshAction} />
                    )}
                    {controlPanelsAfterLayers}
                </div>
            </motion.div>
        </section>
    );
}
