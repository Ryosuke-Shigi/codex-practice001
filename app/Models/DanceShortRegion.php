<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DanceShortRegion extends Model
{
    protected $table = 'dance_short_regions';

    protected $fillable = [
        'code',
        'name',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * @return HasMany<DanceShortSearchKeyword>
     */
    public function searchKeywords(): HasMany
    {
        return $this->hasMany(DanceShortSearchKeyword::class, 'region_id');
    }

    /**
     * @return HasMany<DanceShortVideoSnapshot>
     */
    public function videoSnapshots(): HasMany
    {
        return $this->hasMany(DanceShortVideoSnapshot::class, 'region_id');
    }

    /**
     * @return HasMany<DanceShortVideoRegion>
     */
    public function videoRegions(): HasMany
    {
        return $this->hasMany(DanceShortVideoRegion::class, 'region_id');
    }
}
