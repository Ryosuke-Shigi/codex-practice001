<?php

namespace App\Models;

use App\Enums\DanceShortsRadar\DanceShortSearchScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanceShortSearchKeyword extends Model
{
    protected $table = 'dance_short_search_keywords';

    protected $fillable = [
        'region_id',
        'keyword',
        'search_scope',
        'max_search_pages',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'region_id' => 'integer',
        'search_scope' => DanceShortSearchScope::class,
        'max_search_pages' => 'integer',
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
