<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * アプリ内で発生した ERROR ログを確認用に保存するテーブルを作成します。
     */
    public function up(): void
    {
        Schema::create('application_error_logs', function (Blueprint $table) {
            $table->id();

            $table->string('level', 20)->index();
            $table->string('error_code', 120)->nullable()->index();
            $table->text('message');
            $table->string('exception_class')->nullable();
            $table->string('file')->nullable();
            $table->unsignedInteger('line')->nullable();
            $table->text('url')->nullable();
            $table->string('method', 16)->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('occurred_at')->index();
            $table->timestamp('resolved_at')->nullable()->index();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * ERROR ログ保存テーブルを削除します。
     */
    public function down(): void
    {
        Schema::dropIfExists('application_error_logs');
    }
};
