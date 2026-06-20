<?php

namespace App\Services\DanceShortsRadar;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Throwable;

class DanceShortSnapshotPeriodService
{
    /**
     * @return array{start: CarbonImmutable, end: CarbonImmutable}
     */
    public function jstTwelveHourPeriod(CarbonInterface $baseAt): array
    {
        /*
         * snapshot の集約枠は JST の 00:00-11:59 / 12:00-23:59 です。
         * アプリ標準 timezone を基準に period 境界を作り、Repository へも同じ基準で渡します。
         */
        $baseJst = CarbonImmutable::instance($baseAt)->setTimezone($this->applicationTimezone());
        $periodStartJst = $baseJst
            ->startOfDay()
            ->addHours($baseJst->hour < 12 ? 0 : 12);

        return [
            'start' => $periodStartJst,
            'end' => $periodStartJst->addHours(12),
        ];
    }

    private function applicationTimezone(): string
    {
        if (! function_exists('config')) {
            return 'Asia/Tokyo';
        }

        try {
            return (string) config('app.timezone', 'Asia/Tokyo');
        } catch (Throwable) {
            return 'Asia/Tokyo';
        }
    }
}
