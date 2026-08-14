<?php

namespace Tests\Feature\QuakeWavePreview;

use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EarthquakeMapPinRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_upsert_uses_source_entry_id_when_event_id_is_missing_without_double_insert(): void
    {
        $sourceEntry = $this->createFeedEntry('urn:jma:earthquake:no-event');
        $repository = app(EarthquakeMapPinRepositoryInterface::class);

        $insertResult = $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin(
                eventId: null,
                sourceEntryId: (int) $sourceEntry->getKey(),
                areaName: '初回震源',
                reportedAt: '2026-05-11T11:31:00+09:00',
            ),
        ]));

        $this->assertSame(1, $insertResult['insertedCount']);
        $this->assertDatabaseCount('earthquake_map_pins', 1);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'event_id' => null,
            'source_entry_id' => $sourceEntry->getKey(),
            'area_name' => '初回震源',
        ]);

        $skipResult = $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin(
                eventId: null,
                sourceEntryId: (int) $sourceEntry->getKey(),
                areaName: '同じ発表時刻の再同期',
                reportedAt: '2026-05-11T11:31:00+09:00',
            ),
        ]));

        $this->assertSame(1, $skipResult['skippedCount']);
        $this->assertDatabaseCount('earthquake_map_pins', 1);
        $this->assertDatabaseMissing('earthquake_map_pins', [
            'source_entry_id' => $sourceEntry->getKey(),
            'area_name' => '同じ発表時刻の再同期',
        ]);

        $updateResult = $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin(
                eventId: null,
                sourceEntryId: (int) $sourceEntry->getKey(),
                areaName: '更新後震源',
                reportedAt: '2026-05-11T11:35:00+09:00',
            ),
        ]));

        $this->assertSame(1, $updateResult['updatedCount']);
        $this->assertDatabaseCount('earthquake_map_pins', 1);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'source_entry_id' => $sourceEntry->getKey(),
            'area_name' => '更新後震源',
        ]);
    }

    public function test_to_map_pin_list_dto_applies_date_range_and_preserves_pin_values(): void
    {
        $sourceEntry = $this->createFeedEntry('urn:jma:earthquake:map-list');
        $repository = app(EarthquakeMapPinRepositoryInterface::class);

        EarthquakeMapPin::query()->create([
            'event_id' => '20260512030000',
            'source_entry_id' => $sourceEntry->getKey(),
            'title' => '震源・震度情報',
            'area_name' => '新しい震源',
            'headline' => '１２日１２時００分ころ、地震がありました。',
            'raw_coordinate' => '+42.0+143.0-30000/',
            'latitude' => '42.0000000',
            'longitude' => '143.0000000',
            'depth_meter' => 30000,
            'magnitude' => '5.1',
            'max_intensity' => '5+',
            'occurred_at' => '2026-05-12 02:59:00',
            'reported_at' => '2026-05-12 03:00:00',
            'comment' => '新しい保存済み地震情報です。',
        ]);
        EarthquakeMapPin::query()->create([
            'event_id' => '20260511050000',
            'source_entry_id' => $sourceEntry->getKey(),
            'title' => '震源・震度情報',
            'area_name' => '発表時刻なし震源',
            'headline' => '１１日０５時００分ころ、地震がありました。',
            'raw_coordinate' => '+41.0+142.5-50000/',
            'latitude' => '41.0000000',
            'longitude' => '142.5000000',
            'depth_meter' => 50000,
            'magnitude' => '4.0',
            'max_intensity' => '3',
            'occurred_at' => '2026-05-11 05:00:00',
            'reported_at' => null,
            'comment' => 'reported_at がない場合は occurred_at で範囲判定します。',
        ]);
        EarthquakeMapPin::query()->create([
            'event_id' => '20260510235959',
            'source_entry_id' => $sourceEntry->getKey(),
            'title' => '震源・震度情報',
            'area_name' => '期間外震源',
            'headline' => '期間外の地震です。',
            'raw_coordinate' => '+40.0+142.0-30000/',
            'latitude' => '40.0000000',
            'longitude' => '142.0000000',
            'depth_meter' => 30000,
            'magnitude' => '3.5',
            'max_intensity' => '2',
            'occurred_at' => '2026-05-10 14:59:59',
            'reported_at' => '2026-05-10 14:59:59',
            'comment' => '日付範囲外です。',
        ]);

        $dto = $repository->toMapPinListDTO(new EarthquakeMapPinListQueryDTO(
            limit: 10,
            startDate: '2026-05-11',
            endDate: '2026-05-12',
        ));

        $this->assertSame(2, $dto->count());
        $this->assertSame('20260512030000', $dto->items[0]->eventId);
        $this->assertSame('新しい震源', $dto->items[0]->areaName);
        $this->assertSame('42.0000000', $dto->items[0]->latitude);
        $this->assertSame('143.0000000', $dto->items[0]->longitude);
        $this->assertSame('5.1', $dto->items[0]->magnitude);
        $this->assertSame('5+', $dto->items[0]->maxIntensity);
        $this->assertSame('2026-05-12T02:59:00+09:00', $dto->items[0]->occurredAt);
        $this->assertSame('2026-05-12T03:00:00+09:00', $dto->items[0]->reportedAt);

        $this->assertSame('20260511050000', $dto->items[1]->eventId);
        $this->assertSame('発表時刻なし震源', $dto->items[1]->areaName);
        $this->assertSame('2026-05-11T05:00:00+09:00', $dto->items[1]->occurredAt);
        $this->assertNull($dto->items[1]->reportedAt);
    }

    public function test_delete_by_source_entry_id_removes_only_the_stale_pin(): void
    {
        $removedSource = $this->createFeedEntry('urn:jma:earthquake:removed');
        $keptSource = $this->createFeedEntry('urn:jma:earthquake:kept');
        $repository = app(EarthquakeMapPinRepositoryInterface::class);

        $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin('removed-event', (int) $removedSource->getKey(), '削除対象', '2026-05-11T11:31:00+09:00'),
            $this->pin('kept-event', (int) $keptSource->getKey(), '保持対象', '2026-05-11T11:31:00+09:00'),
        ]));

        $repository->deleteBySourceEntryId((int) $removedSource->getKey());

        $this->assertDatabaseMissing('earthquake_map_pins', ['event_id' => 'removed-event']);
        $this->assertDatabaseHas('earthquake_map_pins', ['event_id' => 'kept-event']);
    }

    private function createFeedEntry(string $entryId): EarthquakeFeedEntry
    {
        return EarthquakeFeedEntry::query()->create([
            'entry_id' => $entryId,
            'title' => '震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511113100_0.xml',
            'updated_at_from_feed' => '2026-05-11 02:31:00',
            'published_at_from_feed' => '2026-05-11 02:30:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-11 02:31:30',
        ]);
    }

    private function pin(
        ?string $eventId,
        int $sourceEntryId,
        string $areaName,
        string $reportedAt,
    ): EarthquakeMapPinDTO {
        return new EarthquakeMapPinDTO(
            eventId: $eventId,
            sourceEntryId: $sourceEntryId,
            title: '震源・震度情報',
            areaName: $areaName,
            headline: '１１日１１時２７分ころ、地震がありました。',
            rawCoordinate: '+41.0+142.5-50000/',
            latitude: '41.0000000',
            longitude: '142.5000000',
            depthMeter: 50000,
            magnitude: '4.0',
            maxIntensity: '4',
            occurredAt: '2026-05-11T11:27:00+09:00',
            reportedAt: $reportedAt,
            comment: '保存済み地震情報です。',
        );
    }
}
