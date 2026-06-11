<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * EChartsOption 生成の元になる metric 別の時系列 DTO です。
 *
 * option 本体は Responder で生成し、この DTO は Laravel 内部のデータ境界に留めます。
 */
final readonly class DanceShortsAnalyzerMetricSeriesDTO
{
    /**
     * @param  array<int, int|null>  $values
     */
    public function __construct(
        public string $metricKey,
        public string $label,
        public array $values,
    ) {}
}
