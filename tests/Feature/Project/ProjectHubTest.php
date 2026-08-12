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

    public function test_project_select_page_is_the_only_project_navigation_entry_and_accepts_url_state(): void
    {
        $this
            ->get('/projects')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Select', false)
            );

        $this
            ->get('/projects?project=dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Select', false)
            );

        $this
            ->get('/projects?project=dance-shorts-radar&view=stages')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Select', false)
            );
    }

    public function test_normal_projects_do_not_keep_a_generic_project_hub_route(): void
    {
        foreach ([
            'api-discovery-hub',
            'dance-shorts-radar',
            'dance-shorts-analyzer',
            'japan-quake-wave-map',
            'lumilab',
            'construction-order',
            'event-card-calendar',
        ] as $projectId) {
            $this->get('/projects/'.$projectId)->assertNotFound();
        }
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
            ->get('/lab/lumilab-project-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLabProjectIdeaBoard', false)
            );

        $this
            ->get('/lab/lumilab-project-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/LumiLabProjectMock', false)
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

    public function test_old_lumilab_project_create_idea_board_url_redirects_to_project_system_idea_board(): void
    {
        $this
            ->get('/lab/lumilab-project-create-idea-board')
            ->assertRedirect('/lab/lumilab-project-idea-board');
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
        $this->get('/projects/dance-shorts')->assertNotFound();
        $this->get('/projects/unknown')->assertNotFound();
    }
}
