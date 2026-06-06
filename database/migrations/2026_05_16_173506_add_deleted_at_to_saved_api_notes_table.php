<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 保存メモを soft delete できるよう deleted_at を追加します。
     */
    public function up(): void
    {
        Schema::table('saved_api_notes', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * 保存メモの deleted_at を削除します。
     */
    public function down(): void
    {
        Schema::table('saved_api_notes', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
