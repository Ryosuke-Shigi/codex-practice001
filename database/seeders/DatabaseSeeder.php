<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * アプリ全体で必要な初期データを投入します。
     */
    public function run(): void
    {
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
