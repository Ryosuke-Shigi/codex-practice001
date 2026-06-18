<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * アプリ内の API 連携ログを確認用に保存するテーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('application_integration_logs', function (Blueprint $table) {
            $table->id();

            $table->string('integration_type', 80)->index();
            $table->string('service_name')->nullable()->index();
            $table->string('action')->index();
            $table->string('status', 20)->index();
            $table->text('message')->nullable();
            $table->string('target_type')->nullable()->index();
            $table->string('target_id')->nullable()->index();
            $table->string('external_id')->nullable()->index();
            $table->text('url')->nullable();
            $table->string('method', 16)->nullable();
            $table->unsignedSmallInteger('response_status')->nullable()->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('occurred_at')->index();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * API 連携ログ保存テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('application_integration_logs');
    }
};
