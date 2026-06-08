<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanceShortVideoRegion extends Model
{
    protected $table = 'dance_short_video_regions';

    protected $fillable = [
        'video_id',
        'region_id',
        'first_detected_at',
        'last_detected_at',
    ];

    protected $casts = [
        'video_id' => 'integer',
        'region_id' => 'integer',
        'first_detected_at' => 'datetime',
        'last_detected_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<DanceShortVideo, DanceShortVideoRegion>
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(DanceShortVideo::class, 'video_id');
    }

    /**
     * @return BelongsTo<DanceShortRegion, DanceShortVideoRegion>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(DanceShortRegion::class, 'region_id');
    }
}
