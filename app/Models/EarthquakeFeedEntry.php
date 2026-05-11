<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EarthquakeFeedEntry extends Model
{
    protected $table = 'earthquake_feed_entries';

    protected $fillable = [
        'entry_id',
        'title',
        'xml_url',
        'updated_at_from_feed',
        'published_at_from_feed',
        'raw_category',
        'raw_author',
        'last_fetched_at',
    ];

    protected $casts = [
        'updated_at_from_feed' => 'datetime',
        'published_at_from_feed' => 'datetime',
        'last_fetched_at' => 'datetime',
    ];
}
