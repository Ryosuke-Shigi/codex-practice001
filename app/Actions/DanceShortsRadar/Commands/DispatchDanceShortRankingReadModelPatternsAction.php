<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDispatchResultDTO;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelPatternJob;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelPatternService;
use Carbon\CarbonImmutable;

/**
 * enabled な ranking read model pattern build Job を dispatch する Command Action です。
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
        $patternKeys = [];

        foreach ($definitions as $definition) {
            BuildDanceShortRankingReadModelPatternJob::dispatch($definition->patternKey);
            $patternKeys[] = $definition->patternKey;

            $normalPatternCount++;
        }

        return new RankingReadModelPatternDispatchResultDTO(
            dispatchedPatternCount: count($definitions),
            normalPatternCount: $normalPatternCount,
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
