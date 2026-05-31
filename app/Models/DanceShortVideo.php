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
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'tags' => 'array',
        'embeddable' => 'boolean',
    ];

    /**
     * @return HasMany<DanceShortVideoSnapshot>
     */
    public function snapshots(): HasMany
    {
        return $this->hasMany(DanceShortVideoSnapshot::class, 'video_id');
    }

    /**
     * @return HasMany<DanceShortVideoCategory>
     */
    public function videoCategories(): HasMany
    {
        return $this->hasMany(DanceShortVideoCategory::class, 'youtube_category_id', 'category_id');
    }
}
