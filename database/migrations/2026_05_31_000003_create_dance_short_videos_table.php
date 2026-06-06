<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * YouTube 動画本体の metadata を保持するテーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('dance_short_videos', function (Blueprint $table) {
            $table->id();

            $table->string('youtube_video_id')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('channel_id')->nullable();
            $table->string('channel_title')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->dateTime('published_at')->nullable()->index();
            $table->text('url')->nullable();
            $table->string('category_id')->nullable()->index();
            $table->json('tags')->nullable();
            $table->string('duration')->nullable();
            $table->string('default_language')->nullable()->index();
            $table->string('default_audio_language')->nullable()->index();
            $table->string('live_broadcast_content')->nullable()->index();
            $table->boolean('embeddable')->nullable()->index();

            $table->timestamps();
        });
    }

    /**
     * DanceShortsRadar の動画本体テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('dance_short_videos');
    }
};
