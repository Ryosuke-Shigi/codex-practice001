<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;

class DanceShortVideoSnapshotRepository implements DanceShortVideoSnapshotRepositoryInterface
{
    public function create(DanceShortVideoSnapshotCreateDTO $dto): DanceShortVideoSnapshot
    {
        /*
         * snapshot は「取得した時点の公開指標」を履歴として積むテーブルです。
         * view_count_delta / view_growth_rate / views_per_hour は保存せず、
         * 必要なときに latestForVideoAndRegion() などで取得した前回値と比較して算出します。
         */
        return DanceShortVideoSnapshot::query()->create($dto->toArray());
    }

    public function latestForVideoAndRegion(int $videoId, int $regionId): ?DanceShortVideoSnapshot
    {
        /*
         * 同じ動画でも地域別に検索・観測されるため、最新 snapshot は video_id と region_id の
         * 両方で絞ります。collected_at が同一秒になるケースに備えて id も降順にし、
         * 直近に作成された行を安定して返します。
         */
        return DanceShortVideoSnapshot::query()
            ->where('video_id', $videoId)
            ->where('region_id', $regionId)
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();
    }
}
