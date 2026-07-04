<?php

namespace App\DTO\Earthquake\Preview;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;

/**
 * QuakeWave Preview index の読み取り結果を Query Action から Responder へ渡す ResultDTO です。
 */
final readonly class QuakeWavePreviewIndexResultDTO
{
    /**
     * @param  array<int, array<string, string>>  $mocks
     * @param  array<int, array<string, mixed>>  $savedFeedEntries
     * @param  array<int, EarthquakeFeedEntrySyncResultDTO>  $feedEntrySyncRuns
     * @param  array<int, array<string, mixed>>  $savedMapPins
     * @param  array<int, EarthquakeMapPinSyncResultDTO>  $mapPinSyncRuns
     */
    public function __construct(
        public array $mocks,
        public EarthquakeVisualPreviewDTO $visualPreview,
        public array $savedFeedEntries,
        public array $feedEntrySyncRuns,
        public array $savedMapPins,
        public array $mapPinSyncRuns,
    ) {}

    /**
     * @return array<int, array<string, int|string|null|bool>>
     */
    public function feedEntrySyncRunsToArray(): array
    {
        return array_map(
            static fn (EarthquakeFeedEntrySyncResultDTO $syncRun): array => $syncRun->toArray(),
            $this->feedEntrySyncRuns,
        );
    }

    /**
     * @return array<int, array<string, int|string|null|bool>>
     */
    public function mapPinSyncRunsToArray(): array
    {
        return array_map(
            static fn (EarthquakeMapPinSyncResultDTO $syncRun): array => $syncRun->toArray(),
            $this->mapPinSyncRuns,
        );
    }
}
