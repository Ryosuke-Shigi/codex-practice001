<?php

namespace App\DTO\Earthquake\Preview;

/**
 * QuakeWave Preview のビジュアル見本をまとめるDTOです。
 *
 * ピンと波紋を同じ props 配下にまとめることで、React 側の
 * プレビューカードは Laravel 側から渡された表示候補だけを描画します。
 */
final readonly class EarthquakeVisualPreviewDTO
{
    /**
     * @param  array<int, EarthquakePinPreviewDTO>  $pins
     * @param  array<int, EarthquakeRipplePreviewDTO>  $ripples
     */
    public function __construct(
        public array $pins,
        public array $ripples,
    ) {}

    /**
     * Inertia props 用にピン・波紋の見本を配列化します。
     *
     * @return array{
     *     pins: array<int, array{label: string, maxIntensity: string, color: string, sizeLabel: string}>,
     *     ripples: array<int, array{label: string, maxIntensity: string, color: string, size: int, duration: string, ringCount: int}>
     * }
     */
    public function toArray(): array
    {
        return [
            'pins' => array_map(
                static fn (EarthquakePinPreviewDTO $pin): array => $pin->toArray(),
                $this->pins,
            ),
            'ripples' => array_map(
                static fn (EarthquakeRipplePreviewDTO $ripple): array => $ripple->toArray(),
                $this->ripples,
            ),
        ];
    }
}
