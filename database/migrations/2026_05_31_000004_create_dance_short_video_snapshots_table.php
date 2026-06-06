<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 取得時点ごとの YouTube 公開指標を snapshot として保存するテーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('dance_short_video_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('video_id')->constrained('dance_short_videos')->cascadeOnDelete();
            $table->foreignId('region_id')->constrained('dance_short_regions')->cascadeOnDelete();
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('like_count')->nullable();
            $table->unsignedBigInteger('comment_count')->nullable();
            $table->dateTime('collected_at');

            $table->timestamps();

            $table->index('video_id');
            $table->index('region_id');
            $table->index('collected_at');
            $table->index(['region_id', 'collected_at']);
            $table->unique(['video_id', 'region_id', 'collected_at'], 'dance_short_snapshot_unique');
        });
    }

    /**
     * DanceShortsRadar の snapshot テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('dance_short_video_snapshots');
    }
};
