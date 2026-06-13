<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * earthquake feed entry 同期 run の状態と件数を保持する Eloquent Model です。
 *
 * status API が読む保存境界であり、Atom feed の解析や entry upsert 判断は Service / Repository へ分けます。
 */
class EarthquakeFeedEntrySyncRun extends Model
{
    protected $table = 'earthquake_feed_entry_sync_runs';

    protected $fillable = [
        'status',
        'total_count',
        'inserted_count',
        'updated_count',
        'skipped_count',
        'failed_count',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'total_count' => 'integer',
        'inserted_count' => 'integer',
        'updated_count' => 'integer',
        'skipped_count' => 'integer',
        'failed_count' => 'integer',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];
}
