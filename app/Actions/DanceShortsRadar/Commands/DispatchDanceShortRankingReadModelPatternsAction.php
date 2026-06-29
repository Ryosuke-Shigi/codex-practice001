<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDispatchResultDTO;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelPatternJob;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelPatternService;
use Carbon\CarbonImmutable;

/**
 * enabled な ranking read model pattern build Job を dispatch する Command Action です。
 *
 * 定期 refresh / 手動 command の共通入口として、normal / summary / rising の enabled pattern を同じ経路へ流します。
 */
final readonly class DispatchDanceShortRankingReadModelPatternsAction
{
    public function __construct(
        private DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private DanceShortRankingReadModelPatternService $patternService,
    ) {}

    public function execute(): RankingReadModelPatternDispatchResultDTO
    {
        $definitions = $this->patternService->enabledDefinitions($this->activeRegionCodes());
        $normalPatternCount = 0;
        $summaryPatternCount = 0;
        $risingPatternCount = 0;
        $patternKeys = [];

        foreach ($definitions as $definition) {
            BuildDanceShortRankingReadModelPatternJob::dispatch($definition->patternKey);
            $patternKeys[] = $definition->patternKey;

            if ($definition->rankingType === RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY) {
                $summaryPatternCount++;
            } elseif ($definition->rankingType === RankingReadModelPatternDefinitionDTO::TYPE_RISING) {
                $risingPatternCount++;
            } else {
                $normalPatternCount++;
            }
        }

        return new RankingReadModelPatternDispatchResultDTO(
            dispatchedPatternCount: count($definitions),
            normalPatternCount: $normalPatternCount,
            summaryPatternCount: $summaryPatternCount,
            risingPatternCount: $risingPatternCount,
            patternKeys: $patternKeys,
            dispatchedAt: CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo')),
        );
    }

    /**
     * @return array<int, string>
     */
    private function activeRegionCodes(): array
    {
        return $this->searchTargetRepository
            ->activeRegions()
            ->map(fn (DanceShortRegion $region): string => (string) $region->code)
            ->values()
            ->all();
    }
}
