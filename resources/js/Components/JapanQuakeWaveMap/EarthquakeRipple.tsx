export type EarthquakeRipplePreview = {
    label: string;
    maxIntensity: string;
    color: string;
    size: number;
    duration: string;
    ringCount: number;
};

type EarthquakeRippleProps = {
    ripple: EarthquakeRipplePreview;
};

export default function EarthquakeRipple({ ripple }: EarthquakeRippleProps) {
    /*
     * 波紋もプレビュー専用のアニメーション見本です。
     * 実際の地震発生時刻や XML entry には接続せず、DTO から渡された見た目の候補だけを表示します。
     */
    const rings = Array.from({ length: ripple.ringCount });
    const durationSeconds = Number.parseFloat(ripple.duration);
    const ringDelaySeconds = durationSeconds / Math.max(ripple.ringCount, 1);

    return (
        <div className="flex min-w-0 items-center gap-4">
            <style>
                {`
                    @keyframes quake-wave-preview-spread {
                        0% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.18);
                        }
                        12% {
                            opacity: 0.72;
                        }
                        72% {
                            opacity: 0.28;
                        }
                        100% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(1);
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .quake-wave-preview-ring {
                            animation: none !important;
                            opacity: 0.42 !important;
                            transform: translate(-50%, -50%) scale(0.78) !important;
                        }
                    }
                `}
            </style>
            <span
                className="relative shrink-0"
                style={{ height: ripple.size, width: ripple.size }}
                aria-hidden="true"
            >
                {rings.map((_, index) => {
                    const strokeWidth = index === 0 ? 2 : 1;

                    return (
                        <span
                            key={`${ripple.label}-${index}`}
                            className="quake-wave-preview-ring absolute left-1/2 top-1/2 rounded-full border"
                            style={{
                                animation: `quake-wave-preview-spread ${ripple.duration} cubic-bezier(0.16, 1, 0.3, 1) infinite`,
                                animationDelay: `${index * -ringDelaySeconds}s`,
                                animationFillMode: 'both',
                                borderColor: ripple.color,
                                borderWidth: strokeWidth,
                                boxShadow: `0 0 20px ${ripple.color}44`,
                                height: ripple.size,
                                width: ripple.size,
                            }}
                        />
                    );
                })}
                <span
                    className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
                    style={{ backgroundColor: ripple.color, boxShadow: `0 0 18px ${ripple.color}88` }}
                />
            </span>

            <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{ripple.label}</span>
                <span className="block text-xs leading-5 text-slate-200/70">
                    max {ripple.maxIntensity} / {ripple.ringCount} rings / {ripple.duration}
                </span>
            </span>
        </div>
    );
}
