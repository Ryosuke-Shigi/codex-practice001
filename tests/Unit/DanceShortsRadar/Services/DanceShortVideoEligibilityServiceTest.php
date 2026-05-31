<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\Services\DanceShortsRadar\DanceShortVideoEligibilityService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortVideoEligibilityServiceTest extends TestCase
{
    public function test_it_identifies_shorts_target_from_iso8601_duration(): void
    {
        $service = new DanceShortVideoEligibilityService();

        $this->assertTrue($service->isShortsTarget($this->detail(duration: 'PT58S')));
        $this->assertTrue($service->isShortsTarget($this->detail(duration: 'PT3M')));
        $this->assertFalse($service->isShortsTarget($this->detail(duration: 'PT3M1S')));
        $this->assertFalse($service->isShortsTarget($this->detail(duration: null)));
        $this->assertFalse($service->isShortsTarget($this->detail(duration: 'not-duration')));
    }

    public function test_it_identifies_required_persistence_fields_without_db_queries(): void
    {
        $service = new DanceShortVideoEligibilityService();

        $this->assertTrue($service->hasRequiredPersistenceFields($this->detail()));
        $this->assertFalse($service->hasRequiredPersistenceFields($this->detail(title: null)));
        $this->assertFalse($service->hasRequiredPersistenceFields($this->detail(viewCount: null)));
        $this->assertFalse($service->hasRequiredPersistenceFields($this->detail(youtubeVideoId: '')));
    }

    public function test_it_calculates_snapshot_derived_metrics_without_mixing_them_into_save_dto(): void
    {
        $service = new DanceShortVideoEligibilityService();

        $metrics = $service->calculateSnapshotMetrics(
            previousViewCount: 100,
            previousCollectedAt: CarbonImmutable::parse('2026-05-31 00:00:00', 'UTC'),
            currentViewCount: 250,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 06:00:00', 'UTC'),
        );

        $this->assertSame(150, $metrics['viewCountDelta']);
        $this->assertSame(1.5, $metrics['viewGrowthRate']);
        $this->assertSame(25.0, $metrics['viewsPerHour']);

        $snapshotDTO = new DanceShortVideoSnapshotCreateDTO(
            video_id: 1,
            region_id: 1,
            view_count: 250,
            like_count: 10,
            comment_count: 2,
            collected_at: CarbonImmutable::parse('2026-05-31 06:00:00', 'UTC'),
        );

        $this->assertArrayNotHasKey('view_count_delta', $snapshotDTO->toArray());
        $this->assertArrayNotHasKey('view_growth_rate', $snapshotDTO->toArray());
        $this->assertArrayNotHasKey('views_per_hour', $snapshotDTO->toArray());
    }

    private function detail(
        string $youtubeVideoId = 'video-001',
        ?string $title = 'Dance short',
        ?string $duration = 'PT58S',
        ?int $viewCount = 123456,
    ): YouTubeVideoDetailDTO {
        return new YouTubeVideoDetailDTO(
            youtubeVideoId: $youtubeVideoId,
            title: $title,
            description: 'Dance description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/high.jpg',
            publishedAt: '2026-05-31T12:00:00Z',
            categoryId: '10',
            tags: ['dance', 'shorts'],
            duration: $duration,
            defaultLanguage: 'ja',
            defaultAudioLanguage: 'ja',
            liveBroadcastContent: 'none',
            embeddable: true,
            viewCount: $viewCount,
            likeCount: 789,
            commentCount: 12,
        );
    }
}
