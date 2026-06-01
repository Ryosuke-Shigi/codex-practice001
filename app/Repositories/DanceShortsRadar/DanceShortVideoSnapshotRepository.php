<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

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

    /**
     * @return Collection<int, DanceShortVideoSnapshot>
     */
    public function latestRankingSnapshotsByRegionCode(string $regionCode): Collection
    {
        /*
         * Ranking Query の current 候補です。
         * Repository は active / region / 最新 snapshot という DB 取得条件だけを閉じ、
         * 増加量や伸び率、ランキングとしての意味づけは Service / Action 側へ残します。
         *
         * orderBy は「current 候補の返却順」を安定させるためのものです。
         * collected_at / id 順はランキング指標ではないため、この段階で表示件数 limit をかけると、
         * 後段の metric sort では上位になるはずの動画を計算前に除外してしまいます。
         * そのため Repository は候補を全件返し、limit は Action 側の metric 計算と sort 後にだけ適用します。
         */
        return DanceShortVideoSnapshot::query()
            ->with(['video', 'region'])
            ->whereHas('region', fn ($query) => $query->where('code', $regionCode))
            ->whereHas('video', fn ($query) => $query->where('tracking_status', 'active'))
            ->whereNotExists(function ($query): void {
                /*
                 * video_id + region_id の組み合わせごとに「より新しい snapshot が存在しない行」だけを残します。
                 * collected_at が同一秒で重なる可能性があるため、同時刻の場合は id が大きい行を新しい行として扱い、
                 * latestForVideoAndRegion() と同じ安定した tie-break にそろえています。
                 */
                $query->selectRaw('1')
                    ->from('dance_short_video_snapshots as later_snapshots')
                    ->whereColumn('later_snapshots.video_id', 'dance_short_video_snapshots.video_id')
                    ->whereColumn('later_snapshots.region_id', 'dance_short_video_snapshots.region_id')
                    ->where(function ($query): void {
                        $query->whereColumn(
                            'later_snapshots.collected_at',
                            '>',
                            'dance_short_video_snapshots.collected_at',
                        )->orWhere(function ($query): void {
                            $query->whereColumn(
                                'later_snapshots.collected_at',
                                'dance_short_video_snapshots.collected_at',
                            )->whereColumn('later_snapshots.id', '>', 'dance_short_video_snapshots.id');
                        });
                    });
            })
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->get();
    }

    public function latestSnapshotAtOrBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $cutoffAt,
    ): ?DanceShortVideoSnapshot {
        /*
         * current の収集時刻から comparisonDays 分だけ戻した cutoffAt を受け取り、
         * その時刻以前で最も新しい snapshot を previous として返します。
         * cutoff より後の snapshot は「比較期間に満たない観測値」なので、ここでは採用しません。
         */
        return DanceShortVideoSnapshot::query()
            ->where('video_id', $videoId)
            ->where('region_id', $regionId)
            ->where('collected_at', '<=', $cutoffAt->toDateTimeString())
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();
    }

    public function latestSnapshotBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $currentCollectedAt,
        int $currentSnapshotId,
    ): ?DanceShortVideoSnapshot {
        /*
         * 初回同期から十分な日数が経っていない環境では、
         * current - comparisonDays 以前の snapshot がまだ存在しないことがあります。
         * その場合でも同じ video / region に直前 snapshot があれば通常ランキングとして表示できるため、
         * current より古い行を collected_at / id の stable tie-break で取得します。
         *
         * Repository は「current より古い DB 行」の取得条件だけを持ちます。
         * この fallback をいつ使うか、表示上どう扱うかは Action / Responder 側へ残します。
         */
        return DanceShortVideoSnapshot::query()
            ->where('video_id', $videoId)
            ->where('region_id', $regionId)
            ->where(function ($query) use ($currentCollectedAt, $currentSnapshotId): void {
                $query->where('collected_at', '<', $currentCollectedAt->toDateTimeString())
                    ->orWhere(function ($query) use ($currentCollectedAt, $currentSnapshotId): void {
                        $query->where('collected_at', $currentCollectedAt->toDateTimeString())
                            ->where('id', '<', $currentSnapshotId);
                    });
            })
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();
    }

    public function deleteCollectedBefore(CarbonInterface $cutoffAt): int
    {
        /*
         * 物理削除の対象は保持期間を超えた snapshot だけです。
         * video / region / keyword / category はここでは削除しません。
         */
        return DanceShortVideoSnapshot::query()
            ->where('collected_at', '<', $cutoffAt->toDateTimeString())
            ->delete();
    }
}
