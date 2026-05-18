<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApiCatalogNote extends Model
{
    use SoftDeletes;

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
