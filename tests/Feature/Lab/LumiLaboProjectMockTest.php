<?php

namespace Tests\Feature\Lab;

use App\Actions\LumiLabo\Queries\GetLumiLaboProjectMockListAction;
use App\DTO\LumiLabo\LumiLaboProjectMockItemDTO;
use App\DTO\LumiLabo\LumiLaboProjectMockListDTO;
use App\Responders\LumiLabo\LumiLaboProjectMockResponder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LumiLaboProjectMockTest extends TestCase
{
    public function test_index_returns_all_twenty_initial_projects_without_list_query_props(): void
    {
        $this->get('/lab/lumilabo-project-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLaboProjectMock', false)
                ->has('projectList', fn (Assert $projectList) => $projectList
                    ->has('items', 20)
                    ->where('items.0.id', 'mock-project-001')
                    ->where('items.1.id', 'mock-project-002')
                    ->where('items.0.registeredDate', '2026/07/07')
                    ->missing('keyword')
                    ->missing('sort')
                    ->missing('perPage')
                    ->missing('per_page')
                    ->missing('currentPage')
                    ->missing('total')
                    ->missing('action')
                )
                ->missing('initialDeletedProjectIds')
                ->missing('initialProjectOverrides')
            );
    }

    public function test_action_returns_a_list_dto_with_twenty_item_dtos_in_fixed_order(): void
    {
        $list = app(GetLumiLaboProjectMockListAction::class)->execute();
        $expectedIds = array_map(
            fn (int $number): string => sprintf('mock-project-%03d', $number),
            range(1, 20),
        );

        $this->assertInstanceOf(LumiLaboProjectMockListDTO::class, $list);
        $this->assertCount(20, $list->items);
        $this->assertContainsOnlyInstancesOf(
            LumiLaboProjectMockItemDTO::class,
            $list->items,
        );
        $this->assertSame(
            $expectedIds,
            array_column($list->toArray()['items'], 'id'),
        );
        $this->assertSame('2026-07-07', $list->items[0]->registeredDate);
        $this->assertSame('2026-07-12', $list->items[1]->registeredDate);
        $this->assertSame('2026-07-12', $list->items[2]->registeredDate);
    }

    public function test_legacy_list_query_is_ignored_without_a_validation_redirect(): void
    {
        $this->get(
            '/lab/lumilabo-project-mock?sort=name&page=0&per_page=0'.
            '&deleted_ids[]=invalid&overrides[0][company_name]=changed',
        )
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('projectList.items', 20)
                ->where('projectList.items.0.id', 'mock-project-001')
                ->where(
                    'projectList.items.0.companyName',
                    'ルミラボ工務店',
                )
            );
    }

    public function test_responder_keeps_item_fields_and_converts_only_the_display_date(): void
    {
        $list = app(GetLumiLaboProjectMockListAction::class)->execute();
        $response = app(LumiLaboProjectMockResponder::class)->index($list);

        request()->headers->set('X-Inertia', 'true');
        $page = $response->toResponse(request())->getData(true);
        $expectedFirstItem = [
            ...$list->items[0]->toArray(),
            'registeredDate' => '2026/07/07',
        ];

        $this->assertSame('Lab/LumiLaboProjectMock', $page['component']);
        $this->assertSame(
            ['items'],
            array_keys($page['props']['projectList']),
        );
        $this->assertSame(
            $expectedFirstItem,
            $page['props']['projectList']['items'][0],
        );
        $this->assertCount(20, $page['props']['projectList']['items']);
    }

    public function test_removed_request_and_middleware_are_not_referenced(): void
    {
        $requestPath = app_path(
            'Http/Requests/LumiLabo/LumiLaboProjectMockIndexRequest.php',
        );
        $middlewarePath = app_path(
            'Http/Middleware/PreserveLumiLaboProjectMockCompanyNameWhitespace.php',
        );
        $bootstrap = file_get_contents(base_path('bootstrap/app.php'));

        $this->assertFileDoesNotExist($requestPath);
        $this->assertFileDoesNotExist($middlewarePath);
        $this->assertIsString($bootstrap);
        $this->assertStringNotContainsString(
            'PreserveLumiLaboProjectMockCompanyNameWhitespace',
            $bootstrap,
        );
    }
}
