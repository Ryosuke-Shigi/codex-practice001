<?php

namespace App\Services\DanceShortsRadar;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class DanceShortSnapshotPeriodService
{
    private const OBSERVATION_TIMEZONE = 'Asia/Tokyo';

    /**
     * @return array{start: CarbonImmutable, end: CarbonImmutable}
     */
    public function jstTwelveHourPeriod(CarbonInterface $baseAt): array
    {
        /*
         * snapshot の集約枠は JST の 00:00-11:59 / 12:00-23:59 です。
         * DB の collected_at は UTC で保存されるため、枠の判定時だけ JST に直し、
         * Repository へ渡す境界は UTC へ戻します。
         */
        $baseJst = CarbonImmutable::instance($baseAt)->setTimezone(self::OBSERVATION_TIMEZONE);
        $periodStartJst = $baseJst
            ->startOfDay()
            ->addHours($baseJst->hour < 12 ? 0 : 12);

        return [
            'start' => $periodStartJst->utc(),
            'end' => $periodStartJst->addHours(12)->utc(),
        ];
    }
}
