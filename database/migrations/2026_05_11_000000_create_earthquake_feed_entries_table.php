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
        Schema::create('earthquake_feed_entries', function (Blueprint $table) {
            $table->id();

            $table->string('entry_id')->unique();
            $table->string('title');
            $table->text('xml_url')->nullable();
            $table->timestamp('updated_at_from_feed')->nullable()->index();
            $table->timestamp('published_at_from_feed')->nullable()->index();
            $table->string('raw_category')->nullable();
            $table->string('raw_author')->nullable();
            $table->timestamp('last_fetched_at')->nullable()->index();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earthquake_feed_entries');
    }
};
