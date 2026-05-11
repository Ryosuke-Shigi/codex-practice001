export type EarthquakePinPreview = {
    label: string;
    maxIntensity: string;
    color: string;
    sizeLabel: string;
};

type EarthquakePinProps = {
    pin: EarthquakePinPreview;
};

function pinPixelSize(sizeLabel: string) {
    if (sizeLabel === 'large') {
        return 20;
    }

    if (sizeLabel === 'small') {
        return 14;
    }

    return 17;
}

function intensityFontSize(sizeLabel: string) {
    if (sizeLabel === 'large') {
        return 10;
    }

    if (sizeLabel === 'small') {
        return 8;
    }

    return 9;
}

export default function EarthquakePin({ pin }: EarthquakePinProps) {
    /*
     * このコンポーネントは QuakeWave Preview の見本表示用です。
     * 位置計算や地図上の absolute 配置はまだ持たせず、DTO 由来の色とサイズだけを描画します。
     */
    const pinSize = pinPixelSize(pin.sizeLabel);
    const fontSize = intensityFontSize(pin.sizeLabel);

    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <span
                    className="rotate-45 border border-white/70"
                    style={{
                        backgroundColor: pin.color,
                        borderRadius: '50% 50% 50% 0',
                        boxShadow: `0 0 14px ${pin.color}66`,
                        height: pinSize,
                        width: pinSize,
                    }}
                    aria-hidden="true"
                />
                <span
                    className="absolute flex items-center justify-center font-bold leading-none text-slate-950"
                    style={{
                        fontSize,
                        height: pinSize,
                        width: pinSize,
                    }}
                    aria-hidden="true"
                >
                    {pin.maxIntensity}
                </span>
            </span>

            <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{pin.label}</span>
                <span className="block text-xs leading-5 text-slate-200/70">
                    max {pin.maxIntensity} / {pin.sizeLabel}
                </span>
            </span>
        </div>
    );
}
