<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ReadModel 系2テーブルだけを pattern build schema へ作り直します。
     */
    public function up(): void
    {
        Schema::dropIfExists('dance_short_radar_ranking_read_models');
        Schema::dropIfExists('dance_short_radar_ranking_read_model_builds');

        $this->createPatternBuildsTable();
        $this->createPatternRowsTable();
    }

    /**
     * rollback 時は ReadModel 系2テーブルだけを旧 build_id schema へ戻します。
     */
    public function down(): void
    {
        Schema::dropIfExists('dance_short_radar_ranking_read_models');
        Schema::dropIfExists('dance_short_radar_ranking_read_model_builds');

        $this->createLegacyBuildsTable();
        $this->createLegacyRowsTable();
    }

    private function createPatternBuildsTable(): void
    {
        Schema::create('dance_short_radar_ranking_read_model_builds', function (Blueprint $table) {
            $table->id();

            $table->uuid('pattern_build_id');
            $table->string('pattern_key', 128)->index();
            $table->string('ranking_type', 32);
            $table->string('scope', 32);
            $table->unsignedSmallInteger('comparison_days');
            $table->string('sort_key', 64);
            $table->unsignedSmallInteger('max_rows');
            $table->string('status', 32)->index();
            $table->dateTime('calculated_at');
            $table->dateTime('activated_at')->nullable();
            $table->unsignedInteger('inserted_count')->default(0);
            $table->text('error_message')->nullable();

            $table->timestamps();

            $table->unique('pattern_build_id', 'dance_short_radar_pattern_build_id_unique');
            $table->index(['pattern_key', 'status', 'activated_at'], 'dance_short_radar_pattern_build_active_idx');
            $table->index(['scope', 'comparison_days', 'sort_key', 'status'], 'dance_short_radar_pattern_build_display_idx');
        });
    }

    private function createPatternRowsTable(): void
    {
        Schema::create('dance_short_radar_ranking_read_models', function (Blueprint $table) {
            $table->id();

            $table->uuid('pattern_build_id');
            $table->string('pattern_key', 128);
            $table->string('ranking_type', 32);
            $table->string('scope', 32);
            $table->unsignedSmallInteger('comparison_days');
            $table->string('sort_key', 64);
            $table->unsignedInteger('rank');

            $table->foreignId('video_id')->constrained('dance_short_videos')->cascadeOnDelete();
            $table->string('youtube_video_id');
            $table->string('title');
            $table->string('channel_title')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('youtube_url')->nullable();
            $table->dateTime('published_at')->nullable();

            $table->string('region_code', 16)->nullable();
            $table->string('region_name', 64)->nullable();
            $table->string('source_region_code', 16)->nullable();
            $table->string('source_region_label', 64)->nullable();

            $table->unsignedBigInteger('current_view_count');
            $table->unsignedBigInteger('previous_view_count')->nullable();
            $table->bigInteger('view_count_delta')->nullable();
            $table->double('view_growth_rate')->nullable();
            $table->double('views_per_hour')->nullable();
            $table->unsignedBigInteger('like_count')->nullable();
            $table->unsignedBigInteger('comment_count')->nullable();
            $table->dateTime('current_collected_at');
            $table->dateTime('previous_collected_at')->nullable();
            $table->boolean('has_previous_snapshot')->default(false);

            $table->unsignedBigInteger('japan_current_view_count')->nullable();
            $table->unsignedBigInteger('japan_previous_view_count')->nullable();
            $table->bigInteger('japan_view_count_delta')->nullable();
            $table->double('japan_view_growth_rate')->nullable();
            $table->double('japan_views_per_hour')->nullable();
            $table->dateTime('japan_current_collected_at')->nullable();
            $table->dateTime('japan_previous_collected_at')->nullable();
            $table->string('japan_comparison_status', 32)->nullable();
            $table->text('observation_note')->nullable();

            $table->dateTime('calculated_at');
            $table->timestamps();

            $table->index('pattern_build_id');
            $table->index(['pattern_build_id', 'rank'], 'dance_short_radar_pattern_read_model_window_idx');
            $table->index(['pattern_build_id', 'video_id'], 'dance_short_radar_pattern_read_model_video_idx');
            $table->index(['pattern_key', 'rank'], 'dance_short_radar_pattern_read_model_key_rank_idx');
            $table->unique(['pattern_build_id', 'rank'], 'dance_short_radar_pattern_read_model_rank_unique');
        });
    }

    private function createLegacyBuildsTable(): void
    {
        Schema::create('dance_short_radar_ranking_read_model_builds', function (Blueprint $table) {
            $table->id();

            $table->uuid('build_id')->unique();
            $table->string('status', 32)->index();
            $table->dateTime('calculated_at');
            $table->dateTime('activated_at')->nullable();

            $table->timestamps();
        });
    }

    private function createLegacyRowsTable(): void
    {
        Schema::create('dance_short_radar_ranking_read_models', function (Blueprint $table) {
            $table->id();

            $table->uuid('build_id');
            $table->string('scope', 32);
            $table->unsignedSmallInteger('comparison_days');
            $table->string('sort_key', 64);
            $table->unsignedInteger('rank');

            $table->foreignId('video_id')->constrained('dance_short_videos')->cascadeOnDelete();
            $table->string('youtube_video_id');
            $table->string('title');
            $table->string('channel_title')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('youtube_url')->nullable();
            $table->dateTime('published_at')->nullable();

            $table->string('region_code', 16)->nullable();
            $table->string('region_name', 64)->nullable();
            $table->string('source_region_code', 16)->nullable();
            $table->string('source_region_label', 64)->nullable();

            $table->unsignedBigInteger('current_view_count');
            $table->unsignedBigInteger('previous_view_count')->nullable();
            $table->bigInteger('view_count_delta')->nullable();
            $table->double('view_growth_rate')->nullable();
            $table->double('views_per_hour')->nullable();
            $table->unsignedBigInteger('like_count')->nullable();
            $table->unsignedBigInteger('comment_count')->nullable();
            $table->dateTime('current_collected_at');
            $table->dateTime('previous_collected_at')->nullable();
            $table->boolean('has_previous_snapshot')->default(false);

            $table->unsignedBigInteger('japan_current_view_count')->nullable();
            $table->unsignedBigInteger('japan_previous_view_count')->nullable();
            $table->bigInteger('japan_view_count_delta')->nullable();
            $table->double('japan_view_growth_rate')->nullable();
            $table->double('japan_views_per_hour')->nullable();
            $table->dateTime('japan_current_collected_at')->nullable();
            $table->dateTime('japan_previous_collected_at')->nullable();
            $table->string('japan_comparison_status', 32)->nullable();
            $table->text('observation_note')->nullable();

            $table->dateTime('calculated_at');
            $table->timestamps();

            $table->index('build_id');
            $table->index(['build_id', 'scope', 'comparison_days', 'sort_key', 'rank'], 'dance_short_radar_read_model_window_idx');
            $table->index(['build_id', 'scope', 'comparison_days', 'sort_key', 'video_id'], 'dance_short_radar_read_model_video_idx');
            $table->unique(['build_id', 'scope', 'comparison_days', 'sort_key', 'rank'], 'dance_short_radar_read_model_rank_unique');
        });
    }
};
