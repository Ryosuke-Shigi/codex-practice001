<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;

interface EarthquakeMapPinRepositoryInterface
{
    public function isStorageReady(): bool;

    /**
     * @return array{
     *     totalCount: int,
     *     insertedCount: int,
     *     updatedCount: int,
     *     skippedCount: int,
     *     failedCount: int
     * }
     */
    public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array;

    public function deleteBySourceEntryId(int $sourceEntryId): void;

    /**
     * 保存済み map pin の最新行を、画面やプレビュー一覧で扱いやすい配列として返します。
     * Repository の責務は DB 取得だけなので、震度に応じた色や波紋表現はここで決めません。
     *
     * @return array<int, array<string, mixed>>
     */
    public function latest(int $limit = 50): array;

    /**
     * /quakewave-preview/map の表示用 DTO を組み立てます。
     * DB境界から出る latitude / longitude は string のまま維持します。
     */
    public function toMapPinListDTO(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO;
}
