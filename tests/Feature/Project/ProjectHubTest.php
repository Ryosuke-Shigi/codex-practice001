<?php

namespace Tests\Feature\Project;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectHubTest extends TestCase
{
    public function test_welcome_page_is_available_as_portfolio_top(): void
    {
        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome', false)
            );
    }

    public function test_project_select_page_is_available(): void
    {
        $this
            ->get('/projects')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Select', false)
            );
    }

    public function test_dance_shorts_project_hub_page_receives_selected_project_id(): void
    {
        $this
            ->get('/projects/dance-shorts')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'dance-shorts')
            );
    }

    public function test_project_hub_route_accepts_other_static_project_ids(): void
    {
        $this
            ->get('/projects/api-discovery-hub')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'api-discovery-hub')
            );

        $this
            ->get('/projects/japan-quake-wave-map')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'japan-quake-wave-map')
            );

        $this
            ->get('/projects/lumilabo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'lumilabo')
            );

        $this
            ->get('/projects/construction-order')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'construction-order')
            );
    }

    public function test_project_hub_linked_idea_board_and_mock_pages_remain_available(): void
    {
        $this
            ->get('/lab/api-discovery-hub-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ApiDiscoveryHubPp', false)
            );

        $this
            ->get('/lab/lumilabo-project-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLaboProjectIdeaBoard', false)
            );

        $this
            ->get('/lab/lumilabo-project-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLaboProjectMock', false)
            );

        $this
            ->get('/lab/construction-order-workflow-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderWorkflowPP', false)
            );

        $this
            ->get('/lab/construction-order-workflow-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderNewMock', false)
            );
    }

    public function test_old_lumilabo_project_create_idea_board_url_redirects_to_project_system_idea_board(): void
    {
        $this
            ->get('/lab/lumilabo-project-create-idea-board')
            ->assertRedirect('/lab/lumilabo-project-idea-board');
    }

    public function test_legacy_lab_entrypoint_and_compatibility_urls_are_removed(): void
    {
        $this->get('/lab')->assertNotFound();
        $this->get('/lab?category=PROJECT')->assertNotFound();
        $this->get('/lab?category=MOCK')->assertNotFound();

        $this->get('/lab/api-discovery-hub-pp')->assertNotFound();
        $this->get('/lab/quake-wave-map-pp')->assertNotFound();
        $this->get('/lab/construction-order-workflow-pp')->assertNotFound();
        $this->get('/lab/construction-order-new-mock')->assertNotFound();
    }
}
