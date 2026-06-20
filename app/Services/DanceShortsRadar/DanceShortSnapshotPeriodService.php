<?php

namespace App\Services\DanceShortsRadar;

use App\Support\ApplicationTimeZone;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class DanceShortSnapshotPeriodService
{
    /**
     * @return array{start: CarbonImmutable, end: CarbonImmutable}
     */
    public function jstTwelveHourPeriod(CarbonInterface $baseAt): array
    {
        /*
         * snapshot の集約枠はアプリケーション timezone の 00:00-11:59 / 12:00-23:59 です。
         * このポートフォリオでは APP_TIMEZONE=Asia/Tokyo を前提にし、Repository へ渡す境界も
         * UTC へ戻さず JST のまま扱います。
         */
        $baseJst = CarbonImmutable::instance($baseAt)->setTimezone(ApplicationTimeZone::name());
        $periodStartJst = $baseJst
            ->startOfDay()
            ->addHours($baseJst->hour < 12 ? 0 : 12);

        return [
            'start' => $periodStartJst,
            'end' => $periodStartJst->addHours(12),
        ];
    }
}
