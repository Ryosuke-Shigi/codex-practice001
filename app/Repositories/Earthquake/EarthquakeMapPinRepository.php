<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use App\Models\EarthquakeMapPin;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Throwable;

class EarthquakeMapPinRepository implements EarthquakeMapPinRepositoryInterface
{
    private const TABLE = 'earthquake_map_pins';

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
     *     failedCount: int
     * }
     */
    public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array
    {
        /*
         * Repository は map pin のDB反映だけを担当します。
         * XML解析や「pin化できる電文か」の判断は Service で終えてから DTO として受けます。
         *
         * upsert の主キーは event_id を優先します。
         * JMA の同一EventIDに続報が来るケースでは、同じ地震イベントのピンを増殖させず、
         * reported_at が新しい情報で1行を更新します。
         */
        $totalCount = $pins->count();
        $insertedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($pins->items as $pin) {
            try {
                $attributes = $this->attributesFromPin($pin);
                $existing = $this->findExisting($pin);

                if (! $existing instanceof EarthquakeMapPin) {
                    EarthquakeMapPin::query()->create($attributes);
                    $insertedCount++;
                    continue;
                }

                if (! $this->shouldUpdate($existing, $attributes)) {
                    $skippedCount++;
                    continue;
                }

                $existing->fill($attributes);
                $existing->save();
                $updatedCount++;
            } catch (Throwable) {
                $failedCount++;
            }
        }

        return [
            'totalCount' => $totalCount,
            'insertedCount' => $insertedCount,
            'updatedCount' => $updatedCount,
            'skippedCount' => $skippedCount,
            'failedCount' => $failedCount,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latest(int $limit = 50): array
    {
        /*
         * Index 画面の「保存済み map pin 簡易一覧」向けの読み取り口です。
         * QuakeWave MAP 本体は toMapPinListDTO() を使いますが、同じ latestModels() を
         * 経由させることで、最新順や上限の扱いを Repository 内で一箇所に揃えます。
         */
        return $this->latestModels(EarthquakeMapPinListQueryDTO::forLatest($limit))
            ->map(fn (EarthquakeMapPin $pin): array => $this->pinToArray($pin))
            ->all();
    }

    public function toMapPinListDTO(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO
    {
        /*
         * MAP 表示用の読み取り境界です。
         * Repository では DB の最新行を DTO に戻すだけにし、震度による色・波紋サイズなどの
         * 表示演出は React 側へ残します。保存や再同期の判断もここでは行いません。
         * 日付範囲は Inertia 再取得時の読み取り条件としてだけ扱います。
         */
        return new EarthquakeMapPinListDTO(
            $this->latestModels($query)
                ->map(fn (EarthquakeMapPin $pin): EarthquakeMapPinDTO => $this->pinToDTO($pin))
                ->all(),
        );
    }

    private function findExisting(EarthquakeMapPinDTO $pin): ?EarthquakeMapPin
    {
        /*
         * event_id が取得できる電文は event_id を同一性の基準にします。
         * 取得できない場合だけ source_entry_id へフォールバックし、同じfeed entryから
         * 重複ピンを作らないようにします。
         */
        if ($pin->eventId !== null && trim($pin->eventId) !== '') {
            return EarthquakeMapPin::query()
                ->where('event_id', $pin->eventId)
                ->first();
        }

        return EarthquakeMapPin::query()
            ->where('source_entry_id', $pin->sourceEntryId)
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFromPin(EarthquakeMapPinDTO $pin): array
    {
        return [
            'event_id' => $pin->eventId,
            'source_entry_id' => $pin->sourceEntryId,
            'title' => $pin->title,
            'area_name' => $pin->areaName,
            'headline' => $pin->headline,
            'raw_coordinate' => $pin->rawCoordinate,
            'latitude' => $pin->latitude,
            'longitude' => $pin->longitude,
            'depth_meter' => $pin->depthMeter,
            'magnitude' => $pin->magnitude,
            'max_intensity' => $pin->maxIntensity,
            'occurred_at' => $this->parseDate($pin->occurredAt)?->toDateTimeString(),
            'reported_at' => $this->parseDate($pin->reportedAt)?->toDateTimeString(),
            'comment' => $pin->comment,
        ];
    }

    private function shouldUpdate(EarthquakeMapPin $existing, array $attributes): bool
    {
        /*
         * event_id が同じ電文は、より新しい reported_at を優先します。
         * 古い発表で上書きしないことで、同一イベントの続報が来た場合も最新側を残します。
         */
        if (! $this->incomingReportIsNewer($existing->reported_at, $attributes['reported_at'])) {
            return false;
        }

        return $existing->source_entry_id !== $attributes['source_entry_id']
            || $existing->title !== $attributes['title']
            || $existing->area_name !== $attributes['area_name']
            || $existing->headline !== $attributes['headline']
            || $existing->raw_coordinate !== $attributes['raw_coordinate']
            || $existing->latitude !== $attributes['latitude']
            || $existing->longitude !== $attributes['longitude']
            || $existing->depth_meter !== $attributes['depth_meter']
            || $existing->magnitude !== $attributes['magnitude']
            || $existing->max_intensity !== $attributes['max_intensity']
            || ! $this->sameDate($existing->occurred_at, $attributes['occurred_at'])
            || ! $this->sameDate($existing->reported_at, $attributes['reported_at'])
            || $existing->comment !== $attributes['comment'];
    }

    private function incomingReportIsNewer(CarbonInterface|string|null $existing, CarbonInterface|string|null $incoming): bool
    {
        /*
         * 同じ event_id の古い発表で新しいピンを上書きしないための判定です。
         * reported_at が同じ場合も更新しません。内容差分があっても同時刻の再処理なら skipped として扱います。
         */
        $existingDate = $this->parseDate($this->dateForComparison($existing));
        $incomingDate = $this->parseDate($this->dateForComparison($incoming));

        if ($existingDate === null) {
            return $incomingDate !== null;
        }

        if ($incomingDate === null) {
            return false;
        }

        return $incomingDate->greaterThan($existingDate);
    }

    private function parseDate(?string $value): ?CarbonImmutable
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)->utc();
        } catch (Throwable) {
            return null;
        }
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
            if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $date)) {
                return $date;
            }

            return $this->parseDate($date)?->format('Y-m-d H:i:s');
        }

        return $date->format('Y-m-d H:i:s');
    }

    /**
     * @return array<string, mixed>
     */
    private function pinToArray(EarthquakeMapPin $pin): array
    {
        return [
            'id' => (int) $pin->getKey(),
            'eventId' => $pin->event_id,
            'sourceEntryId' => (int) $pin->source_entry_id,
            'title' => $pin->title,
            'areaName' => $pin->area_name,
            'headline' => $pin->headline,
            'rawCoordinate' => $pin->raw_coordinate,
            'latitude' => $this->decimalString($pin->latitude, 7),
            'longitude' => $this->decimalString($pin->longitude, 7),
            'depthMeter' => $pin->depth_meter,
            'magnitude' => $this->decimalString($pin->magnitude, 1),
            'maxIntensity' => $pin->max_intensity,
            'occurredAt' => $pin->occurred_at?->toIso8601String(),
            'reportedAt' => $pin->reported_at?->toIso8601String(),
            'comment' => $pin->comment,
        ];
    }

    /**
     * @return \Illuminate\Support\Collection<int, EarthquakeMapPin>
     */
    private function latestModels(EarthquakeMapPinListQueryDTO $query)
    {
        if (! $this->isStorageReady()) {
            return collect();
        }

        /*
         * reported_at が取れている行を優先し、同じ発表時刻では後から保存された行を上にします。
         * ここでは「表示対象にするか」の業務判断はせず、保存済みデータの最新順読み取りだけを
         * Eloquent クエリとして表現します。
         */
        $builder = EarthquakeMapPin::query();
        $this->applyDateRange($builder, $query);

        return $builder
            ->orderByRaw('reported_at IS NULL')
            ->orderByDesc('reported_at')
            ->orderByDesc('id')
            ->limit(max(1, min($query->limit, 100)))
            ->get();
    }

    private function applyDateRange(Builder $builder, EarthquakeMapPinListQueryDTO $query): void
    {
        $timezone = config('app.timezone', 'UTC');
        $startAt = $this->parseDateBoundary($query->startDate, $timezone, true);
        $endAt = $this->parseDateBoundary($query->endDate, $timezone, false);

        if ($startAt !== null) {
            $builder->where(function (Builder $dateQuery) use ($startAt): void {
                $dateQuery
                    ->where('reported_at', '>=', $startAt->toDateTimeString())
                    ->orWhere(function (Builder $fallbackQuery) use ($startAt): void {
                        $fallbackQuery
                            ->whereNull('reported_at')
                            ->where('occurred_at', '>=', $startAt->toDateTimeString());
                    });
            });
        }

        if ($endAt !== null) {
            $builder->where(function (Builder $dateQuery) use ($endAt): void {
                $dateQuery
                    ->where('reported_at', '<=', $endAt->toDateTimeString())
                    ->orWhere(function (Builder $fallbackQuery) use ($endAt): void {
                        $fallbackQuery
                            ->whereNull('reported_at')
                            ->where('occurred_at', '<=', $endAt->toDateTimeString());
                    });
            });
        }
    }

    private function parseDateBoundary(?string $date, string $timezone, bool $startOfDay): ?CarbonImmutable
    {
        if ($date === null || trim($date) === '') {
            return null;
        }

        try {
            $parsedDate = CarbonImmutable::createFromFormat('Y-m-d', $date, $timezone);

            if (! $parsedDate instanceof CarbonImmutable) {
                return null;
            }

            return ($startOfDay ? $parsedDate->startOfDay() : $parsedDate->endOfDay())->utc();
        } catch (Throwable) {
            return null;
        }
    }

    private function pinToDTO(EarthquakeMapPin $pin): EarthquakeMapPinDTO
    {
        return new EarthquakeMapPinDTO(
            eventId: $pin->event_id,
            sourceEntryId: (int) $pin->source_entry_id,
            title: $pin->title,
            areaName: $pin->area_name,
            headline: $pin->headline,
            rawCoordinate: $pin->raw_coordinate,
            latitude: $this->decimalString($pin->latitude, 7),
            longitude: $this->decimalString($pin->longitude, 7),
            depthMeter: $pin->depth_meter,
            magnitude: $this->decimalString($pin->magnitude, 1),
            maxIntensity: $pin->max_intensity,
            occurredAt: $pin->occurred_at?->toIso8601String(),
            reportedAt: $pin->reported_at?->toIso8601String(),
            comment: $pin->comment,
        );
    }

    private function decimalString(float|int|string|null $value, int $scale): ?string
    {
        /*
         * latitude / longitude / magnitude は Model で float cast しない方針です。
         * ただし SQLite などのテストDBでは DECIMAL の末尾ゼロが落ちるため、
         * 表示 DTO へ戻す境界でだけ文字列スケールを揃えます。
         */
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return (string) $value;
        }

        return number_format((float) $value, $scale, '.', '');
    }
}
