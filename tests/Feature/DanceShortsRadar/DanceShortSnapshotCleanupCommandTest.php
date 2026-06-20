<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use App\DTO\DanceShortsRadar\Cleanup\DanceShortSnapshotCleanupResultDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Tests\TestCase;

class DanceShortSnapshotCleanupCommandTest extends TestCase
{
    public function test_command_calls_cleanup_action_and_outputs_deleted_count(): void
    {
        $fakeAction = new class extends CleanupDanceShortVideoSnapshotsAction
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
                    deletedSnapshotCount: 3,
                );
            }
        };

        $this->app->instance(CleanupDanceShortVideoSnapshotsAction::class, $fakeAction);
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, new class implements YouTubeVideoApiRepositoryInterface
        {
            public function searchVideos(DanceShortSearchConditionDTO $condition): array
            {
                $this->failBecauseYouTubeApiShouldNotBeCalled();
            }

            public function searchVideoPage(
                DanceShortSearchConditionDTO $condition,
                ?string $pageToken = null,
            ): YouTubeVideoSearchResultDTO {
                $this->failBecauseYouTubeApiShouldNotBeCalled();
            }

            public function fetchVideoDetails(array $youtubeVideoIds): array
            {
                $this->failBecauseYouTubeApiShouldNotBeCalled();
            }

            private function failBecauseYouTubeApiShouldNotBeCalled(): never
            {
                throw new \RuntimeException('Cleanup command should not call YouTube API.');
            }
        });

        $this
            ->artisan('dance-short:snapshot:cleanup')
            ->expectsOutput('DanceShortsRadar snapshot cleanup deleted 3 snapshots.')
            ->assertExitCode(0);

        $this->assertTrue($fakeAction->called);
    }
}
