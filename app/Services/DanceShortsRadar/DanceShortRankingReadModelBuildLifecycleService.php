<?php

namespace App\Services\DanceShortsRadar;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Throwable;

/**
 * Ranking read model build の排他、stale 判定、保持世代を判断する Service です。
 */
class DanceShortRankingReadModelBuildLifecycleService
{
    public const LOCK_NAME = 'dance-shorts-radar:ranking-read-model-build';

    public const SKIP_REASON_LOCK_UNAVAILABLE = 'lock_unavailable';

    public const SKIP_REASON_BUILDING_IN_PROGRESS = 'building_in_progress';

    public const DEFAULT_LOCK_TTL_SECONDS = 1800;

    public const DEFAULT_STALE_BUILDING_SECONDS = 1800;

    public const DEFAULT_CLEANUP_CHUNK_SIZE = 5000;

    private const JOB_TIMEOUT_SECONDS = 600;

    public function lockName(): string
    {
        return self::LOCK_NAME;
    }

    public function lockTtlSeconds(): int
    {
        /*
         * Queue Job の timeout は 600 秒です。手動 command と queue の両入口を同じ Action へ集約するため、
         * lock は timeout より十分長い 1800 秒を初期値にし、設定値が短すぎる場合も timeout 未満へ落としません。
         */
        return max(
            self::JOB_TIMEOUT_SECONDS,
            $this->configuredPositiveInt(
                'dance_short.ranking_read_model.build_lock_ttl_seconds',
                self::DEFAULT_LOCK_TTL_SECONDS,
            ),
        );
    }

    public function staleBuildingSeconds(): int
    {
        return max(
            self::JOB_TIMEOUT_SECONDS,
            $this->configuredPositiveInt(
                'dance_short.ranking_read_model.stale_building_seconds',
                self::DEFAULT_STALE_BUILDING_SECONDS,
            ),
        );
    }

    public function staleBuildingCutoff(CarbonInterface $now): CarbonImmutable
    {
        return CarbonImmutable::instance($now)
            ->setTimezone($this->applicationTimezone())
            ->subSeconds($this->staleBuildingSeconds());
    }

    /**
     * @return array<int, string>
     */
    public function retainedBuildIdsAfterActivation(string $activeBuildId): array
    {
        return [$activeBuildId];
    }

    public function cleanupChunkSize(): int
    {
        return max(
            1,
            $this->configuredPositiveInt(
                'dance_short.ranking_read_model.cleanup_chunk_size',
                self::DEFAULT_CLEANUP_CHUNK_SIZE,
            ),
        );
    }

    public function hasActivatableRows(int $rowCount): bool
    {
        return $rowCount > 0;
    }

    private function configuredPositiveInt(string $key, int $default): int
    {
        if (! function_exists('config')) {
            return $default;
        }

        try {
            $value = config($key, $default);
        } catch (Throwable) {
            return $default;
        }

        if (! is_numeric($value)) {
            return $default;
        }

        $intValue = (int) $value;

        return $intValue > 0 ? $intValue : $default;
    }

    private function applicationTimezone(): string
    {
        if (! function_exists('config')) {
            return 'Asia/Tokyo';
        }

        try {
            return (string) config('app.timezone', 'Asia/Tokyo');
        } catch (Throwable) {
            return 'Asia/Tokyo';
        }
    }
}
