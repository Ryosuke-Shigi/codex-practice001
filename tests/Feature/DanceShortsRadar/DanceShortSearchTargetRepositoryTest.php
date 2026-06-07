<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Enums\DanceShortsRadar\DanceShortSearchScope;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DanceShortSearchTargetRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_expanded_keywords_for_region_returns_only_page2_targets_in_sort_order(): void
    {
        $jp = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        $us = DanceShortRegion::query()->create([
            'code' => 'US',
            'name' => 'アメリカ',
            'sort_order' => 20,
            'is_active' => true,
        ]);

        $this->keyword($jp, 'standard keyword', DanceShortSearchScope::Standard, 1, 10, true);
        $second = $this->keyword($jp, 'expanded second', DanceShortSearchScope::Expanded, 2, 20, true);
        $first = $this->keyword($jp, 'expanded first', DanceShortSearchScope::Expanded, 2, 5, true);
        $this->keyword($jp, 'expanded inactive', DanceShortSearchScope::Expanded, 2, 30, false);
        $this->keyword($jp, 'expanded one page', DanceShortSearchScope::Expanded, 1, 40, true);
        $this->keyword($us, 'other region expanded', DanceShortSearchScope::Expanded, 2, 1, true);

        $keywords = $this->repository()->activeExpandedKeywordsForRegion($jp);

        $this->assertCount(2, $keywords);
        $this->assertTrue($first->is($keywords[0]));
        $this->assertTrue($second->is($keywords[1]));
    }

    private function repository(): DanceShortSearchTargetRepositoryInterface
    {
        return app(DanceShortSearchTargetRepositoryInterface::class);
    }

    private function keyword(
        DanceShortRegion $region,
        string $keyword,
        DanceShortSearchScope $scope,
        int $maxSearchPages,
        int $sortOrder,
        bool $isActive,
    ): DanceShortSearchKeyword {
        return DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => $keyword,
            'search_scope' => $scope->value,
            'max_search_pages' => $maxSearchPages,
            'sort_order' => $sortOrder,
            'is_active' => $isActive,
        ]);
    }
}
