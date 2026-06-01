<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateListDTO;

/*
 * DanceShortsRadar の上昇候補判定を担当する Service です。
 *
 * Repository には「US / KR / JP の最新 snapshot と比較元 snapshot を取る条件」だけを置き、
 * その snapshot から作られた通常ランキング DTO をこの Service が比較します。上昇候補かどうかは
 * 「海外側で増加している」「JP 側が未観測、または JP 側の増加量が海外側より小さい」という業務判断なので、
 * DB query 境界の Repository ではなく Service に閉じます。
 *
 * この Service は既に計算済みの RankingItemDTO を受け取り、view_count_delta / view_growth_rate を
 * 再計算しません。null metric も 0 に潰さず、候補除外や表示用 DTO の null として扱います。
 */
class DanceShortRisingCandidateService
{
    /**
     * @var array<int, string>
     */
    private const SOURCE_REGION_CODES = ['US', 'KR'];

    public const JAPAN_STATUS_UNOBSERVED = 'unobserved';

    public const JAPAN_STATUS_SMALLER_DELTA = 'smaller_delta';

    /**
     * @param  array<int, DanceShortVideoRankingItemDTO>  $sourceItems
     * @param  array<int, DanceShortVideoRankingItemDTO>  $japanItems
     */
    public function buildRisingCandidates(
        array $sourceItems,
        array $japanItems,
        int $limit,
    ): DanceShortVideoRisingCandidateListDTO {
        $japanItemsByYoutubeVideoId = [];

        foreach ($japanItems as $japanItem) {
            $japanItemsByYoutubeVideoId[$japanItem->youtubeVideoId] = $japanItem;
        }

        $candidates = [];

        foreach ($sourceItems as $sourceItem) {
            if (! in_array($sourceItem->regionCode, self::SOURCE_REGION_CODES, true)) {
                continue;
            }

            /*
             * source 側の viewCountDelta が null の動画は、海外側で伸びているかを判断できません。
             * null を 0 として扱うと「算出不可」と「増加なし」が混ざるため、候補には入れません。
             * また、上昇候補は観測優先候補であり、増加していない動画を含めるものではありません。
             */
            if ($sourceItem->viewCountDelta === null || $sourceItem->viewCountDelta <= 0) {
                continue;
            }

            $japanItem = $japanItemsByYoutubeVideoId[$sourceItem->youtubeVideoId] ?? null;
            $japanComparisonStatus = $this->japanComparisonStatus($sourceItem, $japanItem);

            if ($japanComparisonStatus === null) {
                continue;
            }

            $candidates[] = new DanceShortVideoRisingCandidateDTO(
                videoId: $sourceItem->videoId,
                youtubeVideoId: $sourceItem->youtubeVideoId,
                title: $sourceItem->title,
                channelTitle: $sourceItem->channelTitle,
                thumbnailUrl: $sourceItem->thumbnailUrl,
                url: $sourceItem->url,
                publishedAt: $sourceItem->publishedAt,
                sourceRegionCode: $sourceItem->regionCode,
                sourceRegionName: $sourceItem->regionName,
                sourceCurrentViewCount: $sourceItem->currentViewCount,
                sourcePreviousViewCount: $sourceItem->previousViewCount,
                sourceViewCountDelta: $sourceItem->viewCountDelta,
                sourceViewGrowthRate: $sourceItem->viewGrowthRate,
                sourceViewsPerHour: $sourceItem->viewsPerHour,
                sourceCurrentCollectedAt: $sourceItem->currentCollectedAt,
                sourcePreviousCollectedAt: $sourceItem->previousCollectedAt,
                japanCurrentViewCount: $japanItem?->currentViewCount,
                japanPreviousViewCount: $japanItem?->previousViewCount,
                japanViewCountDelta: $japanItem?->viewCountDelta,
                japanViewGrowthRate: $japanItem?->viewGrowthRate,
                japanViewsPerHour: $japanItem?->viewsPerHour,
                japanCurrentCollectedAt: $japanItem?->currentCollectedAt,
                japanPreviousCollectedAt: $japanItem?->previousCollectedAt,
                japanComparisonStatus: $japanComparisonStatus,
                comparisonDays: $sourceItem->comparisonDays,
            );
        }

        /*
         * 上昇候補はユーザー選択の sortKey ではなく、固定の上昇候補順で並べます。
         * 海外側の増加量、海外側の伸び率、JP 側 delta の小ささ、source snapshot の新しさを順に使い、
         * React 側ではこの順序を再計算しません。
         */
        $sortedCandidates = $this->uniqueByYoutubeVideoId($this->sortedCandidates($candidates));

        return new DanceShortVideoRisingCandidateListDTO(
            array_slice($sortedCandidates, 0, max(1, $limit)),
        );
    }

    private function japanComparisonStatus(
        DanceShortVideoRankingItemDTO $sourceItem,
        ?DanceShortVideoRankingItemDTO $japanItem,
    ): ?string {
        if ($japanItem === null) {
            return self::JAPAN_STATUS_UNOBSERVED;
        }

        /*
         * JP 側の viewCountDelta が null の場合も 0 扱いにはしません。
         * 今回の候補条件は「JP 未観測」または「JP delta が海外側より小さい」なので、
         * JP に current はあるが比較値が算出できない動画は、条件を満たしたものとして扱いません。
         */
        if ($japanItem->viewCountDelta === null) {
            return null;
        }

        return $japanItem->viewCountDelta < $sourceItem->viewCountDelta
            ? self::JAPAN_STATUS_SMALLER_DELTA
            : null;
    }

    /**
     * @param  array<int, DanceShortVideoRisingCandidateDTO>  $candidates
     * @return array<int, DanceShortVideoRisingCandidateDTO>
     */
    private function sortedCandidates(array $candidates): array
    {
        usort($candidates, function (
            DanceShortVideoRisingCandidateDTO $first,
            DanceShortVideoRisingCandidateDTO $second,
        ): int {
            return ($second->sourceViewCountDelta <=> $first->sourceViewCountDelta)
                ?: $this->compareNullableDesc($first->sourceViewGrowthRate, $second->sourceViewGrowthRate)
                ?: $this->compareJapanDeltaAsc($first->japanViewCountDelta, $second->japanViewCountDelta)
                ?: strcmp(
                    $second->sourceCurrentCollectedAt->toDateTimeString(),
                    $first->sourceCurrentCollectedAt->toDateTimeString(),
                )
                ?: ($first->videoId <=> $second->videoId);
        });

        return $candidates;
    }

    private function compareNullableDesc(?float $first, ?float $second): int
    {
        if ($first === null && $second !== null) {
            return 1;
        }

        if ($first !== null && $second === null) {
            return -1;
        }

        return $second <=> $first;
    }

    private function compareJapanDeltaAsc(?int $first, ?int $second): int
    {
        if ($first === null && $second !== null) {
            return -1;
        }

        if ($first !== null && $second === null) {
            return 1;
        }

        return $first <=> $second;
    }

    /**
     * @param  array<int, DanceShortVideoRisingCandidateDTO>  $candidates
     * @return array<int, DanceShortVideoRisingCandidateDTO>
     */
    private function uniqueByYoutubeVideoId(array $candidates): array
    {
        $seenYoutubeVideoIds = [];
        $uniqueCandidates = [];

        foreach ($candidates as $candidate) {
            if (isset($seenYoutubeVideoIds[$candidate->youtubeVideoId])) {
                continue;
            }

            $seenYoutubeVideoIds[$candidate->youtubeVideoId] = true;
            $uniqueCandidates[] = $candidate;
        }

        return $uniqueCandidates;
    }
}
