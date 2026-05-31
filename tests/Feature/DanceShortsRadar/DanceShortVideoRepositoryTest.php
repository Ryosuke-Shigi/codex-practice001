<?php

namespace Tests\Feature\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use App\Models\DanceShortVideo;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DanceShortVideoRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_upsert_inserts_updates_and_skips_by_youtube_video_id_without_duplicate_rows(): void
    {
        $repository = $this->repository();

        $inserted = $repository->upsert($this->dto(
            youtubeVideoId: 'video-001',
            title: 'First title',
        ));

        $this->assertSame(DanceShortVideoRepositoryInterface::UPSERT_INSERTED, $inserted['status']);
        $this->assertDatabaseHas('dance_short_videos', [
            'youtube_video_id' => 'video-001',
            'title' => 'First title',
            'duration' => 'PT58S',
        ]);

        $skipped = $repository->upsert($this->dto(
            youtubeVideoId: 'video-001',
            title: 'First title',
        ));

        $this->assertSame(DanceShortVideoRepositoryInterface::UPSERT_SKIPPED, $skipped['status']);

        $updated = $repository->upsert($this->dto(
            youtubeVideoId: 'video-001',
            title: 'Updated title',
        ));

        $this->assertSame(DanceShortVideoRepositoryInterface::UPSERT_UPDATED, $updated['status']);
        $this->assertDatabaseHas('dance_short_videos', [
            'youtube_video_id' => 'video-001',
            'title' => 'Updated title',
        ]);
        $this->assertDatabaseCount('dance_short_videos', 1);
    }

    public function test_find_by_youtube_video_id_returns_the_matching_video(): void
    {
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'video-find',
            'title' => 'Find target',
        ]);

        $found = $this->repository()->findByYoutubeVideoId('video-find');

        $this->assertNotNull($found);
        $this->assertTrue($video->is($found));
        $this->assertNull($this->repository()->findByYoutubeVideoId('missing-video'));
    }

    private function repository(): DanceShortVideoRepositoryInterface
    {
        return app(DanceShortVideoRepositoryInterface::class);
    }

    private function dto(string $youtubeVideoId, string $title): DanceShortVideoSaveDTO
    {
        return new DanceShortVideoSaveDTO(
            youtube_video_id: $youtubeVideoId,
            title: $title,
            description: 'Dance description.',
            channel_id: 'channel-001',
            channel_title: 'Dance Channel',
            thumbnail_url: 'https://example.test/high.jpg',
            published_at: '2026-05-31 12:00:00',
            url: 'https://www.youtube.com/shorts/'.$youtubeVideoId,
            category_id: '10',
            tags: ['dance', 'shorts'],
            duration: 'PT58S',
            default_language: 'ja',
            default_audio_language: 'ja',
            live_broadcast_content: 'none',
            embeddable: true,
        );
    }
}
