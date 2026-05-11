<?php

namespace App\DTO\Earthquake\Preview;

/**
 * QuakeWave Preview のカード内で確認するための波紋見本DTOです。
 *
 * まだ地図座標や発生時刻には接続せず、震度ごとの波紋表現を
 * React 側で確認するための表示用データだけを持ちます。
 */
final readonly class EarthquakeRipplePreviewDTO
{
    public function __construct(
        public string $label,
        public string $maxIntensity,
        public string $color,
        public int $size,
        public string $duration,
        public int $ringCount,
    ) {
    }

    /**
     * React 側でそのまま扱える camelCase の props へ変換します。
     *
     * @return array{label: string, maxIntensity: string, color: string, size: int, duration: string, ringCount: int}
     */
    public function toArray(): array
    {
        return [
            'label' => $this->label,
            'maxIntensity' => $this->maxIntensity,
            'color' => $this->color,
            'size' => $this->size,
            'duration' => $this->duration,
            'ringCount' => $this->ringCount,
        ];
    }
}
