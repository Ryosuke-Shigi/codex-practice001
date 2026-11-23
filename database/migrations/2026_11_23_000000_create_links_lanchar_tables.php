<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('links_lanchars', function (Blueprint $table) {
            $table->id();
            $table->uuid('links_lanchar_key')->unique();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('link_pages', function (Blueprint $table) {
            $table->id();
            $table->text('url');
            $table->timestamps();
        });

        Schema::create('links', function (Blueprint $table) {
            $table->id();
            $table->uuid('link_key')->unique();
            $table->uuid('owner_links_lanchar_key');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->text('selection_image_reference')->nullable();
            $table->text('selection_image_poster_reference')->nullable();
            $table->string('sphere_color', 64)->nullable();
            $table->text('icon_image_reference')->nullable();
            $table->string('lucide_icon_name')->nullable();
            $table->string('background_color', 64)->nullable();
            $table->text('background_image_reference')->nullable();
            $table->text('background_image_poster_reference')->nullable();
            $table->string('background_image_entrance_animation_name', 64)->nullable();
            $table->string('background_effect_name')->nullable();
            $table->uuid('destination_links_lanchar_key')->nullable();
            $table->foreignId('destination_page_id')->nullable()->constrained('link_pages')->nullOnDelete();
            $table->integer('priority')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at');
            $table->softDeletes();

            $table->foreign('owner_links_lanchar_key', 'links_owner_launcher_fk')
                ->references('links_lanchar_key')
                ->on('links_lanchars')
                ->restrictOnDelete();
            $table->foreign('destination_links_lanchar_key', 'links_destination_launcher_fk')
                ->references('links_lanchar_key')
                ->on('links_lanchars')
                ->nullOnDelete();

            $table->index(['owner_links_lanchar_key', 'is_visible', 'deleted_at'], 'links_owner_visibility_idx');
            $table->index('destination_links_lanchar_key', 'links_destination_launcher_idx');
            $table->index('destination_page_id', 'links_destination_page_idx');
        });

        // MySQLではON DELETE SET NULLの対象列をCHECKが直接参照できない。
        // 設定済み参照の件数だけを仮想列で表し、その件数に上限を設ける。
        DB::statement(<<<'SQL'
            ALTER TABLE links ADD COLUMN destination_reference_count INTEGER
                GENERATED ALWAYS AS (
                    (destination_links_lanchar_key IS NOT NULL) + (destination_page_id IS NOT NULL)
                ) VIRTUAL
                CONSTRAINT links_at_most_one_destination CHECK (destination_reference_count <= 1)
            SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('links');
        Schema::dropIfExists('link_pages');
        Schema::dropIfExists('links_lanchars');
    }
};
