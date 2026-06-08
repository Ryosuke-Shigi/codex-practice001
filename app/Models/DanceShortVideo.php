<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DanceShortVideo extends Model
{
    protected $table = 'dance_short_videos';

    protected $fillable = [
        'youtube_video_id',
        'title',
        'description',
        'channel_id',
        'channel_title',
        'thumbnail_url',
        'published_at',
        'url',
        'category_id',
        'tags',
        'duration',
        'default_language',
        'default_audio_language',
        'live_broadcast_content',
        'embeddable',
        'tracking_status',
        'tracking_disabled_at',
        'archived_at',
        'tracking_reason',
    ];

    protected $attributes = [
        'tracking_status' => 'active',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'tags' => 'array',
        'embeddable' => 'boolean',
        'tracking_disabled_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /*
     * 動画本体は地域に属さない集約です。
     * category_id には YouTube の categoryId だけを保持しますが、この値だけでは
     * dance_short_video_categories の地域別行を一意に決められません。
     *
     * 例: category_id = 10 の動画に対して、JP / US / KR それぞれのカテゴリ行が存在します。
     * そのため、地域別カテゴリ名が必要な場合は snapshot の region_id から region.code を取得し、
     * category_id + region.code を DanceShortVideoCategoryRepository に渡して解決します。
     */

    /**
     * @return HasMany<DanceShortVideoSnapshot>
     */
    public function snapshots(): HasMany
    {
        return $this->hasMany(DanceShortVideoSnapshot::class, 'video_id');
    }

    /**
     * @return HasMany<DanceShortVideoRegion>
     */
    public function videoRegions(): HasMany
    {
        return $this->hasMany(DanceShortVideoRegion::class, 'video_id');
    }
}
