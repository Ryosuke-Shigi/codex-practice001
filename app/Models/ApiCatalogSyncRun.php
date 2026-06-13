<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * APIカタログ同期 run の状態と集計値を保持する Eloquent Model です。
 *
 * Queue / Action / Repository が更新する状態保存先であり、同期の差分判断や外部API通信は持ちません。
 */
class ApiCatalogSyncRun extends Model
{
    protected $table = 'api_catalog_sync_runs';

    protected $fillable = [
        'status',
        'total_count',
        'inserted_count',
        'updated_count',
        'skipped_count',
        'inactive_count',
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
        'inactive_count' => 'integer',
        'failed_count' => 'integer',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];
}
