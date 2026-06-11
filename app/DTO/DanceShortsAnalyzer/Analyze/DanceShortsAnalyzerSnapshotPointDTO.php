<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

use Carbon\CarbonInterface;

/**
 * 保存済み snapshot 1 点分の DTO です。
 *
 * region 情報も一緒に運びますが、region ごとの集計や差分計算は Service / Action 側で行います。
 */
final readonly class DanceShortsAnalyzerSnapshotPointDTO
{
    public function __construct(
        public int $snapshotId,
        public int $videoId,
        public int $regionId,
        public string $regionCode,
        public string $regionName,
        public int $viewCount,
        public ?int $likeCount,
        public ?int $commentCount,
        public CarbonInterface $collectedAt,
    ) {}
}
