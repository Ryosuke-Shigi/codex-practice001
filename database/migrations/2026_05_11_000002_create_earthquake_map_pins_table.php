<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 地震 XML から生成した map pin を保存するテーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('earthquake_map_pins', function (Blueprint $table) {
            $table->id();

            $table->string('event_id')->nullable()->unique();
            $table->foreignId('source_entry_id')->constrained('earthquake_feed_entries');
            $table->string('title')->nullable();
            $table->string('area_name')->nullable();
            $table->text('headline')->nullable();
            $table->string('raw_coordinate')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('depth_meter')->nullable();
            $table->decimal('magnitude', 4, 1)->nullable();
            $table->string('max_intensity', 10)->nullable();
            $table->timestamp('occurred_at')->nullable()->index();
            $table->timestamp('reported_at')->nullable()->index();
            $table->text('comment')->nullable();

            $table->timestamps();

            $table->index('source_entry_id');
        });
    }

    /**
     * 地震 map pin テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('earthquake_map_pins');
    }
};
