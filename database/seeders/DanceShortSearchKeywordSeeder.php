<?php

namespace Database\Seeders;

use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use Illuminate\Database\Seeder;

class DanceShortSearchKeywordSeeder extends Seeder
{
    /**
     * DanceShortsRadar の地域別検索 keyword を投入します。
     */
    public function run(): void
    {
        $this->call(DanceShortRegionSeeder::class);

        $keywordsByRegionCode = [
            'JP' => [
                '踊ってみた shorts',
                '踊ってみた',
                'TikTok 踊ってみた shorts',
            ],
            'US' => [
                'dance cover shorts',
                'dance cover',
                'TikTok dance cover shorts',
            ],
            'KR' => [
                '커버댄스 shorts',
                '커버댄스',
                '틱톡 커버댄스 shorts',
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
