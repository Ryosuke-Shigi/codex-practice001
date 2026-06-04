<?php

namespace Database\Seeders;

use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use Illuminate\Database\Seeder;

class DanceShortSearchKeywordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(DanceShortRegionSeeder::class);

        $keywordsByRegionCode = [
            'JP' => [
                'やってみた shorts',
                '検証してみた shorts',
                'チャレンジ shorts',
                'リアクション shorts',
                'ゲーム実況 shorts',
                '踊ってみた shorts',
            ],
            'US' => [
                'i tried shorts',
                'challenge shorts',
                'reaction shorts',
                'gaming shorts',
                'POV shorts',
                'vtuber challenge shorts',
            ],
            'KR' => [
                '해봤어요 shorts',
                '챌린지 shorts',
                '리액션 shorts',
                '게임 shorts',
                '커버댄스 shorts',
                '검증해봤어요 shorts',
            ],
        ];

        foreach ($keywordsByRegionCode as $regionCode => $keywords) {
            $region = DanceShortRegion::query()->where('code', $regionCode)->first();

            if ($region === null) {
                continue;
            }

            DanceShortSearchKeyword::query()
                ->where('region_id', $region->getKey())
                ->delete();

            foreach ($keywords as $index => $keyword) {
                DanceShortSearchKeyword::query()->create([
                    'region_id' => $region->getKey(),
                    'keyword' => $keyword,
                    'sort_order' => ($index + 1) * 10,
                    'is_active' => true,
                ]);
            }
        }
    }
}
