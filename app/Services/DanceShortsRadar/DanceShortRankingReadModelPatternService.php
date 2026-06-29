<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelSortKey;
use InvalidArgumentException;

/**
 * Ranking read model の pattern 定義、enabled 判定、max rows 解決を担当する Service です。
 */
final class DanceShortRankingReadModelPatternService
{
    /**
     * @var array<int, string>
     */
    private const RISING_SOURCE_REGION_CODES = ['US', 'KR'];

    public function keyFor(
        string $rankingType,
        string $scope,
        int $comparisonDays,
        ?string $sortKey = null,
    ): string {
        $rankingType = strtolower($rankingType);

        return match ($rankingType) {
            RankingReadModelPatternDefinitionDTO::TYPE_NORMAL => $this->normalKey($scope, $comparisonDays, $sortKey),
            RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY => $this->summaryKey($scope, $comparisonDays, $sortKey),
            RankingReadModelPatternDefinitionDTO::TYPE_RISING => $this->risingKey($scope, $comparisonDays),
            default => throw new InvalidArgumentException('Unsupported ranking read model pattern type: '.$rankingType),
        };
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
        $definition = $this->definitionFromKey($patternKey, $this->maxRowsForPatternKey($patternKey));

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
        return array_merge(
            $this->enabledDefinitionsForType(RankingReadModelPatternDefinitionDTO::TYPE_NORMAL, $activeRegionCodes),
            $this->enabledDefinitionsForType(RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY, $activeRegionCodes),
            $this->enabledDefinitionsForType(RankingReadModelPatternDefinitionDTO::TYPE_RISING, $activeRegionCodes),
        );
    }

    /**
     * @param  array<int, string>  $activeRegionCodes
     * @return array<int, RankingReadModelPatternDefinitionDTO>
     */
    public function enabledDefinitionsForType(string $rankingType, array $activeRegionCodes): array
    {
        $activeRegionCodes = $this->normalizeRegionCodes($activeRegionCodes);
        $rankingType = strtolower($rankingType);

        return match ($rankingType) {
            RankingReadModelPatternDefinitionDTO::TYPE_NORMAL => $this->enabledNormalDefinitions($activeRegionCodes),
            RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY => $this->enabledSummaryDefinitions($activeRegionCodes),
            RankingReadModelPatternDefinitionDTO::TYPE_RISING => $this->enabledRisingDefinitions($activeRegionCodes),
            default => throw new InvalidArgumentException('Unsupported ranking read model pattern type: '.$rankingType),
        };
    }

    /**
     * @param  array<int, string>  $activeRegionCodes
     * @return array<int, RankingReadModelPatternDefinitionDTO>
     */
    private function enabledNormalDefinitions(array $activeRegionCodes): array
    {
        $definitions = [];

        foreach ($this->normalMaxRowsByPattern() as $patternKey => $maxRows) {
            $definition = $this->definitionFromKey((string) $patternKey, (int) $maxRows);

            if (! $definition->enabled) {
                continue;
            }

            if (! in_array($definition->scope, $activeRegionCodes, true)) {
                continue;
            }

            $definitions[] = $definition;
        }

        return $definitions;
    }

    /**
     * @param  array<int, string>  $activeRegionCodes
     * @return array<int, RankingReadModelPatternDefinitionDTO>
     */
    private function enabledSummaryDefinitions(array $activeRegionCodes): array
    {
        if ($activeRegionCodes === []) {
            return [];
        }

        $definitions = [];

        foreach (DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS as $comparisonDays) {
            foreach (DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS as $sortKey) {
                $definition = $this->definitionFromKey(
                    $this->summaryKey(DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE, $comparisonDays, $sortKey),
                    $this->summaryMaxRows(),
                );

                if ($definition->enabled) {
                    $definitions[] = $definition;
                }
            }
        }

        return $definitions;
    }

    /**
     * @param  array<int, string>  $activeRegionCodes
     * @return array<int, RankingReadModelPatternDefinitionDTO>
     */
    private function enabledRisingDefinitions(array $activeRegionCodes): array
    {
        if (array_values(array_intersect(self::RISING_SOURCE_REGION_CODES, $activeRegionCodes)) === []) {
            return [];
        }

        $definitions = [];

        foreach (DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS as $comparisonDays) {
            $definition = $this->definitionFromKey(
                $this->risingKey(DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE, $comparisonDays),
                $this->risingMaxRows(),
            );

            if ($definition->enabled) {
                $definitions[] = $definition;
            }
        }

        return $definitions;
    }

    /**
     * @return array<string, int>
     */
    private function normalMaxRowsByPattern(): array
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

    private function maxRowsForPatternKey(string $patternKey): int
    {
        $parts = explode('|', $patternKey);

        if (count($parts) !== 4) {
            throw new InvalidArgumentException('Invalid ranking read model pattern key: '.$patternKey);
        }

        return match ($parts[0]) {
            RankingReadModelPatternDefinitionDTO::TYPE_NORMAL => $this->normalMaxRowsForPattern($patternKey),
            RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY => $this->summaryMaxRows(),
            RankingReadModelPatternDefinitionDTO::TYPE_RISING => $this->risingMaxRows(),
            default => throw new InvalidArgumentException('Unsupported ranking read model pattern type: '.$parts[0]),
        };
    }

    private function normalMaxRowsForPattern(string $patternKey): int
    {
        $maxRowsByPattern = $this->normalMaxRowsByPattern();

        if (! array_key_exists($patternKey, $maxRowsByPattern)) {
            throw new InvalidArgumentException('Undefined ranking read model pattern: '.$patternKey);
        }

        return (int) $maxRowsByPattern[$patternKey];
    }

    private function summaryMaxRows(): int
    {
        return $this->configuredNonNegativeInt('dance_short.ranking_read_model.summary.max_rows', 0);
    }

    private function risingMaxRows(): int
    {
        return $this->configuredNonNegativeInt('dance_short.ranking_read_model.rising.max_rows', 0);
    }

    private function configuredNonNegativeInt(string $key, int $default): int
    {
        $value = config($key, $default);

        if (! is_numeric($value)) {
            return $default;
        }

        return max(0, (int) $value);
    }

    private function definitionFromKey(string $patternKey, int $maxRows): RankingReadModelPatternDefinitionDTO
    {
        $parts = explode('|', $patternKey);

        if (count($parts) !== 4 || ! is_numeric($parts[2])) {
            throw new InvalidArgumentException('Invalid ranking read model pattern key: '.$patternKey);
        }

        [$rankingType, $scope, $comparisonDays, $sortKey] = $parts;
        $comparisonDays = (int) $comparisonDays;

        if ($rankingType === RankingReadModelPatternDefinitionDTO::TYPE_NORMAL && $maxRows <= 0) {
            throw new InvalidArgumentException('Ranking read model pattern max rows must be positive: '.$patternKey);
        }

        if (! in_array($rankingType, [
            RankingReadModelPatternDefinitionDTO::TYPE_NORMAL,
            RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY,
            RankingReadModelPatternDefinitionDTO::TYPE_RISING,
        ], true)) {
            throw new InvalidArgumentException('Invalid ranking read model pattern type: '.$patternKey);
        }

        if ($rankingType === RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY
            && $scope !== DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE) {
            throw new InvalidArgumentException('Summary ranking read model scope must be ALL: '.$patternKey);
        }

        if ($rankingType === RankingReadModelPatternDefinitionDTO::TYPE_RISING
            && ($scope !== DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE || $sortKey !== RankingReadModelSortKey::RISING)) {
            throw new InvalidArgumentException('Rising ranking read model pattern key is invalid: '.$patternKey);
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

    private function normalKey(string $scope, int $comparisonDays, ?string $sortKey): string
    {
        if ($sortKey === null || $sortKey === '') {
            throw new InvalidArgumentException('Ranking read model pattern sort key is required.');
        }

        return implode('|', [RankingReadModelPatternDefinitionDTO::TYPE_NORMAL, $scope, $comparisonDays, $sortKey]);
    }

    private function summaryKey(string $scope, int $comparisonDays, ?string $sortKey): string
    {
        if ($scope !== DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE) {
            throw new InvalidArgumentException('Summary ranking read model scope must be ALL.');
        }

        if ($sortKey === null || $sortKey === '') {
            throw new InvalidArgumentException('Summary ranking read model sort key is required.');
        }

        return implode('|', [RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY, $scope, $comparisonDays, $sortKey]);
    }

    private function risingKey(string $scope, int $comparisonDays): string
    {
        if ($scope !== DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE) {
            throw new InvalidArgumentException('Rising ranking read model scope must be RISING.');
        }

        return implode('|', [
            RankingReadModelPatternDefinitionDTO::TYPE_RISING,
            $scope,
            $comparisonDays,
            RankingReadModelSortKey::RISING,
        ]);
    }

    /**
     * @param  array<int, string>  $regionCodes
     * @return array<int, string>
     */
    private function normalizeRegionCodes(array $regionCodes): array
    {
        return array_values(array_unique(array_filter(
            $regionCodes,
            fn (string $regionCode): bool => $regionCode !== '',
        )));
    }
}
