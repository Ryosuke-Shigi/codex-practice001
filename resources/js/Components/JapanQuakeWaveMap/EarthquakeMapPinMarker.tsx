import type { CSSProperties } from 'react';

import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';

type EarthquakeMapPinMarkerVisual = {
    color: string;
    label: string;
    markerSize: number;
    fontClassName: string;
};

type EarthquakeMapPinMarkerProps = {
    pin: EarthquakeMapPin;
    displayOrder: number;
    xPercent: number;
    yPercent: number;
    visual: EarthquakeMapPinMarkerVisual;
    selected: boolean;
    showIntensityLabel: boolean;
    onSelect: (pin: EarthquakeMapPin) => void;
};

export default function EarthquakeMapPinMarker({
    pin,
    displayOrder,
    xPercent,
    yPercent,
    visual,
    selected,
    showIntensityLabel,
    onSelect,
}: EarthquakeMapPinMarkerProps) {
    /*
     * Marker は地図上のクリック可能な点だけを描きます。
     * x/y は親の JapanSimpleMap が緯度経度から計算済みで受け取り、ここでは
     * 震度由来の色・サイズとクリック選択だけに責務を絞ります。
     *
     * button にしているのは、マウスクリックだけでなくキーボード操作でも詳細パネルを
     * 開けるようにするためです。aria-pressed は現在選択中の pin を支援技術へ伝えます。
     */
    const style = {
        '--quake-pin-color': visual.color,
        left: `${xPercent}%`,
        top: `${yPercent}%`,
    } as CSSProperties;

    return (
        <button
            type="button"
            className="pointer-events-auto absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
            style={style}
            aria-label={`${pin.areaName ?? pin.title ?? '地震情報'} ${visual.label} を表示`}
            aria-pressed={selected}
            onClick={() => onSelect(pin)}
        >
            <span
                className="absolute rotate-45 border border-white/85"
                style={{
                    backgroundColor: visual.color,
                    borderRadius: '50% 50% 50% 0',
                    boxShadow: selected
                        ? `0 0 0 7px ${visual.color}30, 0 0 28px ${visual.color}aa`
                        : `0 0 22px ${visual.color}88`,
                    height: visual.markerSize,
                    width: visual.markerSize,
                }}
                aria-hidden="true"
            />
            {showIntensityLabel && (
                <span
                    className={`relative flex items-center justify-center font-bold leading-none text-slate-950 ${visual.fontClassName}`}
                    style={{
                        height: visual.markerSize,
                        width: visual.markerSize,
                    }}
                >
                    {pin.maxIntensity ?? '?'}
                </span>
            )}
            {showIntensityLabel && (
                <span className="absolute left-1/2 top-[calc(50%+18px)] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/45 bg-slate-950/58 px-2 py-0.5 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(2,24,45,0.28)]">
                    #{displayOrder} {visual.label}
                </span>
            )}
        </button>
    );
}
