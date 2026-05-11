<?php

namespace App\Repositories\Earthquake;

interface EarthquakeDetailXmlRepositoryInterface
{
    /**
     * @return array<string, mixed>
     */
    public function fetch(string $url): array;
}
