/**
 * QuakeWave map の表示件数を調整する slider Component です。
 *
 * 取得済み pins の描画件数だけを変え、Repository の limit や同期対象件数には影響させません。
 */
export const PIN_DISPLAY_LIMIT_MIN = 5;
export const PIN_DISPLAY_LIMIT_MAX = 45;
export const PIN_DISPLAY_LIMIT_INITIAL = 10;
export const PIN_DISPLAY_LIMIT_STEP = 1;

type PinDisplayLimitSliderProps = {
    value: number;
    availablePinCount?: number;
    onChange: (value: number) => void;
};

export default function PinDisplayLimitSlider({
    value,
    availablePinCount,
    onChange,
}: PinDisplayLimitSliderProps) {
    /*
     * PinDisplayLimitSlider は表示件数を選ぶための UI 部品です。
     * 地震データの取得、並び順、ピン座標変換、地図への描画判断は親コンポーネント側に残し、
     * ここでは「現在値を表示する」「range の変更値を number として返す」だけに責務を絞ります。
     *
     * currentValue を min/max に丸めているのは、親から範囲外の値が渡っても UI 表示だけで破綻しない
     * ようにするためです。実際の表示件数制限は親側の slice で行います。
     *
     * スライダーは地図の上に重なるため、スマホ幅ではPCと同じ高さ・幅にしません。
     * left/top、パネル幅、縦レール長をひと回り小さくし、地図の視認性を残したまま件数変更だけは
     * 片手でも操作できるサイズにしています。sm以上は従来に近い大きさへ戻します。
     */
    const effectiveMax = Math.min(
        PIN_DISPLAY_LIMIT_MAX,
        Math.max(PIN_DISPLAY_LIMIT_MIN, availablePinCount ?? PIN_DISPLAY_LIMIT_MAX),
    );
    const currentValue = Math.min(effectiveMax, Math.max(PIN_DISPLAY_LIMIT_MIN, value));

    return (
        <div className="absolute left-2 top-3 z-30 flex min-h-[300px] w-16 flex-col items-center gap-3 rounded-lg border border-white/35 bg-slate-950/72 px-2 py-3 text-white shadow-[0_18px_44px_rgba(2,24,45,0.28)] backdrop-blur-md sm:left-4 sm:top-6 sm:min-h-[396px] sm:w-20 sm:gap-4 sm:px-2.5 sm:py-4">
            <style>
                {`
                    .pin-display-limit-slider {
                        appearance: none;
                        background: transparent;
                    }

                    .pin-display-limit-slider::-webkit-slider-runnable-track {
                        height: 12px;
                        border: 1px solid rgba(207, 250, 254, 0.58);
                        border-radius: 9999px;
                        background: linear-gradient(90deg, rgba(14, 165, 233, 0.78), rgba(125, 211, 252, 0.92));
                        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.4);
                    }

                    .pin-display-limit-slider::-webkit-slider-thumb {
                        appearance: none;
                        width: 34px;
                        height: 34px;
                        margin-top: -12px;
                        border: 2px solid rgba(255, 255, 255, 0.92);
                        border-radius: 9999px;
                        background: #ecfeff;
                        box-shadow: 0 10px 24px rgba(2, 24, 45, 0.32), 0 0 0 6px rgba(103, 232, 249, 0.18);
                    }

                    .pin-display-limit-slider::-moz-range-track {
                        height: 12px;
                        border: 1px solid rgba(207, 250, 254, 0.58);
                        border-radius: 9999px;
                        background: linear-gradient(90deg, rgba(14, 165, 233, 0.78), rgba(125, 211, 252, 0.92));
                        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.4);
                    }

                    .pin-display-limit-slider::-moz-range-thumb {
                        width: 34px;
                        height: 34px;
                        border: 2px solid rgba(255, 255, 255, 0.92);
                        border-radius: 9999px;
                        background: #ecfeff;
                        box-shadow: 0 10px 24px rgba(2, 24, 45, 0.32), 0 0 0 6px rgba(103, 232, 249, 0.18);
                    }
                `}
            </style>

            <div className="text-center">
                <span className="block text-[10px] font-semibold leading-4 text-cyan-100/80 sm:text-[11px]">
                    表示件数
                </span>
                <output className="mt-1 block text-xl font-bold leading-none text-white sm:text-2xl">
                    {currentValue}件
                </output>
            </div>

            <div className="flex items-center gap-1.5">
                <div className="relative flex h-56 w-9 items-center justify-center sm:h-72 sm:w-11">
                    <input
                        type="range"
                        min={PIN_DISPLAY_LIMIT_MIN}
                        max={effectiveMax}
                        step={PIN_DISPLAY_LIMIT_STEP}
                        value={currentValue}
                        aria-label="地震ピン表示件数"
                        aria-orientation="vertical"
                        onChange={(event) => onChange(Number(event.currentTarget.value))}
                        className="pin-display-limit-slider absolute h-10 w-56 -rotate-90 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70 sm:w-72"
                    />
                </div>
                <div className="flex h-56 flex-col justify-between py-1 text-[10px] font-bold leading-none text-cyan-50/78 sm:h-72" aria-hidden="true">
                    <span>{effectiveMax}</span>
                    <span>{PIN_DISPLAY_LIMIT_MIN}</span>
                </div>
            </div>
        </div>
    );
}
