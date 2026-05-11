<?php

namespace App\DTO\Earthquake\Preview;

/**
 * QuakeWave Preview のカード内で確認するためのピン見本DTOです。
 *
 * 本番用の地図ピンDTOではなく、震度ごとの色やサイズ感を
 * React 側へ Inertia props として渡すためだけに使います。
 */
final readonly class EarthquakePinPreviewDTO
{
    public function __construct(
        public string $label,
        public string $maxIntensity,
        public string $color,
        public string $sizeLabel,
    ) {
    }

    /**
     * React 側でそのまま扱える camelCase の props へ変換します。
     *
     * @return array{label: string, maxIntensity: string, color: string, sizeLabel: string}
     */
    public function toArray(): array
    {
        return [
            'label' => $this->label,
            'maxIntensity' => $this->maxIntensity,
            'color' => $this->color,
            'sizeLabel' => $this->sizeLabel,
        ];
    }
}
