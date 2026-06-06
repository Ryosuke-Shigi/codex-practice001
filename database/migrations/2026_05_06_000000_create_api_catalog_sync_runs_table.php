<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * API catalog 同期の状態表示に使う sync run テーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('api_catalog_sync_runs', function (Blueprint $table) {
            $table->id();

            $table->string('status', 20)->index();

            $table->unsignedInteger('total_count')->default(0);
            $table->unsignedInteger('inserted_count')->default(0);
            $table->unsignedInteger('updated_count')->default(0);
            $table->unsignedInteger('skipped_count')->default(0);
            $table->unsignedInteger('inactive_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);

            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable()->index();
            $table->timestamp('finished_at')->nullable()->index();

            $table->timestamps();
        });
    }

    /**
     * API catalog sync run テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('api_catalog_sync_runs');
    }
};
