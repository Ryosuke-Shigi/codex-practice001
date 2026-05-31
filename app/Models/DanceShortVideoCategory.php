<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DanceShortVideoCategory extends Model
{
    protected $table = 'dance_short_video_categories';

    protected $fillable = [
        'youtube_category_id',
        'region_code',
        'title',
        'is_assignable',
    ];

    protected $casts = [
        'is_assignable' => 'boolean',
    ];

    /**
     * @return BelongsTo<DanceShortRegion, DanceShortVideoCategory>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(DanceShortRegion::class, 'region_code', 'code');
    }

    /**
     * @return HasMany<DanceShortVideo>
     */
    public function videos(): HasMany
    {
        return $this->hasMany(DanceShortVideo::class, 'category_id', 'youtube_category_id');
    }
}
