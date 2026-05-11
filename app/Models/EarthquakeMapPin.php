<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EarthquakeMapPin extends Model
{
    protected $table = 'earthquake_map_pins';

    protected $fillable = [
        'event_id',
        'source_entry_id',
        'title',
        'area_name',
        'headline',
        'raw_coordinate',
        'latitude',
        'longitude',
        'depth_meter',
        'magnitude',
        'max_intensity',
        'occurred_at',
        'reported_at',
        'comment',
    ];

    protected $casts = [
        'source_entry_id' => 'integer',
        'depth_meter' => 'integer',
        'occurred_at' => 'datetime',
        'reported_at' => 'datetime',
    ];
}
