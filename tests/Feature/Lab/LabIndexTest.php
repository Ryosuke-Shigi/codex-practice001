<?php

namespace Tests\Feature\Lab;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LabIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_lab_lists_portfolio_pp_entries_in_display_order(): void
    {
        /*
         * PPカテゴリの表示順は、面接時に見せる機能紹介LPの導線として固定します。
         * 単に「カードがある」だけでは、API / 地震 / 工事発注 / Spec Flow Trainer の優先順が
         * 崩れても検知できないため、配列indexまで明示して確認します。
         */
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->has('experiments', 9)
                ->where('experiments.0.id', 'api-discovery-hub-pp')
                ->where('experiments.0.title', 'API Discovery Hub')
                ->where('experiments.0.status', '完成済み')
                ->where('experiments.0.category', 'PP')
                ->where('experiments.0.href', '/lab/api-discovery-hub-pp')
                ->where('experiments.1.id', 'quake-wave-map-pp')
                ->where('experiments.1.title', 'Japan Quake Wave Map')
                ->where('experiments.1.status', '完成済み')
                ->where('experiments.1.category', 'PP')
                ->where('experiments.1.href', '/lab/quake-wave-map-pp')
                ->where('experiments.2.id', 'construction-order-workflow-concept')
                ->where('experiments.2.title', '工事発注管理・請求システム')
                ->where('experiments.2.status', 'PP')
                ->where('experiments.2.category', 'PP')
                ->where('experiments.2.href', '/lab/construction-order-workflow-pp')
                ->where('experiments.3.id', 'spec-flow-trainer')
                ->where('experiments.3.title', 'Spec Flow Trainer')
                ->where('experiments.3.status', '構想・設計中')
                ->where('experiments.3.category', 'PP')
                ->where('experiments.3.href', '/lab/spec-flow-trainer')
            );
    }

    public function test_lab_keeps_existing_project_and_mock_links(): void
    {
        /*
         * 今回の主対象はPP紹介ページですが、既存のPROJECT / MOCK導線を壊さないことも仕様です。
         * API本番一覧、地震地図、API Preview、QuakeWave Preview、工事発注モックが
         * これまで通り開けることを、LabのInertia props上で固定します。
         */
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->where('experiments.4.id', 'api-discovery-hub')
                ->where('experiments.4.title', 'API Discovery Hub 本番一覧')
                ->where('experiments.4.status', 'Preview')
                ->where('experiments.4.category', 'PROJECT')
                ->where('experiments.4.href', '/api-catalog')
                ->where('experiments.5.id', 'quakewave-preview')
                ->where('experiments.5.title', 'Japan Quake Wave Map 地図表示')
                ->where('experiments.5.status', 'Preview')
                ->where('experiments.5.category', 'PROJECT')
                ->where('experiments.5.href', '/quakewave-preview/map')
                ->where('experiments.5.summary', '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認する地震情報可視化画面です。')
                ->where('experiments.6.id', 'api-preview')
                ->where('experiments.6.title', 'API Preview')
                ->where('experiments.6.status', 'Mock')
                ->where('experiments.6.category', 'MOCK')
                ->where('experiments.6.href', '/api-preview')
                ->where('experiments.7.id', 'quakewave-preview-tools')
                ->where('experiments.7.title', 'QuakeWave Preview')
                ->where('experiments.7.status', 'Mock')
                ->where('experiments.7.category', 'MOCK')
                ->where('experiments.7.href', '/quakewave-preview')
                ->where('experiments.8.id', 'construction-order-workflow-mock')
                ->where('experiments.8.title', '工事発注管理・請求システム モック')
                ->where('experiments.8.status', 'Mock')
                ->where('experiments.8.category', 'MOCK')
                ->where('experiments.8.href', '/lab/construction-order-workflow-mock')
            );
    }

    public function test_lab_keeps_existing_pp_pages_available(): void
    {
        $this
            ->get('/lab/spec-flow-trainer')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/SpecFlowTrainer', false)
            );
    }

    public function test_construction_order_workflow_pp_page_is_available(): void
    {
        $this
            ->get('/lab/construction-order-workflow-pp')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderWorkflowPP', false)
            );
    }

    public function test_construction_order_workflow_mock_page_is_available(): void
    {
        $this
            ->get('/lab/construction-order-workflow-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderWorkflowMock', false)
            );
    }
}
