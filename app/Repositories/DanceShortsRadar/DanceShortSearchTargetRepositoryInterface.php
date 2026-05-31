<?php

namespace App\Repositories\DanceShortsRadar;

use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use Illuminate\Database\Eloquent\Collection;

interface DanceShortSearchTargetRepositoryInterface
{
    /**
     * @return Collection<int, DanceShortRegion>
     */
    public function activeRegions(): Collection;

    /**
     * @return Collection<int, DanceShortSearchKeyword>
     */
    public function activeKeywordsForRegion(DanceShortRegion $region): Collection;
}
