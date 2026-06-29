<?php

namespace App\Console\Commands;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelPatternAction;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelPatternService;
use Illuminate\Console\Command;
use Throwable;

/**
 * DanceShortsRadar の上昇候補 ranking read model を enabled pattern 単位で同期生成する Command です。
 */
class DanceShortBuildRisingRankingReadModelsCommand extends Command
{
    protected $signature = 'dance-shorts-radar:build-rising-ranking-read-models';

    protected $description = 'Build DanceShortsRadar rising ranking read model patterns synchronously.';

    public function handle(
        DanceShortRankingReadModelPatternService $patternService,
        DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        BuildDanceShortRankingReadModelPatternAction $action,
    ): int {
        $definitions = $patternService->enabledDefinitionsForType(
            rankingType: RankingReadModelPatternDefinitionDTO::TYPE_RISING,
            activeRegionCodes: $this->activeRegionCodes($searchTargetRepository),
        );
        $builtPatternCount = 0;
        $skippedPatternCount = 0;
        $insertedRowCount = 0;

        try {
            foreach ($definitions as $definition) {
                $result = $action->execute($definition->patternKey);

                if ($result->skipped) {
                    $skippedPatternCount++;

                    continue;
                }

                $builtPatternCount++;
                $insertedRowCount += $result->insertedRowCount;
            }
        } catch (Throwable $exception) {
            $this->error('DanceShortsRadar rising ranking read model patterns build failed.');
            $this->line('error: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info('DanceShortsRadar rising ranking read model patterns built.');
        $this->line('rising_patterns: '.count($definitions));
        $this->line('built_patterns: '.$builtPatternCount);
        $this->line('skipped_patterns: '.$skippedPatternCount);
        $this->line('inserted_rows: '.$insertedRowCount);

        return self::SUCCESS;
    }

    /**
     * @return array<int, string>
     */
    private function activeRegionCodes(DanceShortSearchTargetRepositoryInterface $searchTargetRepository): array
    {
        return $searchTargetRepository
            ->activeRegions()
            ->map(fn (DanceShortRegion $region): string => (string) $region->code)
            ->values()
            ->all();
    }
}
