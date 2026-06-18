<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * アプリ内の外部 API 連携結果を確認するための保存先です。
 *
 * request / response body 全文や API key、token、cookie、session は保持しません。
 */
class ApplicationIntegrationLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'integration_type',
        'service_name',
        'action',
        'status',
        'message',
        'target_type',
        'target_id',
        'external_id',
        'url',
        'method',
        'response_status',
        'user_id',
        'occurred_at',
    ];

    protected $casts = [
        'response_status' => 'integer',
        'user_id' => 'integer',
        'occurred_at' => 'datetime',
    ];
}
