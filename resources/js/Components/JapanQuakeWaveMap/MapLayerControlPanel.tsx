import { useState } from 'react';

export type MapLayerVisibility = {
    showPins: boolean;
    showRipples: boolean;
    showIntensityLabels: boolean;
    showPlateBoundaries: boolean;
};

type MapLayerControlPanelProps = {
    layers: MapLayerVisibility;
    onChange: (layers: MapLayerVisibility) => void;
};

type LayerOption = {
    key: keyof MapLayerVisibility;
    label: string;
};

const layerOptions: LayerOption[] = [
    {
        key: 'showPins',
        label: '震源ピン',
    },
    {
        key: 'showRipples',
        label: '波紋',
    },
    {
        key: 'showIntensityLabels',
        label: '震度表示',
    },
    {
        key: 'showPlateBoundaries',
        label: 'プレート境界線',
    },
];

export default function MapLayerControlPanel({ layers, onChange }: MapLayerControlPanelProps) {
    /*
     * MapLayerControlPanel は地図表示レイヤーのON/OFFだけを担当します。
     * チェック状態は React の表示状態であり、earthquake_map_pins の取得条件や
     * DB保存処理には影響させません。プレート境界線も静的な地図レイヤーとして扱います。
     */
    const [isOpen, setIsOpen] = useState(false);
    const activeLayerCount = layerOptions.filter((option) => layers[option.key]).length;

    return (
        <section className="w-full min-w-0 rounded-lg border border-white/25 bg-slate-950/28 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/72">
                    MAP LAYERS
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-cyan-100/35 bg-cyan-100/12 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                        ON {activeLayerCount}件
                    </span>
                    <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen((current) => !current)}
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/70"
                    >
                        {isOpen ? '閉じる' : '開く'}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {layerOptions.map((option) => (
                        <label
                            key={option.key}
                            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-white/15 bg-white/10 px-3 py-2 transition hover:bg-white/15"
                        >
                            <input
                                type="checkbox"
                                checked={layers[option.key]}
                                onChange={(event) => onChange({
                                    ...layers,
                                    [option.key]: event.currentTarget.checked,
                                })}
                                className="h-4 w-4 accent-cyan-300"
                            />
                            <span className="text-sm font-semibold leading-5 text-white">
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </section>
    );
}
