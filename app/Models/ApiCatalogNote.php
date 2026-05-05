<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ApiCatalogNote extends Model
{
    protected $table = 'saved_api_notes';

    protected $fillable = [
        'api_catalog_cache_id',
        'title',
        'body',
    ];

    /**
     * @return BelongsTo<ApiCatalogCache, ApiCatalogNote>
     */
    public function apiCatalogCache(): BelongsTo
    {
        return $this->belongsTo(ApiCatalogCache::class, 'api_catalog_cache_id');
    }
}
