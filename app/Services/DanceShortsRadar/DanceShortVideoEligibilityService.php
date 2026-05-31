<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use Carbon\CarbonInterface;
use DateInterval;
use Throwable;

class DanceShortVideoEligibilityService
{
    private const SHORTS_MAX_DURATION_SECONDS = 180;

    public function isShortsTarget(YouTubeVideoDetailDTO $detail): bool
    {
        /*
         * search.list の videoDuration=short は「4分未満」の絞り込みにすぎません。
         * この Service では videos.list の contentDetails.duration を最終入力にして、
         * DanceShortsRadar が保存対象にする Shorts 長の動画だけを通します。
         *
         * duration が欠落・不正・0秒の場合は、YouTube 側の実測値として信用できないため
         * 保存対象外にします。
         */
        $durationSeconds = $this->durationSeconds($detail->duration);

        return $durationSeconds !== null
            && $durationSeconds > 0
            && $durationSeconds <= self::SHORTS_MAX_DURATION_SECONDS;
    }

    public function hasRequiredPersistenceFields(YouTubeVideoDetailDTO $detail): bool
    {
        /*
         * 動画本体と snapshot を保存するための最低条件です。
         *
         * title は dance_short_videos.title が nullable ではないため必須にし、
         * viewCount は snapshot の実測値として保存するため必須にします。
         * viewCount 欠落時に 0 を補完すると「実際に0回再生」と「APIで未取得」を区別できないため、
         * Factory や Repository へ進む前に保存対象外へ倒します。
         */
        return trim($detail->youtubeVideoId) !== ''
            && trim((string) $detail->title) !== ''
            && $detail->viewCount !== null;
    }

    /**
     * @return array{
     *     viewCountDelta: int|null,
     *     viewGrowthRate: float|null,
     *     viewsPerHour: float|null
     * }
     */
    public function calculateSnapshotMetrics(
        ?int $previousViewCount,
        ?CarbonInterface $previousCollectedAt,
        int $currentViewCount,
        CarbonInterface $currentCollectedAt,
    ): array {
        /*
         * ここで返す値はランキングや上昇候補判定に使える派生値ですが、
         * dance_short_video_snapshots へ保存する値ではありません。
         * snapshot テーブルには取得時点の公開指標だけを積み、差分や伸び率は
         * 必要なタイミングで前回 snapshot と比較して再計算できる形にします。
         */
        if ($previousViewCount === null || $previousCollectedAt === null) {
            return [
                'viewCountDelta' => null,
                'viewGrowthRate' => null,
                'viewsPerHour' => null,
            ];
        }

        $viewCountDelta = $currentViewCount - $previousViewCount;
        $hours = $previousCollectedAt->diffInSeconds($currentCollectedAt, false) / 3600;

        return [
            'viewCountDelta' => $viewCountDelta,
            'viewGrowthRate' => $previousViewCount > 0 ? $viewCountDelta / $previousViewCount : null,
            'viewsPerHour' => $hours > 0.0 ? $viewCountDelta / $hours : null,
        ];
    }

    private function durationSeconds(?string $duration): ?int
    {
        /*
         * YouTube の contentDetails.duration は ISO 8601 duration 形式です。
         * DateInterval に解釈を任せることで、PT58S / PT1M30S / PT3M のような表記差分を
         * 独自パースで壊さず扱います。不正値は例外を外へ出さず null にそろえ、
         * 呼び出し側では「保存対象外」として扱えるようにします。
         */
        $duration = is_string($duration) ? trim($duration) : '';

        if ($duration === '') {
            return null;
        }

        try {
            $interval = new DateInterval($duration);
        } catch (Throwable) {
            return null;
        }

        if ($interval->y > 0 || $interval->m > 0) {
            return null;
        }

        return ($interval->d * 86400)
            + ($interval->h * 3600)
            + ($interval->i * 60)
            + $interval->s;
    }
}
