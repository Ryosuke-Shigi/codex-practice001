<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryDTO;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\Models\EarthquakeFeedEntry;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

/**
 * JMA feed entry の保存・読み取りを担当する DB Repository です。
 *
 * earthquake_feed_entries への upsert と map pin 生成用の取得条件を扱います。
 * 地震entryとして採用するか、個別XMLを解析できるかの判断は Service 側へ分けます。
 */
class EarthquakeFeedEntryRepository implements EarthquakeFeedEntryRepositoryInterface
{
    private const TABLE = 'earthquake_feed_entries';

    public function isStorageReady(): bool
    {
        return Schema::hasTable(self::TABLE);
    }

    /**
     * @return array{
     *     totalCount: int,
     *     insertedCount: int,
     *     updatedCount: int,
     *     skippedCount: int,
     *     failedCount: int,
     *     changedEntryIds: array<int, int>
     * }
     */
    public function upsertFromExtractedEntries(EarthquakeExtractedEntryListDTO $entries): array
    {
        /*
         * Repository は保存と取得の境界だけを担当します。
         * 「地震entryとして採用するか」の判断は EarthquakeEntryExtractService 済みなので、
         * ここでは entry_id unique を基準に DB 行へ反映することだけを扱います。
         * batch途中の失敗でcutoffだけが進まないよう、1 feed分の保存はatomicにします。
         */
        return DB::transaction(function () use ($entries): array {
            $totalCount = $entries->count();
            $insertedCount = 0;
            $updatedCount = 0;
            $skippedCount = 0;
            $changedEntryIds = [];
            $fetchedAt = CarbonImmutable::now();

            foreach ($entries->items as $entry) {
                if (trim($entry->id) === '') {
                    throw new RuntimeException('Feed entry ID is missing.');
                }

                $attributes = $this->attributesFromEntry($entry, $fetchedAt);
                $existing = EarthquakeFeedEntry::query()
                    ->where('entry_id', $entry->id)
                    ->first();

                if (! $existing instanceof EarthquakeFeedEntry) {
                    /*
                     * 初回同期で見つかった entry は新規登録します。
                     * raw XML 本文は保存しない方針なので、後続の詳細取得に必要な xml_url と
                     * Atom feed 上の表層情報だけに絞ります。
                     */
                    $created = EarthquakeFeedEntry::query()->create($attributes);
                    $changedEntryIds[] = (int) $created->getKey();
                    $insertedCount++;

                    continue;
                }

                if (! $this->shouldUpdate($existing, $attributes)) {
                    /*
                     * last_fetched_at だけを更新するための write は行いません。
                     * 同一内容の再同期を skipped として数えることで、画面上の件数が
                     * 「feed内容に実質差分があったか」を読み取りやすくなります。
                     */
                    $skippedCount++;

                    continue;
                }

                $existing->fill($attributes);
                $existing->save();
                $changedEntryIds[] = (int) $existing->getKey();
                $updatedCount++;
            }

            return [
                'totalCount' => $totalCount,
                'insertedCount' => $insertedCount,
                'updatedCount' => $updatedCount,
                'skippedCount' => $skippedCount,
                'failedCount' => 0,
                'changedEntryIds' => $changedEntryIds,
            ];
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latest(int $limit = 20): array
    {
        if (! $this->isStorageReady()) {
            return [];
        }

        return EarthquakeFeedEntry::query()
            ->orderByRaw('updated_at_from_feed IS NULL')
            ->orderByDesc('updated_at_from_feed')
            ->orderByDesc('id')
            ->limit(max(1, min($limit, 100)))
            ->get()
            ->map(fn (EarthquakeFeedEntry $entry): array => $this->entryToArray($entry))
            ->all();
    }

    public function latestUpdatedAtFromFeed(): ?CarbonImmutable
    {
        if (! $this->isStorageReady()) {
            return null;
        }

        $value = EarthquakeFeedEntry::query()
            ->whereNotNull('updated_at_from_feed')
            ->max('updated_at_from_feed');

        return is_string($value) ? $this->parseFeedDate($value) : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function entriesForMapPinBuild(int $limit = 100): array
    {
        if (! $this->isStorageReady()) {
            return [];
        }

        /*
         * map pin 生成の入力になる feed entry だけを返します。
         * 「個別XMLを解析して pin を作れるか」は Service 側の責務なので、Repository では
         * xml_url を持つ保存済み entry の取得条件だけに留めます。
         */
        return EarthquakeFeedEntry::query()
            ->whereNotNull('xml_url')
            ->where('xml_url', '<>', '')
            ->orderByRaw('updated_at_from_feed IS NULL')
            ->orderByDesc('updated_at_from_feed')
            ->orderByDesc('id')
            ->limit(max(1, min($limit, 500)))
            ->get()
            ->map(fn (EarthquakeFeedEntry $entry): array => $this->entryToArray($entry))
            ->all();
    }

    /**
     * 差分更新されたIDは、xml_urlが空へ変わったentryも返します。
     * 古いpinを削除するかの判断はServiceへ残し、Repositoryは指定IDの取得だけを担当します。
     *
     * @param  array<int, int>  $sourceEntryIds
     * @return array<int, array<string, mixed>>
     */
    public function entriesForMapPinBuildByIds(array $sourceEntryIds): array
    {
        if (! $this->isStorageReady() || $sourceEntryIds === []) {
            return [];
        }

        return EarthquakeFeedEntry::query()
            ->whereKey(array_values(array_unique($sourceEntryIds)))
            ->orderByRaw('updated_at_from_feed IS NULL')
            ->orderByDesc('updated_at_from_feed')
            ->orderByDesc('id')
            ->get()
            ->map(fn (EarthquakeFeedEntry $entry): array => $this->entryToArray($entry))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFromEntry(EarthquakeExtractedEntryDTO $entry, CarbonInterface $fetchedAt): array
    {
        return [
            'entry_id' => $entry->id,
            'title' => $entry->title,
            'xml_url' => $entry->xmlUrl,
            'updated_at_from_feed' => $this->parseFeedDate($entry->updatedAt)?->toDateTimeString(),
            'published_at_from_feed' => $this->parseFeedDate($entry->publishedAt)?->toDateTimeString(),
            'raw_category' => $entry->rawCategory,
            'raw_author' => $entry->rawAuthor,
            'last_fetched_at' => $fetchedAt->toDateTimeString(),
        ];
    }

    private function parseFeedDate(?string $value): ?CarbonImmutable
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)->setTimezone($this->applicationTimezone());
        } catch (Throwable) {
            return null;
        }
    }

    private function applicationTimezone(): string
    {
        return (string) config('app.timezone', 'Asia/Tokyo');
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function shouldUpdate(EarthquakeFeedEntry $existing, array $attributes): bool
    {
        /*
         * updated_at_from_feed / published_at_from_feed は timezone を含む文字列で届くため、
         * DB cast 後の Carbon と保存予定文字列を同じ秒精度に丸めて比較します。
         * 比較対象は Atom feed 由来の事実データだけに限定し、last_fetched_at は差分判定に含めません。
         */
        return $existing->title !== $attributes['title']
            || $existing->xml_url !== $attributes['xml_url']
            || ! $this->sameDate($existing->updated_at_from_feed, $attributes['updated_at_from_feed'])
            || ! $this->sameDate($existing->published_at_from_feed, $attributes['published_at_from_feed'])
            || $existing->raw_category !== $attributes['raw_category']
            || $existing->raw_author !== $attributes['raw_author'];
    }

    private function sameDate(CarbonInterface|string|null $existing, CarbonInterface|string|null $incoming): bool
    {
        return $this->dateForComparison($existing) === $this->dateForComparison($incoming);
    }

    private function dateForComparison(CarbonInterface|string|null $date): ?string
    {
        if ($date === null || $date === '') {
            return null;
        }

        if (is_string($date)) {
            return CarbonImmutable::parse($date)->format('Y-m-d H:i:s');
        }

        return $date->format('Y-m-d H:i:s');
    }

    /**
     * @return array<string, mixed>
     */
    private function entryToArray(EarthquakeFeedEntry $entry): array
    {
        return [
            'id' => (int) $entry->getKey(),
            'entryId' => (string) $entry->entry_id,
            'title' => (string) $entry->title,
            'xmlUrl' => $entry->xml_url,
            'updatedAtFromFeed' => $entry->updated_at_from_feed?->toIso8601String(),
            'publishedAtFromFeed' => $entry->published_at_from_feed?->toIso8601String(),
            'rawCategory' => $entry->raw_category,
            'rawAuthor' => $entry->raw_author,
            'lastFetchedAt' => $entry->last_fetched_at?->toIso8601String(),
        ];
    }
}
