<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanceShortVideoSnapshot extends Model
{
    protected $table = 'dance_short_video_snapshots';

    protected $fillable = [
        'video_id',
        'region_id',
        'view_count',
        'like_count',
        'comment_count',
        'collected_at',
    ];

    protected $casts = [
        'video_id' => 'integer',
        'region_id' => 'integer',
        'view_count' => 'integer',
        'like_count' => 'integer',
        'comment_count' => 'integer',
        'collected_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<DanceShortVideo, DanceShortVideoSnapshot>
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(DanceShortVideo::class, 'video_id');
    }

    /**
     * @return BelongsTo<DanceShortRegion, DanceShortVideoSnapshot>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(DanceShortRegion::class, 'region_id');
    }
}
