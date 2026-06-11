<?php

namespace Tests\Feature\DanceShortsAnalyzer;

use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoAnalysisRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DanceShortsAnalyzerVideoAnalysisRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_find_videos_by_ids_preserves_requested_order(): void
    {
        $firstVideo = $this->video([
            'youtube_video_id' => 'first-video',
            'title' => 'First Video',
        ]);
        $secondVideo = $this->video([
            'youtube_video_id' => 'second-video',
            'title' => 'Second Video',
        ]);

        $videos = $this->repository()->findVideosByIds([
            (int) $secondVideo->getKey(),
            (int) $firstVideo->getKey(),
        ]);

        $this->assertSame('second-video', $videos[0]->youtubeVideoId);
        $this->assertSame('first-video', $videos[1]->youtubeVideoId);
    }

    public function test_find_snapshots_returns_region_data_and_orders_by_collected_at_then_id(): void
    {
        $region = $this->region();
        $video = $this->video();
        $laterSnapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 200,
            'like_count' => 20,
            'comment_count' => 2,
            'collected_at' => '2026-06-01 06:00:00',
        ]);
        $earlierSnapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'like_count' => 10,
            'comment_count' => 1,
            'collected_at' => '2026-06-01 00:00:00',
        ]);

        $snapshots = $this->repository()->findSnapshotsByVideoIds([(int) $video->getKey()]);

        $this->assertSame((int) $earlierSnapshot->getKey(), $snapshots[0]->snapshotId);
        $this->assertSame((int) $laterSnapshot->getKey(), $snapshots[1]->snapshotId);
        $this->assertSame('JP', $snapshots[0]->regionCode);
        $this->assertSame('日本', $snapshots[0]->regionName);
    }

    private function repository(): DanceShortsAnalyzerVideoAnalysisRepositoryInterface
    {
        return app(DanceShortsAnalyzerVideoAnalysisRepositoryInterface::class);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function video(array $overrides = []): DanceShortVideo
    {
        return DanceShortVideo::query()->create(array_merge([
            'youtube_video_id' => 'dance-video',
            'title' => 'Dance Video',
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/thumb.jpg',
            'tracking_status' => 'active',
        ], $overrides));
    }

    private function region(): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
        ]);
    }
}
