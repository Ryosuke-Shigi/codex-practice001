<?php

namespace Tests\Feature\QuakeWavePreview;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\Models\EarthquakeFeedEntry;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class EarthquakeFeedEntryDifferentialSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_uses_latest_updated_at_inclusively_and_keeps_missing_or_invalid_updated_entries(): void
    {
        $existing = $this->savedEntry(
            entryId: 'urn:jma:earthquake:existing',
            title: '既存の地震情報',
            updatedAt: '2026-05-11 08:30:00',
        );
        $this->fakeFeed($this->feed([
            $this->feedEntry('urn:jma:earthquake:older', '古い新規地震情報', '2026-05-11T08:29:59+09:00'),
            $this->feedEntry('urn:jma:earthquake:boundary', '同一時刻の別地震情報', '2026-05-11T08:30:00+09:00'),
            $this->feedEntry('urn:jma:earthquake:existing', '既存の地震情報の訂正', '2026-05-11T08:31:00+09:00'),
            $this->feedEntry('urn:jma:earthquake:invalid', '地震更新時刻不正', 'not-a-date'),
            $this->feedEntry('urn:jma:earthquake:missing', '地震更新時刻欠落', null),
        ]));
        $syncRunId = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeFeedEntrySyncService::class)->sync($syncRunId);

        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED, $result->status);
        $this->assertSame(4, $result->totalCount);
        $this->assertSame(3, $result->insertedCount);
        $this->assertSame(1, $result->updatedCount);
        $this->assertCount(4, $result->changedEntryIds);
        $this->assertContains((int) $existing->getKey(), $result->changedEntryIds);
        $this->assertDatabaseMissing('earthquake_feed_entries', ['entry_id' => 'urn:jma:earthquake:older']);
        $this->assertDatabaseHas('earthquake_feed_entries', ['entry_id' => 'urn:jma:earthquake:boundary']);
        $this->assertDatabaseHas('earthquake_feed_entries', ['entry_id' => 'urn:jma:earthquake:invalid']);
        $this->assertDatabaseHas('earthquake_feed_entries', ['entry_id' => 'urn:jma:earthquake:missing']);
    }

    public function test_sync_falls_back_to_all_extracted_entries_without_a_valid_cutoff(): void
    {
        $this->savedEntry(
            entryId: 'urn:jma:earthquake:null-cutoff',
            title: '更新時刻なしの保存済み地震情報',
            updatedAt: null,
        );
        $this->fakeFeed($this->feed([
            $this->feedEntry('urn:jma:earthquake:old-but-new-to-db', '初回安全地震取込', '2020-01-01T00:00:00+09:00'),
        ]));
        $syncRunId = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeFeedEntrySyncService::class)->sync($syncRunId);

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(1, $result->insertedCount);
        $this->assertCount(1, $result->changedEntryIds);
        $this->assertDatabaseHas('earthquake_feed_entries', ['entry_id' => 'urn:jma:earthquake:old-but-new-to-db']);
    }

    public function test_same_boundary_entry_with_same_content_is_skipped_and_has_no_changed_ids(): void
    {
        $this->savedEntry(
            entryId: 'urn:jma:earthquake:same',
            title: '同一地震情報',
            updatedAt: '2026-05-11 08:30:00',
            xmlUrl: 'https://www.data.jma.go.jp/developer/xml/data/urn%3Ajma%3Aearthquake%3Asame.xml',
        );
        $this->fakeFeed($this->feed([
            $this->feedEntry('urn:jma:earthquake:same', '同一地震情報', '2026-05-11T08:30:00+09:00'),
        ]));
        $syncRunId = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeFeedEntrySyncService::class)->sync($syncRunId);

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(0, $result->insertedCount);
        $this->assertSame(0, $result->updatedCount);
        $this->assertSame(1, $result->skippedCount);
        $this->assertSame([], $result->changedEntryIds);
    }

    public function test_repository_returns_latest_cutoff_and_only_requested_map_pin_sources(): void
    {
        $older = $this->savedEntry('urn:jma:earthquake:older', '古い情報', '2026-05-11 08:29:00');
        $latest = $this->savedEntry('urn:jma:earthquake:latest', '新しい情報', '2026-05-11 08:30:00');
        $noUrl = $this->savedEntry('urn:jma:earthquake:no-url', 'URLなし', '2026-05-11 08:31:00', null);
        $repository = app(EarthquakeFeedEntryRepositoryInterface::class);

        $cutoff = $repository->latestUpdatedAtFromFeed();
        $sources = $repository->entriesForMapPinBuildByIds([
            (int) $older->getKey(),
            (int) $latest->getKey(),
            (int) $noUrl->getKey(),
        ]);

        $this->assertNotNull($cutoff);
        $this->assertSame('2026-05-11 08:31:00', $cutoff->format('Y-m-d H:i:s'));
        $this->assertSame([
            (int) $noUrl->getKey(),
            (int) $latest->getKey(),
            (int) $older->getKey(),
        ], array_column($sources, 'id'));
        $this->assertSame([], $repository->entriesForMapPinBuildByIds([]));
    }

    private function savedEntry(
        string $entryId,
        string $title,
        ?string $updatedAt,
        ?string $xmlUrl = 'https://www.data.jma.go.jp/developer/xml/data/detail.xml',
    ): EarthquakeFeedEntry {
        return EarthquakeFeedEntry::query()->create([
            'entry_id' => $entryId,
            'title' => $title,
            'xml_url' => $xmlUrl,
            'updated_at_from_feed' => $updatedAt,
            'published_at_from_feed' => '2026-05-11 08:25:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-11 08:31:00',
        ]);
    }

    private function fakeFeed(string $body): void
    {
        $this->app->instance(EarthquakeXmlRepositoryInterface::class, new class($body) implements EarthquakeXmlRepositoryInterface
        {
            public function __construct(private readonly string $body) {}

            public function fetchHighFrequencyFeed(): array
            {
                return [
                    'endpoint' => 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
                    'method' => 'GET',
                    'success' => true,
                    'status_code' => 200,
                    'body' => $this->body,
                    'error_message' => null,
                ];
            }

            public function fetchXmlDocument(string $url): array
            {
                throw new RuntimeException('差分feed同期では個別XMLを取得しません。');
            }
        });
    }

    /** @param array<int, string> $entries */
    private function feed(array $entries): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<feed xmlns="http://www.w3.org/2005/Atom"><title>JMA Feed</title>'
            .implode('', $entries)
            .'</feed>';
    }

    private function feedEntry(string $id, string $title, ?string $updatedAt): string
    {
        $updated = $updatedAt === null ? '' : '<updated>'.$updatedAt.'</updated>';

        return '<entry><id>'.$id.'</id><title>'.$title.'</title>'.$updated
            .'<published>2026-05-11T08:25:00+09:00</published>'
            .'<link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/'.rawurlencode($id).'.xml" />'
            .'<category term="地震火山関連" label="地震情報" /><author><name>気象庁</name></author></entry>';
    }
}
