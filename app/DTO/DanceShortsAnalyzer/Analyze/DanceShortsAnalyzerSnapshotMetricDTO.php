<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * snapshot 間の差分と 1 時間あたり増加量を持つ DTO です。
 *
 * previous がない、時間差が 0 以下、like / comment のどちらかが null の場合は、
 * 計算不能を null として保持します。0 へ丸める判断は持ちません。
 */
final readonly class DanceShortsAnalyzerSnapshotMetricDTO
{
    public function __construct(
        public DanceShortsAnalyzerSnapshotPointDTO $snapshot,
        public ?DanceShortsAnalyzerSnapshotPointDTO $previousSnapshot,
        public ?float $hours,
        public ?int $viewDelta,
        public ?int $likeDelta,
        public ?int $commentDelta,
        public ?float $viewPerHour,
        public ?float $likePerHour,
        public ?float $commentPerHour,
    ) {}
}
