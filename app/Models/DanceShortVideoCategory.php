<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanceShortVideoCategory extends Model
{
    protected $table = 'dance_short_video_categories';

    protected $fillable = [
        'youtube_category_id',
        'region_code',
        'title',
        'is_assignable',
    ];

    protected $casts = [
        'is_assignable' => 'boolean',
    ];

    /*
     * YouTube カテゴリは region_code ごとに保持します。
     * youtube_category_id だけで動画と直接つなぐと、同じ categoryId を持つ別地域の行まで
     * 取得できてしまうため、この Model には videos() リレーションを置きません。
     *
     * 動画に対する表示用カテゴリは、動画本体ではなく地域別 snapshot の文脈で決まります。
     */

    /**
     * @return BelongsTo<DanceShortRegion, DanceShortVideoCategory>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(DanceShortRegion::class, 'region_code', 'code');
    }
}
