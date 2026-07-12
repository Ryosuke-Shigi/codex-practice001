<?php

namespace Tests\Feature\Lab;

use App\Actions\LumiLabo\Queries\GetLumiLaboProjectMockListAction;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LumiLaboProjectMockTest extends TestCase
{
    public function test_index_waits_for_the_client_measured_per_page_before_returning_projects(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLaboProjectMock', false)
                ->where('projectList.keyword', '')
                ->where('projectList.sort', 'registered_desc')
                ->where('projectList.perPage', null)
                ->where('projectList.isReady', false)
                ->where('projectList.currentPage', 1)
                ->where('projectList.showPagination', false)
                ->where('projectList.action', url('/lab/lumilabo-project-mock'))
                ->has('projectList.items', 0)
            );
    }

    public function test_measured_per_page_controls_the_server_side_page_size_without_exposing_other_projects(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock?per_page=3')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.perPage', 3)
                ->where('projectList.isReady', true)
                ->has('projectList.items', 3)
                ->missing('projectList.items.3')
                ->where('projectList.items.0.id', 'mock-project-002')
            );

        $this
            ->get('/lab/lumilabo-project-mock?per_page=20')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.perPage', 20)
                ->has('projectList.items', 20)
                ->missing('projectList.items.20')
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
                ->get('/lab/lumilabo-project-mock?per_page=20&keyword='.$keyword)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('projectList.keyword', $keyword)
                    ->has('projectList.items', 1)
                    ->where('projectList.items.0.id', $projectId)
                );
        }

        $this
            ->get('/lab/lumilabo-project-mock?per_page=20&keyword=%20%20岸和田%20%20初回%20')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.keyword', '岸和田 初回')
                ->has('projectList.items', 2)
                ->where('projectList.items.0.id', 'mock-project-005')
                ->where('projectList.items.1.id', 'mock-project-001')
            );

        $this
            ->get('/lab/lumilabo-project-mock?per_page=20&keyword=岸和田%E3%80%80初回')
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
            ->get('/lab/lumilabo-project-mock?per_page=3&page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 2)
                ->where('projectList.hasPrevious', true)
                ->where('projectList.previousPage', 1)
                ->where('projectList.hasNext', true)
                ->where('projectList.nextPage', 3)
                ->where('projectList.items.0.id', 'mock-project-005')
            );

        $this
            ->get('/lab/lumilabo-project-mock?per_page=3&keyword=初回')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 1)
                ->has('projectList.items', 3)
                ->where('projectList.showPagination', true)
            );
    }

    public function test_sorting_keeps_fixed_definition_order_for_same_registered_date(): void
    {
        $action = app(GetLumiLaboProjectMockListAction::class);

        $descending = $action->execute(null, 'registered_desc', 1, 20);
        $ascending = $action->execute(null, 'registered_asc', 1, 20);

        $this->assertSame('mock-project-002', $descending['items'][0]['id']);
        $this->assertSame('mock-project-003', $descending['items'][1]['id']);
        $this->assertSame('mock-project-002', $ascending['items'][18]['id']);
        $this->assertSame('mock-project-003', $ascending['items'][19]['id']);
    }

    public function test_page_overflow_and_empty_result_are_normalized_without_pagination(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock?per_page=3&page=99')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 7)
                ->where('projectList.hasPrevious', true)
                ->where('projectList.hasNext', false)
            );

        $this
            ->get('/lab/lumilabo-project-mock?per_page=3&keyword=%E8%A9%B2%E5%BD%93%E3%81%AA%E3%81%97')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 1)
                ->where('projectList.showPagination', false)
                ->has('projectList.items', 0)
            );
    }

    public function test_deleted_projects_are_excluded_before_pagination_and_search(): void
    {
        $this
            ->get('/lab/lumilabo-project-mock?per_page=3&deleted_ids[]=mock-project-002&deleted_ids[]=mock-project-003')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('projectList.items', 3)
                ->where('projectList.items.0.id', 'mock-project-004')
                ->where('projectList.showPagination', true)
            );

        $this
            ->get('/lab/lumilabo-project-mock?per_page=3&page=7&deleted_ids[]=mock-project-001&deleted_ids[]=mock-project-002')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 6)
                ->where('projectList.hasNext', false)
                ->where('projectList.items.0.id', 'mock-project-018')
            );

        $this
            ->get('/lab/lumilabo-project-mock?per_page=20&keyword=%E5%B2%B8%E5%92%8C%E7%94%B0&deleted_ids[]=mock-project-005')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('projectList.items', 3)
                ->where('projectList.items.0.id', 'mock-project-004')
                ->where('projectList.items.2.id', 'mock-project-016')
                ->missing('projectList.total')
            );
    }

    public function test_all_deleted_projects_return_an_empty_first_page_without_pagination(): void
    {
        $deletedProjectIds = array_map(
            fn (int $number): string => sprintf('mock-project-%03d', $number),
            range(1, 20),
        );

        $this
            ->get('/lab/lumilabo-project-mock?'.http_build_query([
                'per_page' => 3,
                'page' => 7,
                'deleted_ids' => $deletedProjectIds,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('projectList.currentPage', 1)
                ->where('projectList.showPagination', false)
                ->where('projectList.hasPrevious', false)
                ->where('projectList.hasNext', false)
                ->has('projectList.items', 0)
                ->missing('projectList.total')
            );
    }

    public function test_invalid_query_values_are_validation_errors(): void
    {
        $this
            ->from('/lab/lumilabo-project-mock')
            ->get('/lab/lumilabo-project-mock?sort=name&page=0&per_page=0')
            ->assertRedirect('/lab/lumilabo-project-mock')
            ->assertSessionHasErrors(['sort', 'page', 'per_page']);

        $this
            ->from('/lab/lumilabo-project-mock')
            ->get('/lab/lumilabo-project-mock?per_page=21')
            ->assertRedirect('/lab/lumilabo-project-mock')
            ->assertSessionHasErrors(['per_page']);

        $this
            ->from('/lab/lumilabo-project-mock')
            ->get('/lab/lumilabo-project-mock?deleted_ids=mock-project-001')
            ->assertRedirect('/lab/lumilabo-project-mock')
            ->assertSessionHasErrors(['deleted_ids']);

        $this
            ->from('/lab/lumilabo-project-mock')
            ->get('/lab/lumilabo-project-mock?deleted_ids[]=invalid-project')
            ->assertRedirect('/lab/lumilabo-project-mock')
            ->assertSessionHasErrors(['deleted_ids.0']);

        $this
            ->get('/lab/lumilabo-project-mock?per_page=20&deleted_ids[]=mock-project-999')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('projectList.items', 20));
    }
}
