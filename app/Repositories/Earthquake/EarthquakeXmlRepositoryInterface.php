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

    /**
     * Atom entry が指す個別 XML 電文を Preview 確認用に取得します。
     *
     * @return array<string, mixed>
     */
    public function fetchXmlDocument(string $url): array;
}
