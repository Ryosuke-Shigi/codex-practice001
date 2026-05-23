<?php

namespace Tests\Feature\Lab;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LabIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_lab_lists_entries_with_categories_and_ready_pp_placeholders(): void
    {
        // Lab の入口カードは表示カテゴリで絞り込むため、Inertia props の category を固定します。
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->has('experiments', 7)
                // SpecFlowTrainer はPPカードとして先頭に追加済みのため、Lab入口の固定propsにも含めます。
                ->where('experiments.0.id', 'spec-flow-trainer')
                ->where('experiments.0.title', 'SpecFlowTrainer')
                ->where('experiments.0.status', '構想・設計中')
                ->where('experiments.0.category', 'PP')
                ->where('experiments.0.href', '/lab/spec-flow-trainer')
                ->where('experiments.1.id', 'api-discovery-hub')
                ->where('experiments.1.title', 'API Discovery Hub')
                ->where('experiments.1.status', 'Preview')
                ->where('experiments.1.category', 'PROJECT')
                ->where('experiments.1.href', '/api-catalog')
                ->where('experiments.2.id', 'quakewave-preview')
                ->where('experiments.2.title', 'Japan Quake Wave Map')
                ->where('experiments.2.status', 'Preview')
                ->where('experiments.2.category', 'PROJECT')
                ->where('experiments.2.href', '/quakewave-preview/map')
                ->where('experiments.2.summary', '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認する地震情報可視化画面です。')
                ->where('experiments.3.id', 'api-preview')
                ->where('experiments.3.title', 'API Preview')
                ->where('experiments.3.status', 'Mock')
                ->where('experiments.3.category', 'MOCK')
                ->where('experiments.3.href', '/api-preview')
                ->where('experiments.4.id', 'quakewave-preview-tools')
                ->where('experiments.4.title', 'QuakeWave Preview')
                ->where('experiments.4.status', 'Mock')
                ->where('experiments.4.category', 'MOCK')
                ->where('experiments.4.href', '/quakewave-preview')
                ->where('experiments.5.id', 'construction-order-workflow-mock')
                ->where('experiments.5.title', '工事発注管理・請求システム モック')
                ->where('experiments.5.status', 'Mock')
                ->where('experiments.5.category', 'MOCK')
                ->where('experiments.5.href', '/lab/construction-order-workflow-mock')
                ->where('experiments.6.id', 'construction-order-workflow-concept')
                ->where('experiments.6.title', '工事発注管理・請求システム 構想まとめ')
                ->where('experiments.6.status', 'PP')
                ->where('experiments.6.category', 'PP')
                ->where('experiments.6.summary', 'Excel入口、CSV連携、Laravel正本化、画像管理、工程管理、請求書テンプレート選択型出力までをまとめた構想説明枠です。')
                ->where('experiments.6.href', '/lab/construction-order-workflow-pp')
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
