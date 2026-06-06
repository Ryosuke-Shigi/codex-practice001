<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * API catalog cache に紐づく調査メモの保存テーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('saved_api_notes', function (Blueprint $table) {
            $table->id();

            /*
             * メモは api_key 文字列ではなく api_catalog_cache の行に紐づけます。
             * API同期で api_key の扱いが変わっても、保存メモの所有境界をDB上で保てます。
             */
            $table->foreignId('api_catalog_cache_id')
                ->constrained('api_catalog_cache')
                ->cascadeOnDelete();

            $table->string('title')->nullable();
            $table->text('body');
            $table->timestamps();
        });
    }

    /**
     * 保存メモテーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('saved_api_notes');
    }
};
