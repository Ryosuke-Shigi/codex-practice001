<?php

namespace Tests\Unit\DanceShortsRadar\Repositories;

use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoCategory;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortVideoCategoryRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DanceShortVideoCategoryRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_find_by_youtube_category_id_and_region_code_returns_only_requested_region_category(): void
    {
        /*
         * 同じ YouTube categoryId が複数地域に存在する状態を作ります。
         * Repository が region_code まで条件に含めていないと、このテストは別地域の行を返せてしまいます。
         */
        $categories = [
            'JP' => DanceShortVideoCategory::query()->create([
                'youtube_category_id' => '10',
                'region_code' => 'JP',
                'title' => 'Music JP',
            ]),
            'US' => DanceShortVideoCategory::query()->create([
                'youtube_category_id' => '10',
                'region_code' => 'US',
                'title' => 'Music US',
            ]),
            'KR' => DanceShortVideoCategory::query()->create([
                'youtube_category_id' => '10',
                'region_code' => 'KR',
                'title' => 'Music KR',
            ]),
        ];

        $repository = app(DanceShortVideoCategoryRepositoryInterface::class);

        foreach ($categories as $regionCode => $expectedCategory) {
            $category = $repository->findByYoutubeCategoryIdAndRegionCode('10', $regionCode);

            $this->assertNotNull($category);
            $this->assertTrue($expectedCategory->is($category));
            $this->assertSame($regionCode, $category->region_code);
        }
    }

    public function test_find_by_youtube_category_id_and_region_code_returns_null_for_missing_region_code(): void
    {
        DanceShortVideoCategory::query()->create([
            'youtube_category_id' => '10',
            'region_code' => 'JP',
            'title' => 'Music JP',
        ]);

        $category = app(DanceShortVideoCategoryRepositoryInterface::class)
            ->findByYoutubeCategoryIdAndRegionCode('10', 'DE');

        $this->assertNull($category);
    }

    public function test_find_by_youtube_category_id_and_region_code_returns_null_for_missing_youtube_category_id(): void
    {
        DanceShortVideoCategory::query()->create([
            'youtube_category_id' => '10',
            'region_code' => 'JP',
            'title' => 'Music JP',
        ]);

        $category = app(DanceShortVideoCategoryRepositoryInterface::class)
            ->findByYoutubeCategoryIdAndRegionCode('999', 'JP');

        $this->assertNull($category);
    }

    public function test_video_does_not_have_regionless_category_relations(): void
    {
        /*
         * category_id と youtube_category_id だけの Model リレーションを戻すと、
         * snapshot の地域文脈なしに JP / US / KR のカテゴリが混ざるため、存在しないことを固定します。
         */
        $this->assertFalse(method_exists(DanceShortVideo::class, 'videoCategories'));
        $this->assertFalse(method_exists(DanceShortVideoCategory::class, 'videos'));
    }

    public function test_existing_snapshot_region_video_relations_are_kept(): void
    {
        /*
         * 削除対象は地域条件なしのカテゴリリレーションだけです。
         * 動画本体、地域別 snapshot、region、検索キーワードの既存リレーションは維持します。
         */
        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
        ]);
        $keyword = DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
        ]);
        $category = DanceShortVideoCategory::query()->create([
            'youtube_category_id' => '10',
            'region_code' => 'JP',
            'title' => 'Music JP',
        ]);
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-relation',
            'title' => 'Relation target short',
            'category_id' => '10',
        ]);
        $snapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 123456,
            'collected_at' => '2026-05-31 10:30:00',
        ]);

        $this->assertTrue($category->region->is($region));
        $this->assertTrue($video->snapshots()->whereKey($snapshot->getKey())->exists());
        $this->assertTrue($snapshot->video->is($video));
        $this->assertTrue($snapshot->region->is($region));
        $this->assertTrue($region->videoSnapshots()->whereKey($snapshot->getKey())->exists());
        $this->assertTrue($region->searchKeywords()->whereKey($keyword->getKey())->exists());
    }
}
