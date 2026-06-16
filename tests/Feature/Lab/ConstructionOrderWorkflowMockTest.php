<?php

namespace Tests\Feature\Lab;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConstructionOrderWorkflowMockTest extends TestCase
{
    public function test_construction_order_workflow_mock_page_is_available(): void
    {
        /*
         * 工事発注MOCKは固定データで導線とUI契約を確認する画面です。
         * Featureテストでは、Route と Inertia Page の接続だけを固定します。
         */
        $this
            ->get('/lab/construction-order-workflow-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderNewMock', false)
            );
    }

    public function test_construction_order_workflow_idea_board_page_is_available(): void
    {
        $this
            ->get('/lab/construction-order-workflow-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderWorkflowPP', false)
            );
    }
}
