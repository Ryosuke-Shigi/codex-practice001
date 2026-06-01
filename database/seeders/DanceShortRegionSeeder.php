<?php

namespace Database\Seeders;

use App\Models\DanceShortRegion;
use Illuminate\Database\Seeder;

class DanceShortRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
         * DanceShortsRadar の通常ランキング画面は、React 側の固定配列ではなく
         * dance_short_regions の active な地域マスタから region tab を組み立てます。
         *
         * この Seeder が担当するのは、画面で選択可能にする最小地域マスタの投入だけです。
         * YouTube API 呼び出し、動画保存、snapshot 保存、ランキング計算はここに含めません。
         */
        $regions = [
            ['code' => 'JP', 'name' => '日本', 'sort_order' => 10],
            ['code' => 'US', 'name' => 'アメリカ', 'sort_order' => 20],
            ['code' => 'KR', 'name' => '韓国', 'sort_order' => 30],
        ];

        foreach ($regions as $region) {
            /*
             * migration では code が unique なので、code を自然キーとして再実行可能にします。
             * 既存行が inactive や古い表示順になっていても、初期マスタとして必要な active 状態と
             * 表示順へ戻すことで、/dance-shorts-radar の地域ボタン表示を安定させます。
             */
            DanceShortRegion::query()->updateOrCreate(
                ['code' => $region['code']],
                [
                    'name' => $region['name'],
                    'sort_order' => $region['sort_order'],
                    'is_active' => true,
                ],
            );
        }
    }
}
