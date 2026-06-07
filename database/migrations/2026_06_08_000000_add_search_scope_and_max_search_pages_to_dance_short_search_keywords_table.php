<?php

use App\Enums\DanceShortsRadar\DanceShortSearchScope;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * DanceShortsRadar の検索 keyword に page2 取得対象を管理する列を追加します。
     */
    public function up(): void
    {
        Schema::table('dance_short_search_keywords', function (Blueprint $table) {
            $table->string('search_scope')
                ->default(DanceShortSearchScope::Standard->value)
                ->after('keyword');
            $table->unsignedTinyInteger('max_search_pages')
                ->default(1)
                ->after('search_scope');

            $table->index('search_scope');
            $table->index('max_search_pages');
        });
    }

    /**
     * DanceShortsRadar の page2 取得対象管理列を削除します。
     */
    public function down(): void
    {
        Schema::table('dance_short_search_keywords', function (Blueprint $table) {
            $table->dropIndex(['search_scope']);
            $table->dropIndex(['max_search_pages']);
            $table->dropColumn(['search_scope', 'max_search_pages']);
        });
    }
};
