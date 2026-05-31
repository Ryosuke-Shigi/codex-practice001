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
        Schema::create('dance_short_search_keywords', function (Blueprint $table) {
            $table->id();

            $table->foreignId('region_id')->constrained('dance_short_regions')->cascadeOnDelete();
            $table->string('keyword');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('region_id');
            $table->index('is_active');
            $table->index('sort_order');
            $table->unique(['region_id', 'keyword']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dance_short_search_keywords');
    }
};
