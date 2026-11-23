<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use LogicException;

/**
 * 複数のLinkが所属する一覧の識別子と公開状態を保持する。
 */
class LinksLauncher extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'links_launchers';

    protected $fillable = ['links_launcher_key', 'title', 'description'];

    protected static function booted(): void
    {
        static::updating(function (self $launcher): void {
            if ($launcher->isDirty('links_launcher_key')) {
                throw new LogicException('LinksLauncherの固有キーは変更できません。');
            }
        });
    }

    /**
     * @return list<string>
     */
    public function uniqueIds(): array
    {
        return ['links_launcher_key'];
    }

    public function newUniqueId(): string
    {
        return (string) Str::uuid();
    }

    /**
     * @return HasMany<Link, $this>
     */
    public function links(): HasMany
    {
        return $this->hasMany(Link::class, 'owner_links_launcher_key', 'links_launcher_key');
    }
}
