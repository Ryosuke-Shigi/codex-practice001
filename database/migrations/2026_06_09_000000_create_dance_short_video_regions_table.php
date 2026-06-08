<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * search.list で発見した動画と発見元 region の関係を保持します。
     */
    public function up(): void
    {
        Schema::create('dance_short_video_regions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('video_id')->constrained('dance_short_videos')->cascadeOnDelete();
            $table->foreignId('region_id')->constrained('dance_short_regions')->cascadeOnDelete();
            $table->dateTime('first_detected_at');
            $table->dateTime('last_detected_at');

            $table->timestamps();

            $table->index('video_id');
            $table->index('region_id');
            $table->index('last_detected_at');
            $table->unique(['video_id', 'region_id'], 'dance_short_video_region_unique');
        });
    }

    /**
     * DanceShortsRadar の動画と地域の発見関係テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('dance_short_video_regions');
    }
};
