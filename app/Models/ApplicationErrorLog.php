<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * アプリ内で発生した ERROR ログの確認用保存先です。
 *
 * 例外の stack trace、request payload、cookie、token、session は保持しません。
 */
class ApplicationErrorLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'level',
        'error_code',
        'message',
        'exception_class',
        'file',
        'line',
        'url',
        'method',
        'user_id',
        'occurred_at',
        'resolved_at',
        'resolved_by',
    ];

    protected $casts = [
        'line' => 'integer',
        'user_id' => 'integer',
        'occurred_at' => 'datetime',
        'resolved_at' => 'datetime',
        'resolved_by' => 'integer',
    ];
}
