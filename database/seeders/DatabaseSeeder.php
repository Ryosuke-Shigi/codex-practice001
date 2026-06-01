<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        /*
         * DanceShortsRadar の通常ランキングは、DB 上の active region をそのまま
         * 地域タブとして表示します。初期DBでも JP / US / KR の地域ボタンを確認できるよう、
         * アプリ全体の seed でも地域マスタだけは投入しておきます。
         */
        $this->call(DanceShortRegionSeeder::class);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
