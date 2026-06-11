<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * 1 時間あたり増加量表に使う DTO です。
 */
final readonly class DanceShortsAnalyzerPerHourRowDTO
{
    public function __construct(
        public DanceShortsAnalyzerSnapshotPointDTO $snapshot,
        public ?DanceShortsAnalyzerSnapshotPointDTO $previousSnapshot,
        public ?float $hours,
        public ?float $viewPerHour,
        public ?float $likePerHour,
        public ?float $commentPerHour,
    ) {}
}
