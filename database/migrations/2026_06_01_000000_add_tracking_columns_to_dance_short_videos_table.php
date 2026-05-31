<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dance_short_videos', function (Blueprint $table) {
            /*
             * 動画本体は物理削除せず、追跡状態で snapshot 保存対象かどうかを表します。
             * 既存行はこれまで通り観測対象として扱えるよう active を既定値にします。
             */
            $table->string('tracking_status', 20)->default('active')->index();
            $table->dateTime('tracking_disabled_at')->nullable()->index();
            $table->dateTime('archived_at')->nullable()->index();
            $table->string('tracking_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dance_short_videos', function (Blueprint $table) {
            $table->dropColumn([
                'tracking_status',
                'tracking_disabled_at',
                'archived_at',
                'tracking_reason',
            ]);
        });
    }
};
