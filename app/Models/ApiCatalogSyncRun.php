<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
