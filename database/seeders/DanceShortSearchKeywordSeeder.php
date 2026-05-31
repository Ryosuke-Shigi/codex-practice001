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
            'JP' => ['ダンス shorts'],
            'US' => ['dance shorts'],
            'KR' => ['댄스 쇼츠'],
        ];

        foreach ($keywordsByRegionCode as $regionCode => $keywords) {
            $region = DanceShortRegion::query()->where('code', $regionCode)->first();

            if ($region === null) {
                continue;
            }

            foreach ($keywords as $index => $keyword) {
                DanceShortSearchKeyword::query()->updateOrCreate(
                    [
                        'region_id' => $region->getKey(),
                        'keyword' => $keyword,
                    ],
                    [
                        'sort_order' => ($index + 1) * 10,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
