<?php

namespace Tests\Feature\Lab;

use App\Actions\LumiLabo\Queries\GetLumiLaboProjectMockListAction;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LumiLaboProjectMockTest extends TestCase
{
    public function test_index_returns_the_mobile_first_page_without_exposing_all_fixed_projects(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLaboProjectMock', false)
                ->where('projectList.keyword', '')
                ->where('projectList.sort', 'registered_desc')
                ->where('projectList.viewport', 'mobile')
                ->where('projectList.currentPage', 1)
                ->where('projectList.showPagination', true)
                ->where('projectList.action', url('/lab/lumilabo-project-mock'))
                ->has('projectList.items', 5)
                ->missing('projectList.items.5')
                ->where('projectList.items.0.id', 'mock-project-002')
                ->where('projectList.items.0.registeredDate', '2026/07/12')
            );
    }

    public function test_viewport_controls_the_server_side_page_size(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock?viewport=tablet')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.viewport', 'tablet')
                ->has('projectList.items', 8)
                ->missing('projectList.items.8')
            );

        $this
            ->get('/lab/lumilabo-project-mock?viewport=desktop')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.viewport', 'desktop')
                ->has('projectList.items', 10)
                ->missing('projectList.items.10')
            );
    }

    public function test_searches_each_supported_field_and_normalizes_spaces_for_and_search(): void
    {
        foreach ([
            '南海' => 'mock-project-002',
            '山田' => 'mock-project-001',
            '泉佐野' => 'mock-project-006',
            '色見本' => 'mock-project-012',
        ] as $keyword => $projectId) {
            $this
                ->get('/lab/lumilabo-project-mock?viewport=desktop&keyword='.$keyword)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('projectList.keyword', $keyword)
                    ->has('projectList.items', 1)
                    ->where('projectList.items.0.id', $projectId)
                );
        }

        $this
            ->get('/lab/lumilabo-project-mock?viewport=desktop&keyword=%20%20岸和田%20%20初回%20')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.keyword', '岸和田 初回')
                ->has('projectList.items', 2)
                ->where('projectList.items.0.id', 'mock-project-005')
                ->where('projectList.items.1.id', 'mock-project-001')
            );

        $this
            ->get('/lab/lumilabo-project-mock?viewport=desktop&keyword=岸和田%E3%80%80初回')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.keyword', '岸和田 初回')
                ->has('projectList.items', 2)
                ->missing('projectList.items.2')
            );
    }

    public function test_search_result_is_sorted_then_paginated_and_reports_previous_and_next_pages(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock?viewport=mobile&page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 2)
                ->where('projectList.hasPrevious', true)
                ->where('projectList.previousPage', 1)
                ->where('projectList.hasNext', true)
                ->where('projectList.nextPage', 3)
                ->where('projectList.items.0.id', 'mock-project-007')
            );

        $this
            ->get('/lab/lumilabo-project-mock?viewport=mobile&keyword=初回')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 1)
                ->has('projectList.items', 5)
                ->where('projectList.showPagination', true)
            );
    }

    public function test_sorting_keeps_fixed_definition_order_for_same_registered_date(): void
    {
        $action = app(GetLumiLaboProjectMockListAction::class);

        $descending = $action->execute(null, 'registered_desc', 1, 'desktop');
        $ascending = $action->execute(null, 'registered_asc', 2, 'desktop');

        $this->assertSame('mock-project-002', $descending['items'][0]['id']);
        $this->assertSame('mock-project-003', $descending['items'][1]['id']);
        $this->assertSame('mock-project-002', $ascending['items'][8]['id']);
        $this->assertSame('mock-project-003', $ascending['items'][9]['id']);
    }

    public function test_page_overflow_and_empty_result_are_normalized_without_pagination(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock?viewport=mobile&page=99')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 4)
                ->where('projectList.hasPrevious', true)
                ->where('projectList.hasNext', false)
            );

        $this
            ->get('/lab/lumilabo-project-mock?keyword=%E8%A9%B2%E5%BD%93%E3%81%AA%E3%81%97')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 1)
                ->where('projectList.showPagination', false)
                ->has('projectList.items', 0)
            );
    }

    public function test_invalid_query_values_are_validation_errors(): void
    {
        $this
            ->from('/lab/lumilabo-project-mock')
            ->get('/lab/lumilabo-project-mock?sort=name&page=0&viewport=wide')
            ->assertRedirect('/lab/lumilabo-project-mock')
            ->assertSessionHasErrors(['sort', 'page', 'viewport']);
    }
}
