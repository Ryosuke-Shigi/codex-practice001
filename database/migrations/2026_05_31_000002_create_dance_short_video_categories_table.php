<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * YouTube category を地域別に保持するテーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('dance_short_video_categories', function (Blueprint $table) {
            $table->id();

            $table->string('youtube_category_id')->index();
            $table->string('region_code')->nullable()->index();
            $table->string('title');
            $table->boolean('is_assignable')->default(true)->index();

            $table->timestamps();

            $table->unique(['youtube_category_id', 'region_code'], 'dance_short_category_region_unique');
        });
    }

    /**
     * DanceShortsRadar の video category テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('dance_short_video_categories');
    }
};
