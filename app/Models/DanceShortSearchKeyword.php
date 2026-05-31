<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanceShortSearchKeyword extends Model
{
    protected $table = 'dance_short_search_keywords';

    protected $fillable = [
        'region_id',
        'keyword',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'region_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * @return BelongsTo<DanceShortRegion, DanceShortSearchKeyword>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(DanceShortRegion::class, 'region_id');
    }
}
