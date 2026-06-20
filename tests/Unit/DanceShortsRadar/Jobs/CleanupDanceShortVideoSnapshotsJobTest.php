<?php

namespace Tests\Unit\DanceShortsRadar\Jobs;

use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use App\DTO\DanceShortsRadar\Cleanup\DanceShortSnapshotCleanupResultDTO;
use App\Jobs\DanceShortsRadar\CleanupDanceShortVideoSnapshotsJob;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use PHPUnit\Framework\TestCase;

class CleanupDanceShortVideoSnapshotsJobTest extends TestCase
{
    public function test_handle_calls_cleanup_action(): void
    {
        /*
         * cleanup Job の責務は Action を Queue worker 上で実行することだけです。
         * 削除 cutoff の算出や DB 削除条件は Action / Service / Repository の既存テストで固定します。
         */
        $action = new class extends CleanupDanceShortVideoSnapshotsAction
        {
            public bool $called = false;

            public function __construct() {}

            public function execute(?CarbonInterface $now = null): DanceShortSnapshotCleanupResultDTO
            {
                $this->called = true;

                return new DanceShortSnapshotCleanupResultDTO(
                    executedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
                    cutoffAt: CarbonImmutable::parse('2026-04-27 12:00:00', 'Asia/Tokyo'),
                    retentionDays: 35,
                    deletedSnapshotCount: 5,
                );
            }
        };

        (new CleanupDanceShortVideoSnapshotsJob)->handle($action);

        $this->assertTrue($action->called);
    }

    public function test_job_has_queue_runtime_settings(): void
    {
        /*
         * cleanup は YouTube API を呼ばない maintenance Job ですが、Queue 上で詰まったままにしないため
         * retry / timeout / timeout failure の基本設定を同期 Job と同じ粒度で固定します。
         */
        $job = new CleanupDanceShortVideoSnapshotsJob;

        $this->assertSame(1, $job->tries);
        $this->assertSame(120, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertTrue(method_exists($job, 'failed'));
    }
}
