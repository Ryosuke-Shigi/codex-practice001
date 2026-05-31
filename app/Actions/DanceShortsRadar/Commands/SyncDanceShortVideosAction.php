<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSaveDTOFactory;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortVideoEligibilityService;
use App\Services\DanceShortsRadar\DanceShortVideoTrackingService;
use Carbon\CarbonImmutable;
use Throwable;

class SyncDanceShortVideosAction
{
    public function __construct(
        private readonly YouTubeVideoApiRepositoryInterface $youTubeVideoApiRepository,
        private readonly DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private readonly DanceShortVideoRepositoryInterface $videoRepository,
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortVideoEligibilityService $eligibilityService,
        private readonly DanceShortVideoTrackingService $trackingService,
        private readonly DanceShortVideoSaveDTOFactory $videoSaveDTOFactory,
        private readonly DanceShortVideoSnapshotCreateDTOFactory $snapshotCreateDTOFactory,
        private readonly CleanupDanceShortVideoSnapshotsAction $cleanupAction,
    ) {
    }

    public function execute(): DanceShortVideoSyncResultDTO
    {
        /*
         * この Action は DanceShortsRadar 同期の「進行表」だけを担当します。
         *
         * region / keyword の取得、YouTube API 呼び出し、保存可否判断、DB 保存は
         * それぞれ Repository / Service / Factory へ委譲し、ここでは呼び出し順と
         * ResultDTO 用の件数集計だけを扱います。Action に Eloquent query や Shorts 判定を
         * 書き始めると、Job / Command から呼んだときにも責務境界が崩れるため、
         * このメソッド内の分岐は「次工程へ進むか」「件数をどう数えるか」に限定します。
         */
        $executedAt = CarbonImmutable::now();
        $collectedAt = $executedAt->utc();
        $regions = $this->searchTargetRepository->activeRegions();

        $searchedKeywordCount = 0;
        $fetchedVideoCount = 0;
        $fetchedVideoDetailCount = 0;
        $insertedVideoCount = 0;
        $updatedVideoCount = 0;
        $savedSnapshotCount = 0;
        $skippedVideoCount = 0;
        $skippedSnapshotByTrackingCount = 0;
        $excludedByShortsCount = 0;
        $skippedPersistenceCount = 0;
        $failedCount = 0;

        foreach ($regions as $region) {
            /*
             * region は検索条件と snapshot の地域文脈に使います。
             * 動画本体は地域に属さない集約なので、region_id は dance_short_videos ではなく
             * snapshot 側にだけ保存します。
             */
            $keywords = $this->searchTargetRepository->activeKeywordsForRegion($region);
            $searchedKeywordCount += $keywords->count();

            $youtubeVideoIds = $this->collectYoutubeVideoIds($region, $keywords, $executedAt, $failedCount);
            $fetchedVideoCount += count($youtubeVideoIds);

            if ($youtubeVideoIds === []) {
                continue;
            }

            try {
                /*
                 * search.list の結果だけでは duration / statistics を持てないため、
                 * 保存判定と snapshot 保存の前に videos.list の詳細 DTO へ進みます。
                 * ここで返る詳細件数は、検索で得た ID 件数と一致しない可能性があるため
                 * fetchedVideoCount とは別に fetchedVideoDetailCount として集計します。
                 */
                $details = $this->youTubeVideoApiRepository->fetchVideoDetails($youtubeVideoIds);
            } catch (Throwable) {
                $failedCount += count($youtubeVideoIds);
                continue;
            }

            $fetchedVideoDetailCount += count($details);

            foreach ($details as $detail) {
                /*
                 * YouTube の videoDuration=short は「4分未満」の検索条件であり、
                 * DanceShortsRadar が保存対象にする Shorts 確定条件ではありません。
                 * contentDetails.duration を使った最終判定は Service に寄せ、
                 * Action は除外件数だけを受け持ちます。
                 */
                if (! $this->eligibilityService->isShortsTarget($detail)) {
                    $excludedByShortsCount++;
                    continue;
                }

                /*
                 * DB 保存に必要な最低限の実測値がない動画は保存対象外として数えます。
                 * viewCount がない場合に snapshot へ 0 を補完すると「取得時点の実測値」と
                 * 区別できなくなるため、Factory へ渡す前に Service 境界で止めます。
                 */
                if (! $this->eligibilityService->hasRequiredPersistenceFields($detail)) {
                    $skippedPersistenceCount++;
                    continue;
                }

                try {
                    /*
                     * 動画本体の保存値と snapshot の保存値は別 DTO に分けます。
                     * statistics は dance_short_videos へ入れず、取得時点の公開指標として
                     * dance_short_video_snapshots へだけ追加保存します。
                     */
                    $saveResult = $this->videoRepository->upsert(
                        $this->videoSaveDTOFactory->fromYouTubeVideoDetail($detail),
                    );

                    match ($saveResult['status']) {
                        DanceShortVideoRepositoryInterface::UPSERT_INSERTED => $insertedVideoCount++,
                        DanceShortVideoRepositoryInterface::UPSERT_UPDATED => $updatedVideoCount++,
                        default => $skippedVideoCount++,
                    };

                    $video = $saveResult['video'];

                    if (! $this->trackingService->isSnapshotSaveTarget($video->tracking_status)) {
                        /*
                         * inactive / archived の動画本体は削除せず、状態で追跡対象外を表現します。
                         * snapshot は active の動画だけに積み、比較や再観測に使わない履歴が
                         * 無制限に増え続けないようここで止めます。
                         */
                        $skippedSnapshotByTrackingCount++;
                        continue;
                    }

                    $previousSnapshot = $this->snapshotRepository->latestForVideoAndRegion(
                        (int) $video->getKey(),
                        (int) $region->getKey(),
                    );
                    $snapshotDTO = $this->snapshotCreateDTOFactory->fromYouTubeVideoDetail(
                        detail: $detail,
                        videoId: (int) $video->getKey(),
                        regionId: (int) $region->getKey(),
                        collectedAt: $collectedAt,
                    );

                    if ($previousSnapshot !== null) {
                        /*
                         * 前回 snapshot との差分はここで計算できますが、今回は上昇候補判定や
                         * ランキング生成までは行いません。派生値は DB カラムへ保存せず、
                         * 将来の判定 Service が参照できる計算境界だけを確認するために呼びます。
                         */
                        $this->eligibilityService->calculateSnapshotMetrics(
                            previousViewCount: $previousSnapshot->view_count,
                            previousCollectedAt: $previousSnapshot->collected_at,
                            currentViewCount: $snapshotDTO->view_count,
                            currentCollectedAt: $snapshotDTO->collected_at,
                        );
                    }

                    $this->snapshotRepository->create($snapshotDTO);
                    $savedSnapshotCount++;
                } catch (Throwable) {
                    $failedCount++;
                }
            }
        }

        $cleanupResult = $this->cleanupAction->execute($executedAt);

        return new DanceShortVideoSyncResultDTO(
            executedAt: $executedAt,
            searchedRegionCount: $regions->count(),
            searchedKeywordCount: $searchedKeywordCount,
            fetchedVideoCount: $fetchedVideoCount,
            fetchedVideoDetailCount: $fetchedVideoDetailCount,
            insertedVideoCount: $insertedVideoCount,
            updatedVideoCount: $updatedVideoCount,
            /*
             * savedVideoCount は既存 ResultDTO 名を残すための互換的な集計です。
             * 新規/更新の内訳は insertedVideoCount / updatedVideoCount で別途返します。
             * upsert 結果が skip の場合でも snapshot は取得時点の観測値なので保存します。
             */
            savedVideoCount: $insertedVideoCount + $updatedVideoCount,
            savedSnapshotCount: $savedSnapshotCount,
            skippedVideoCount: $skippedVideoCount,
            skippedSnapshotByTrackingCount: $skippedSnapshotByTrackingCount,
            excludedByShortsCount: $excludedByShortsCount,
            skippedPersistenceCount: $skippedPersistenceCount,
            cleanedUpSnapshotCount: $cleanupResult->deletedSnapshotCount,
            failedCount: $failedCount,
        );
    }

    /**
     * @param  iterable<int, DanceShortSearchKeyword>  $keywords
     * @return array<int, string>
     */
    private function collectYoutubeVideoIds(
        DanceShortRegion $region,
        iterable $keywords,
        CarbonImmutable $executedAt,
        int &$failedCount,
    ): array {
        /*
         * 複数 keyword から同じ動画 ID が返ることがあります。
         * videos.list は ID の重複送信が不要なので、連想配列のキーに youtubeVideoId を使って
         * Action 境界で重複を潰します。動画の採用可否はまだ判断せず、詳細取得へ進む
         * 候補 ID の集合を作るだけに留めます。
         */
        $youtubeVideoIds = [];

        foreach ($keywords as $keyword) {
            try {
                $items = $this->youTubeVideoApiRepository->searchVideos(
                    $this->searchCondition($region, $keyword, $executedAt),
                );
            } catch (Throwable) {
                $failedCount++;
                continue;
            }

            foreach ($items as $item) {
                $youtubeVideoId = trim($item->youtubeVideoId);

                if ($youtubeVideoId !== '') {
                    $youtubeVideoIds[$youtubeVideoId] = $youtubeVideoId;
                }
            }
        }

        return array_values($youtubeVideoIds);
    }

    private function searchCondition(
        DanceShortRegion $region,
        DanceShortSearchKeyword $keyword,
        CarbonImmutable $executedAt,
    ): DanceShortSearchConditionDTO {
        /*
         * YouTube API 固有の固定パラメータ part/type/key は Repository 側に置きます。
         * ここでは region / keyword / 公開日範囲のようにユースケースが決める可変条件だけを
         * DTO に詰め、Repository へ配列や Model を直接渡さない境界を保ちます。
         */
        return new DanceShortSearchConditionDTO(
            keyword: $keyword->keyword,
            regionCode: $region->code,
            relevanceLanguage: $this->relevanceLanguage($region->code),
            maxResults: $this->discoverMaxResults(),
            publishedAfter: $executedAt->subDays($this->publishedAfterDays())->utc(),
            videoDuration: 'short',
        );
    }

    private function relevanceLanguage(string $regionCode): string
    {
        /*
         * YouTube の relevanceLanguage は検索結果の言語ヒントです。
         * region.code と完全には同じ概念ではないため、現時点で扱う JP / KR / US だけを
         * 明示的に写像し、未定義の地域は小文字コードへフォールバックします。
         */
        return match (strtoupper($regionCode)) {
            'JP' => 'ja',
            'KR' => 'ko',
            'US' => 'en',
            default => strtolower($regionCode),
        };
    }

    private function discoverMaxResults(): int
    {
        $maxResults = (int) config('services.youtube.discover_max_results', 25);

        /*
         * YouTube search.list の maxResults は 1..50 の範囲です。
         * .env の値が範囲外でも API Repository に不正値を渡さないよう、
         * Action 境界でユースケース設定として丸めます。
         */
        return max(1, min($maxResults, 50));
    }

    private function publishedAfterDays(): int
    {
        return max(0, (int) config('services.youtube.discover_published_after_days', 7));
    }
}
