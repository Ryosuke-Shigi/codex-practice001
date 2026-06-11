<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * 増加量表に使う snapshot 間差分 DTO です。
 */
final readonly class DanceShortsAnalyzerDeltaRowDTO
{
    public function __construct(
        public DanceShortsAnalyzerSnapshotPointDTO $snapshot,
        public ?DanceShortsAnalyzerSnapshotPointDTO $previousSnapshot,
        public ?int $viewDelta,
        public ?int $likeDelta,
        public ?int $commentDelta,
    ) {}
}
