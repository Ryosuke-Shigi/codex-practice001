<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * APIs.guru 由来のカタログキャッシュを表す Eloquent Model です。
 *
 * payload_hash や active 状態の保存先であり、同期時の insert / update / skip 判断は Service 側で扱います。
 */
class ApiCatalogCache extends Model
{
    protected $table = 'api_catalog_cache';

    protected $fillable = [
        'api_key',
        'provider_key',
        'service_key',
        'title',
        'description',
        'preferred_version',
        'openapi_json_url',
        'openapi_yaml_url',
        'openapi_version',
        'source_latest_updated_at',
        'payload_hash',
        'is_active',
        'synced_at',
    ];

    protected $casts = [
        'source_latest_updated_at' => 'datetime',
        'synced_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * @return HasMany<ApiCatalogNote>
     */
    public function notes(): HasMany
    {
        return $this->hasMany(ApiCatalogNote::class, 'api_catalog_cache_id');
    }
}
