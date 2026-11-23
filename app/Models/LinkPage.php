<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Linkの行き先として指定された既存pageのURLを保持する。
 */
class LinkPage extends Model
{
    protected $table = 'link_pages';

    protected $fillable = ['url'];
}
