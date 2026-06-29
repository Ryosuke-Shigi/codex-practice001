<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use InvalidArgumentException;

/**
 * Ranking read model の pattern 定義、enabled 判定、max rows 解決を担当する Service です。
 */
final class DanceShortRankingReadModelPatternService
{
    public function keyFor(
        string $rankingType,
        string $scope,
        int $comparisonDays,
        ?string $sortKey = null,
    ): string {
        $rankingType = strtolower($rankingType);

        if ($rankingType !== RankingReadModelPatternDefinitionDTO::TYPE_NORMAL) {
            throw new InvalidArgumentException('Only normal ranking read model patterns are handled here.');
        }

        if ($sortKey === null || $sortKey === '') {
            throw new InvalidArgumentException('Ranking read model pattern sort key is required.');
        }

        return implode('|', [$rankingType, $scope, $comparisonDays, $sortKey]);
    }

    public function definitionForOptions(
        string $rankingType,
        string $scope,
        int $comparisonDays,
        ?string $sortKey = null,
    ): RankingReadModelPatternDefinitionDTO {
        return $this->definitionForKey($this->keyFor($rankingType, $scope, $comparisonDays, $sortKey));
    }

    public function definitionForKey(string $patternKey): RankingReadModelPatternDefinitionDTO
    {
        $maxRowsByPattern = $this->maxRowsByPattern();

        if (! array_key_exists($patternKey, $maxRowsByPattern)) {
            throw new InvalidArgumentException('Undefined ranking read model pattern: '.$patternKey);
        }

        $definition = $this->definitionFromKey($patternKey, (int) $maxRowsByPattern[$patternKey]);

        if (! $definition->enabled) {
            throw new InvalidArgumentException('Disabled ranking read model pattern: '.$patternKey);
        }

        return $definition;
    }

    public function maxRowsForPattern(string $patternKey): int
    {
        return $this->definitionForKey($patternKey)->maxRows;
    }

    /**
     * @param  array<int, string>  $activeRegionCodes
     * @return array<int, RankingReadModelPatternDefinitionDTO>
     */
    public function enabledDefinitions(array $activeRegionCodes): array
    {
        $activeRegionCodes = array_values(array_unique(array_filter(
            $activeRegionCodes,
            fn (string $regionCode): bool => $regionCode !== '',
        )));
        $definitions = [];

        foreach ($this->maxRowsByPattern() as $patternKey => $maxRows) {
            $definition = $this->definitionFromKey((string) $patternKey, (int) $maxRows);

            if (! $definition->enabled) {
                continue;
            }

            if ($definition->rankingType === RankingReadModelPatternDefinitionDTO::TYPE_NORMAL
                && ! in_array($definition->scope, $activeRegionCodes, true)) {
                continue;
            }

            $definitions[] = $definition;
        }

        return $definitions;
    }

    /**
     * @return array<string, int>
     */
    private function maxRowsByPattern(): array
    {
        $value = config('dance_short.ranking_read_model.pattern_max_rows', []);

        if (! is_array($value)) {
            return [];
        }

        return $value;
    }

    /**
     * @return array<int, string>
     */
    private function disabledPatternKeys(): array
    {
        $value = config('dance_short.ranking_read_model.disabled_patterns', []);

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(
            array_map(fn (mixed $patternKey): string => is_string($patternKey) ? $patternKey : '', $value),
            fn (string $patternKey): bool => $patternKey !== '',
        ));
    }

    private function definitionFromKey(string $patternKey, int $maxRows): RankingReadModelPatternDefinitionDTO
    {
        $parts = explode('|', $patternKey);

        if (count($parts) !== 4 || ! is_numeric($parts[2])) {
            throw new InvalidArgumentException('Invalid ranking read model pattern key: '.$patternKey);
        }

        [$rankingType, $scope, $comparisonDays, $sortKey] = $parts;
        $comparisonDays = (int) $comparisonDays;

        if ($maxRows <= 0) {
            throw new InvalidArgumentException('Ranking read model pattern max rows must be positive: '.$patternKey);
        }

        if ($rankingType !== RankingReadModelPatternDefinitionDTO::TYPE_NORMAL) {
            throw new InvalidArgumentException('Invalid normal ranking read model pattern type: '.$patternKey);
        }

        return new RankingReadModelPatternDefinitionDTO(
            patternKey: $patternKey,
            rankingType: $rankingType,
            scope: $scope,
            comparisonDays: $comparisonDays,
            sortKey: $sortKey,
            maxRows: $maxRows,
            enabled: ! in_array($patternKey, $this->disabledPatternKeys(), true),
        );
    }
}
