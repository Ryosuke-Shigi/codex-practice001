<?php

namespace App\Events\DanceShortsRadar;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * DanceShortsRadar のランキング read model 再生成要求を表す Event です。
 */
final class DanceShortRankingReadModelRefreshRequested
{
    use Dispatchable;

    public CarbonInterface $requestedAt;

    public function __construct(
        public string $source,
        ?CarbonInterface $requestedAt = null,
    ) {
        $this->requestedAt = $requestedAt
            ?? CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));
    }
}
