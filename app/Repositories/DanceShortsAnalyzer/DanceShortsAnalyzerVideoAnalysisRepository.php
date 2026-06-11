<?php

namespace App\Repositories\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;

/**
 * dance_short_videos / dance_short_video_snapshots から Analyze 用 DTO を組み立てる Repository です。
 *
 * DB 境界に限定し、snapshot 差分計算や Inertia props 整形は行いません。
 */
class DanceShortsAnalyzerVideoAnalysisRepository implements DanceShortsAnalyzerVideoAnalysisRepositoryInterface
{
    /**
     * @param  array<int, int>  $videoIds
     * @return array<int, DanceShortsAnalyzerSelectedVideoDTO>
     */
    public function findVideosByIds(array $videoIds): array
    {
        $uniqueVideoIds = array_values(array_unique($videoIds));

        if ($uniqueVideoIds === []) {
            return [];
        }

        $videos = DanceShortVideo::query()
            ->select([
                'id',
                'youtube_video_id',
                'title',
                'channel_title',
                'thumbnail_url',
                'published_at',
                'tracking_status',
            ])
            ->whereIn('id', $uniqueVideoIds)
            ->get()
            ->keyBy(fn (DanceShortVideo $video): int => (int) $video->getKey());

        $selectedVideos = [];

        foreach ($uniqueVideoIds as $videoId) {
            $video = $videos->get($videoId);

            if (! $video instanceof DanceShortVideo) {
                continue;
            }

            $selectedVideos[] = new DanceShortsAnalyzerSelectedVideoDTO(
                videoId: (int) $video->getKey(),
                youtubeVideoId: (string) $video->youtube_video_id,
                title: (string) $video->title,
                channelTitle: $video->channel_title,
                thumbnailUrl: $video->thumbnail_url,
                publishedAt: $video->published_at,
                trackingStatus: (string) $video->tracking_status,
                latestSnapshot: null,
            );
        }

        return $selectedVideos;
    }

    /**
     * @param  array<int, int>  $videoIds
     * @return array<int, DanceShortsAnalyzerSnapshotPointDTO>
     */
    public function findSnapshotsByVideoIds(array $videoIds): array
    {
        $uniqueVideoIds = array_values(array_unique($videoIds));

        if ($uniqueVideoIds === []) {
            return [];
        }

        return DanceShortVideoSnapshot::query()
            ->with('region')
            ->whereIn('video_id', $uniqueVideoIds)
            ->orderBy('video_id')
            ->orderBy('region_id')
            ->orderBy('collected_at')
            ->orderBy('id')
            ->get()
            ->map(fn (DanceShortVideoSnapshot $snapshot): DanceShortsAnalyzerSnapshotPointDTO => new DanceShortsAnalyzerSnapshotPointDTO(
                snapshotId: (int) $snapshot->getKey(),
                videoId: (int) $snapshot->video_id,
                regionId: (int) $snapshot->region_id,
                regionCode: (string) $snapshot->region?->code,
                regionName: (string) $snapshot->region?->name,
                viewCount: (int) $snapshot->view_count,
                likeCount: $snapshot->like_count,
                commentCount: $snapshot->comment_count,
                collectedAt: $snapshot->collected_at,
            ))
            ->all();
    }
}
