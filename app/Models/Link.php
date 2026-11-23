<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use LogicException;

/**
 * 一覧に所属する選択肢の保存値を保持する。
 */
class Link extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'links';

    protected $fillable = [
        'link_key',
        'owner_links_lanchar_key',
        'title',
        'description',
        'selection_image_reference',
        'selection_image_poster_reference',
        'sphere_color',
        'icon_image_reference',
        'lucide_icon_name',
        'background_color',
        'background_image_reference',
        'background_image_poster_reference',
        'background_image_entrance_animation_name',
        'background_effect_name',
        'destination_links_lanchar_key',
        'destination_page_id',
        'priority',
        'is_visible',
    ];

    protected $hidden = ['destination_reference_count'];

    protected $attributes = ['is_visible' => true];

    protected static function booted(): void
    {
        static::updating(function (self $link): void {
            if ($link->isDirty('link_key')) {
                throw new LogicException('Linkの固有キーは変更できません。');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'destination_page_id' => 'integer',
            'priority' => 'integer',
            'is_visible' => 'boolean',
        ];
    }

    /**
     * 明示した空欄と未指定では表示の初期値が異なる。
     */
    protected function isVisible(): Attribute
    {
        return Attribute::set(static fn (mixed $value): bool => (bool) $value);
    }

    /**
     * @return list<string>
     */
    public function uniqueIds(): array
    {
        return ['link_key'];
    }

    public function newUniqueId(): string
    {
        return (string) Str::uuid();
    }

    /**
     * @return BelongsTo<LinksLanchar, $this>
     */
    public function ownerLinksLanchar(): BelongsTo
    {
        return $this->belongsTo(LinksLanchar::class, 'owner_links_lanchar_key', 'links_lanchar_key');
    }

    /**
     * @return BelongsTo<LinksLanchar, $this>
     */
    public function destinationLinksLanchar(): BelongsTo
    {
        return $this->belongsTo(LinksLanchar::class, 'destination_links_lanchar_key', 'links_lanchar_key');
    }

    /**
     * @return BelongsTo<LinkPage, $this>
     */
    public function destinationPage(): BelongsTo
    {
        return $this->belongsTo(LinkPage::class, 'destination_page_id');
    }
}
