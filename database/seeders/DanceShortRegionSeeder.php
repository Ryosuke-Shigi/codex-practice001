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
        $regions = [
            ['code' => 'JP', 'name' => '日本', 'sort_order' => 10],
            ['code' => 'US', 'name' => 'アメリカ', 'sort_order' => 20],
            ['code' => 'KR', 'name' => '韓国', 'sort_order' => 30],
        ];

        foreach ($regions as $region) {
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
