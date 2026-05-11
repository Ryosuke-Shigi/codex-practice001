<?php

namespace App\Repositories\Earthquake;

interface EarthquakeXmlRepositoryInterface
{
    /**
     * 気象庁の地震火山情報 Atom feed を Preview 確認用に取得します。
     *
     * @return array<string, mixed>
     */
    public function fetchHighFrequencyFeed(): array;
}
