<?php

namespace Tests\Feature\Project;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectHubTest extends TestCase
{
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
            ->get('/projects/construction-order')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Hub', false)
                ->where('projectId', 'construction-order')
            );
    }
}
