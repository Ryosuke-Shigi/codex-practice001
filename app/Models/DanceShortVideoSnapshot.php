<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 保存済み動画の観測時点別 snapshot を表す Eloquent Model です。
 *
 * 増加量や1時間あたりの計算は Service / Responder 側で行い、Model は実測値と relation の境界に留めます。
 */
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
