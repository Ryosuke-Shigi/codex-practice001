<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * earthquake map pin 同期 run の状態と件数を保持する Eloquent Model です。
 *
 * map pin 生成処理の進行状況を画面へ返すための保存境界であり、XML解析やpin生成判断は持ちません。
 */
class EarthquakeMapPinSyncRun extends Model
{
    protected $table = 'earthquake_map_pin_sync_runs';

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
