<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoRegionSaveDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotRefreshTargetDTO;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoRegion;

/**
 * dance_short_video_regions と snapshot refresh 対象取得を扱う Repository です。
 *
 * 発見関係の保存と tracking_status 条件での取得に限定し、active の意味判断や snapshot 保存可否は Service 側へ置きます。
 */
class DanceShortVideoRegionRepository implements DanceShortVideoRegionRepositoryInterface
{
    /**
     * 動画と地域の発見関係を1行に保ちながら最終検出時刻を更新します。
     */
    public function upsert(DanceShortVideoRegionSaveDTO $dto): DanceShortVideoRegion
    {
        /*
         * video_id + region_id の発見関係は1行だけにします。
         * 初回検出時刻は固定し、再検出時は last_detected_at だけを更新します。
         */
        $detectedAt = $dto->detected_at->toDateTimeString();
        $existing = DanceShortVideoRegion::query()
            ->where('video_id', $dto->video_id)
            ->where('region_id', $dto->region_id)
            ->first();

        if ($existing === null) {
            return DanceShortVideoRegion::query()->create([
                'video_id' => $dto->video_id,
                'region_id' => $dto->region_id,
                'first_detected_at' => $detectedAt,
                'last_detected_at' => $detectedAt,
            ]);
        }

        $existing->fill([
            'last_detected_at' => $detectedAt,
        ]);
        $existing->save();

        return $existing->refresh();
    }

    public function snapshotRefreshTargetsByTrackingStatus(
        string $trackingStatus,
        int $maxVideosPerRun,
    ): array {
        $limit = max(1, $maxVideosPerRun);

        $videos = DanceShortVideo::query()
            ->select('dance_short_videos.*')
            ->selectSub(function ($query): void {
                $query->from('dance_short_video_regions')
                    ->selectRaw('MIN(last_detected_at)')
                    ->whereColumn('dance_short_video_regions.video_id', 'dance_short_videos.id');
            }, 'oldest_relation_detected_at')
            ->where('tracking_status', $trackingStatus)
            ->whereExists(function ($query): void {
                $query->selectRaw('1')
                    ->from('dance_short_video_regions')
                    ->whereColumn('dance_short_video_regions.video_id', 'dance_short_videos.id');
            })
            ->orderBy('oldest_relation_detected_at')
            ->orderByDesc('published_at')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        if ($videos->isEmpty()) {
            return [];
        }

        $relationsByVideoId = DanceShortVideoRegion::query()
            ->whereIn('video_id', $videos->pluck('id')->all())
            ->orderBy('region_id')
            ->get()
            ->groupBy('video_id');

        return $videos
            ->map(function (DanceShortVideo $video) use ($relationsByVideoId): DanceShortVideoSnapshotRefreshTargetDTO {
                $videoId = (int) $video->getKey();
                $regionIds = $relationsByVideoId
                    ->get($videoId, collect())
                    ->pluck('region_id')
                    ->map(fn (mixed $regionId): int => (int) $regionId)
                    ->filter(fn (int $regionId): bool => $regionId > 0)
                    ->unique()
                    ->values()
                    ->all();

                return new DanceShortVideoSnapshotRefreshTargetDTO(
                    video_id: $videoId,
                    youtube_video_id: (string) $video->youtube_video_id,
                    region_ids: $regionIds,
                );
            })
            ->filter(fn (DanceShortVideoSnapshotRefreshTargetDTO $target): bool => $target->region_ids !== [])
            ->values()
            ->all();
    }
}
