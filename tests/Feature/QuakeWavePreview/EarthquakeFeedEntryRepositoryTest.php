<?php

namespace Tests\Feature\QuakeWavePreview;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryDTO;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\Models\EarthquakeFeedEntry;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class EarthquakeFeedEntryRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_upsert_saves_skips_duplicates_and_updates_changed_feed_facts_by_entry_id(): void
    {
        $repository = app(EarthquakeFeedEntryRepositoryInterface::class);

        try {
            $repository->upsertFromExtractedEntries(new EarthquakeExtractedEntryListDTO([
                $this->entry(id: 'urn:jma:earthquake:1', title: '震源・震度に関する情報'),
                $this->entry(id: '', title: 'IDなし'),
                $this->entry(id: 'urn:jma:earthquake:newer', title: 'より新しい地震情報', updatedAt: '2026-05-11T08:40:00+09:00'),
            ]));

            $this->fail('A partially failed feed batch must be rolled back.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Feed entry ID is missing.', $exception->getMessage());
        }

        $this->assertDatabaseCount('earthquake_feed_entries', 0);

        $insertResult = $repository->upsertFromExtractedEntries(new EarthquakeExtractedEntryListDTO([
            $this->entry(id: 'urn:jma:earthquake:1', title: '震源・震度に関する情報'),
            $this->entry(id: 'urn:jma:earthquake:newer', title: 'より新しい地震情報', updatedAt: '2026-05-11T08:40:00+09:00'),
        ]));

        $this->assertSame(2, $insertResult['totalCount']);
        $this->assertSame(2, $insertResult['insertedCount']);
        $this->assertSame(0, $insertResult['failedCount']);
        $this->assertDatabaseCount('earthquake_feed_entries', 2);
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:1',
            'title' => '震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
        ]);

        $skipResult = $repository->upsertFromExtractedEntries(new EarthquakeExtractedEntryListDTO([
            $this->entry(id: 'urn:jma:earthquake:1', title: '震源・震度に関する情報'),
        ]));

        $this->assertSame(0, $skipResult['insertedCount']);
        $this->assertSame(0, $skipResult['updatedCount']);
        $this->assertSame(1, $skipResult['skippedCount']);
        $this->assertDatabaseCount('earthquake_feed_entries', 2);

        $updateResult = $repository->upsertFromExtractedEntries(new EarthquakeExtractedEntryListDTO([
            $this->entry(
                id: 'urn:jma:earthquake:1',
                title: '震源・震度に関する続報',
                updatedAt: '2026-05-11T08:35:00+09:00',
            ),
        ]));

        $this->assertSame(0, $updateResult['insertedCount']);
        $this->assertSame(1, $updateResult['updatedCount']);
        $this->assertDatabaseCount('earthquake_feed_entries', 2);
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:1',
            'title' => '震源・震度に関する続報',
        ]);
    }

    public function test_entries_for_map_pin_build_returns_only_entries_with_xml_url_in_latest_order(): void
    {
        $repository = app(EarthquakeFeedEntryRepositoryInterface::class);

        EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:earthquake:old',
            'title' => '古い震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511070000_0.xml',
            'updated_at_from_feed' => '2026-05-10 22:00:00',
            'published_at_from_feed' => '2026-05-10 21:58:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-10 22:00:30',
        ]);
        EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:earthquake:new',
            'title' => '新しい震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
            'updated_at_from_feed' => '2026-05-10 23:30:00',
            'published_at_from_feed' => '2026-05-10 23:28:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-10 23:30:30',
        ]);
        EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:earthquake:null-url',
            'title' => 'XML URLなし',
            'xml_url' => null,
            'updated_at_from_feed' => '2026-05-10 23:40:00',
            'published_at_from_feed' => '2026-05-10 23:38:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-10 23:40:30',
        ]);
        EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:earthquake:empty-url',
            'title' => 'XML URL空文字',
            'xml_url' => '',
            'updated_at_from_feed' => '2026-05-10 23:50:00',
            'published_at_from_feed' => '2026-05-10 23:48:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-10 23:50:30',
        ]);

        $entries = $repository->entriesForMapPinBuild();

        $this->assertCount(2, $entries);
        $this->assertSame('urn:jma:earthquake:new', $entries[0]['entryId']);
        $this->assertSame('新しい震源・震度に関する情報', $entries[0]['title']);
        $this->assertSame('https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml', $entries[0]['xmlUrl']);
        $this->assertSame('urn:jma:earthquake:old', $entries[1]['entryId']);
    }

    private function entry(
        string $id,
        string $title,
        string $updatedAt = '2026-05-11T08:30:00+09:00',
    ): EarthquakeExtractedEntryDTO {
        return new EarthquakeExtractedEntryDTO(
            id: $id,
            title: $title,
            updatedAt: $updatedAt,
            publishedAt: '2026-05-11T08:25:00+09:00',
            xmlUrl: 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
            rawCategory: '地震情報 (地震火山関連)',
            rawAuthor: '気象庁',
        );
    }
}
