<?php

namespace Database\Seeders;

use App\Enums\DanceShortsRadar\DanceShortSearchScope;
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
                ['keyword' => '踊ってみた shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
                ['keyword' => '踊ってみた', 'scope' => DanceShortSearchScope::Expanded, 'pages' => 2],
                ['keyword' => 'TikTok 踊ってみた shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
            ],
            'US' => [
                ['keyword' => 'dance cover shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
                ['keyword' => 'dance cover', 'scope' => DanceShortSearchScope::Expanded, 'pages' => 2],
                ['keyword' => 'TikTok dance cover shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
            ],
            'KR' => [
                ['keyword' => '커버댄스 shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
                ['keyword' => '커버댄스', 'scope' => DanceShortSearchScope::Expanded, 'pages' => 2],
                ['keyword' => '틱톡 커버댄스 shorts', 'scope' => DanceShortSearchScope::Standard, 'pages' => 1],
            ],
        ];

        foreach ($keywordsByRegionCode as $regionCode => $keywords) {
            $region = DanceShortRegion::query()->where('code', $regionCode)->first();

            if ($region === null) {
                continue;
            }

            foreach ($keywords as $index => $keywordDefinition) {
                DanceShortSearchKeyword::query()->updateOrCreate(
                    [
                        'region_id' => $region->getKey(),
                        'keyword' => $keywordDefinition['keyword'],
                    ],
                    [
                        'search_scope' => $keywordDefinition['scope']->value,
                        'max_search_pages' => $keywordDefinition['pages'],
                        'sort_order' => ($index + 1) * 10,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
