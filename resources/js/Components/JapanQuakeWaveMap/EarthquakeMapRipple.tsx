import type { CSSProperties } from 'react';

type EarthquakeMapRippleVisual = {
    color: string;
    ringCount: number;
    rippleSize: number;
    durationSeconds: number;
};

type EarthquakeMapRippleProps = {
    eventKey: string;
    xPercent: number;
    yPercent: number;
    visual: EarthquakeMapRippleVisual;
};

export default function EarthquakeMapRipple({
    eventKey,
    xPercent,
    yPercent,
    visual,
}: EarthquakeMapRippleProps) {
    /*
     * Ripple は地図上の波紋表示だけを担当します。
     * 震度別の ringCount / size / duration は親で決め、ここでは同じ中心から
     * 複数リングを時間差で広げます。
     *
     * eventKey を key 文字列に含めることで、同じ地図上に複数 pin があっても
     * React の差分更新で別イベントの波紋が混ざらないようにします。
     */
    const style = {
        left: `${xPercent}%`,
        top: `${yPercent}%`,
    } as CSSProperties;

    return (
        <div className="pointer-events-none absolute z-10" style={style} aria-hidden="true">
            {Array.from({ length: visual.ringCount }).map((_, index) => (
                <span
                    key={`${eventKey}-ripple-${index}`}
                    className="quake-map-db-ripple absolute left-1/2 top-1/2 rounded-full border"
                    style={{
                        animation: `quake-map-db-ripple ${visual.durationSeconds}s cubic-bezier(0.16, 1, 0.3, 1) infinite`,
                        animationDelay: `${index * -(visual.durationSeconds / visual.ringCount)}s`,
                        borderColor: visual.color,
                        boxShadow: `0 0 26px ${visual.color}55`,
                        height: visual.rippleSize,
                        width: visual.rippleSize,
                    }}
                />
            ))}
        </div>
    );
}
