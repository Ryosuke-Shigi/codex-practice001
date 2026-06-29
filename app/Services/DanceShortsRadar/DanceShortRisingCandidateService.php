<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateListDTO;

/*
 * DanceShortsRadar の上昇候補の意味と JP 比較状態を定義する Service です。
 *
 * buildRisingCandidates() は、通常ランキング DTO 配列から上昇候補 DTO を組み立てる既存経路の正本です。
 * 上昇候補表示の displayCardField では Repository が window 取得のために SQL 上で source / JP /
 * previous snapshot を結合し、snapshot row を prefilter しますが、JP 未観測や JP 側の伸びが小さい
 * という状態値の定義、null metric を 0 に潰さない扱いはこの Service に集約します。
 *
 * この Service は既に計算済みの RankingItemDTO または read model の metric を受け取り、
 * view_count_delta / view_growth_rate を再計算しません。DB query、Inertia props、React 表示構造も
 * ここには置きません。
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
     * 上昇候補 DTO で使う JP 側の比較状態を返します。
     *
     * Repository の snapshot query は DB 上で候補行を prefilter しますが、状態値の意味は
     * この Service で決めます。source delta が算出できない、または増加していない場合や、
     * JP 側に current はあるが比較 delta を算出できない場合は候補状態を返しません。
     */
    public function japanComparisonStatusForCandidate(
        ?int $sourceViewCountDelta,
        bool $hasJapanCurrentSnapshot,
        ?int $japanViewCountDelta,
    ): ?string {
        if ($sourceViewCountDelta === null || $sourceViewCountDelta <= 0) {
            return null;
        }

        if (! $hasJapanCurrentSnapshot) {
            return self::JAPAN_STATUS_UNOBSERVED;
        }

        if ($japanViewCountDelta === null) {
            return null;
        }

        return $japanViewCountDelta < $sourceViewCountDelta
            ? self::JAPAN_STATUS_SMALLER_DELTA
            : null;
    }

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
        /*
         * JP 側の viewCountDelta が null の場合も 0 扱いにはしません。
         * 今回の候補条件は「JP 未観測」または「JP delta が海外側より小さい」なので、
         * JP に current はあるが比較値が算出できない動画は、条件を満たしたものとして扱いません。
         */
        return $this->japanComparisonStatusForCandidate(
            sourceViewCountDelta: $sourceItem->viewCountDelta,
            hasJapanCurrentSnapshot: $japanItem !== null,
            japanViewCountDelta: $japanItem?->viewCountDelta,
        );
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
