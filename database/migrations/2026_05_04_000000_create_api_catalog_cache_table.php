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
        Schema::create('api_catalog_cache', function (Blueprint $table) {
            $table->id();

            $table->string('api_key')->unique();

            $table->string('provider_key')->index();
            $table->string('service_key')->nullable()->index();

            $table->string('title')->nullable();
            $table->text('description')->nullable();

            $table->string('preferred_version')->nullable();
            $table->text('openapi_json_url')->nullable();
            $table->text('openapi_yaml_url')->nullable();
            $table->string('openapi_version')->nullable();

            $table->timestamp('source_latest_updated_at')->nullable()->index();
            $table->string('payload_hash', 64)->index();

            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('synced_at')->nullable()->index();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_catalog_cache');
    }
};
