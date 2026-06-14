<?php

namespace Tests\Feature\Lab;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LabIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_lab_lists_project_idea_board_and_mock_entries_in_display_order(): void
    {
        /*
         * Lab Index は PROJECT -> IDEA-BOARD -> MOCK の順で見せます。
         * 単に「カードがある」だけではカテゴリ順が崩れても検知できないため、
         * 配列indexまで明示して確認します。
         */
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->has('experiments', 15)
                ->where('experiments.0.id', 'api-discovery-hub')
                ->where('experiments.0.title', 'API Discovery Hub 本番一覧')
                ->where('experiments.0.status', 'Preview')
                ->where('experiments.0.category', 'PROJECT')
                ->where('experiments.0.href', '/api-catalog')
                ->where('experiments.1.id', 'dance-shorts-analyzer')
                ->where('experiments.1.title', 'DanceShortsAnalyzer 保存済み動画検索')
                ->where('experiments.1.status', 'Preview')
                ->where('experiments.1.category', 'PROJECT')
                ->where('experiments.1.href', '/dance-shorts-analyzer')
                ->where('experiments.2.id', 'dance-shorts-radar')
                ->where('experiments.2.title', 'Dance Shorts Radar 通常ランキング')
                ->where('experiments.2.status', 'Preview')
                ->where('experiments.2.category', 'PROJECT')
                ->where('experiments.2.href', '/dance-shorts-radar')
                ->where('experiments.3.id', 'quakewave-preview')
                ->where('experiments.3.title', 'Japan Quake Wave Map 地図表示')
                ->where('experiments.3.status', 'Preview')
                ->where('experiments.3.category', 'PROJECT')
                ->where('experiments.3.href', '/quakewave-preview/map')
                ->where('experiments.4.id', 'api-discovery-hub-idea-board')
                ->where('experiments.4.title', 'API Discovery Hub')
                ->where('experiments.4.status', '完成済み')
                ->where('experiments.4.category', 'IDEA-BOARD')
                ->where('experiments.4.href', '/lab/api-discovery-hub-idea-board')
                ->where('experiments.5.id', 'dance-shorts-radar-idea-board')
                ->where('experiments.5.title', 'Dance Shorts Radar')
                ->where('experiments.5.status', 'ポートフォリオ候補')
                ->where('experiments.5.category', 'IDEA-BOARD')
                ->where('experiments.5.href', '/lab/dance-shorts-radar-idea-board')
                ->where('experiments.6.id', 'dance-shorts-analyzer-idea-board')
                ->where('experiments.6.title', 'Dance Shorts Analyzer')
                ->where('experiments.6.status', '構想・設計中')
                ->where('experiments.6.category', 'IDEA-BOARD')
                ->where('experiments.6.href', '/lab/dance-shorts-analyzer-idea-board')
                ->where('experiments.7.id', 'quake-wave-map-idea-board')
                ->where('experiments.7.title', 'Japan Quake Wave Map')
                ->where('experiments.7.status', '完成済み')
                ->where('experiments.7.category', 'IDEA-BOARD')
                ->where('experiments.7.href', '/lab/quake-wave-map-idea-board')
                ->where('experiments.8.id', 'spec-flow-trainer')
                ->where('experiments.8.title', 'Spec Flow Trainer')
                ->where('experiments.8.status', '構想・設計中')
                ->where('experiments.8.category', 'IDEA-BOARD')
                ->where('experiments.8.href', '/lab/spec-flow-trainer')
                ->where('experiments.9.id', 'construction-order-workflow-idea-board')
                ->where('experiments.9.title', '工事発注管理・請求システム')
                ->where('experiments.9.status', 'アイデアボード')
                ->where('experiments.9.category', 'IDEA-BOARD')
                ->where('experiments.9.href', '/lab/construction-order-workflow-idea-board')
                ->where('experiments.10.category', 'MOCK')
                ->where('experiments.11.id', 'dance-shorts-analyzer-mock')
                ->where('experiments.11.title', 'DanceShortsAnalyzer MOCK')
                ->where('experiments.11.status', 'Mock')
                ->where('experiments.11.category', 'MOCK')
                ->where('experiments.11.href', '/lab/dance-shorts-analyzer-mock')
                ->where('experiments.12.id', 'dance-shorts-radar-mock')
                ->where('experiments.12.title', 'Dance Shorts Radar モック')
                ->where('experiments.12.status', 'Mock')
                ->where('experiments.12.category', 'MOCK')
                ->where('experiments.12.href', '/lab/dance-shorts-radar-mock')
            );
    }

    public function test_lab_keeps_existing_mock_links_and_new_construction_mock_link(): void
    {
        /*
         * 既存の MOCK 導線を壊さないことも仕様です。
         * API Preview、QuakeWave Preview、工事発注の新MOCKが開けることを、
         * LabのInertia props上で固定します。
         */
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->where('experiments.10.id', 'api-preview')
                ->where('experiments.10.title', 'API Preview')
                ->where('experiments.10.status', 'Mock')
                ->where('experiments.10.category', 'MOCK')
                ->where('experiments.10.href', '/api-preview')
                ->where('experiments.11.id', 'dance-shorts-analyzer-mock')
                ->where('experiments.11.title', 'DanceShortsAnalyzer MOCK')
                ->where('experiments.11.status', 'Mock')
                ->where('experiments.11.category', 'MOCK')
                ->where('experiments.11.href', '/lab/dance-shorts-analyzer-mock')
                ->where('experiments.12.id', 'dance-shorts-radar-mock')
                ->where('experiments.12.title', 'Dance Shorts Radar モック')
                ->where('experiments.12.status', 'Mock')
                ->where('experiments.12.category', 'MOCK')
                ->where('experiments.12.href', '/lab/dance-shorts-radar-mock')
                ->where('experiments.13.id', 'quakewave-preview-tools')
                ->where('experiments.13.title', 'QuakeWave Preview')
                ->where('experiments.13.status', 'Mock')
                ->where('experiments.13.category', 'MOCK')
                ->where('experiments.13.href', '/quakewave-preview')
                ->where('experiments.14.id', 'construction-order-new-mock')
                ->where('experiments.14.title', '工事発注管理・請求システム 新MOCK')
                ->where('experiments.14.status', 'Mock')
                ->where('experiments.14.category', 'MOCK')
                ->where('experiments.14.href', '/lab/construction-order-new-mock')
            );
    }

    public function test_lab_keeps_existing_idea_board_pages_available(): void
    {
        $this
            ->get('/lab/spec-flow-trainer')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/SpecFlowTrainer', false)
            );
    }

    public function test_lab_redirects_legacy_pp_urls_to_idea_board_urls(): void
    {
        /*
         * PPからIDEA-BOARDへ名称変更しても、過去に共有したURLは壊さない方針です。
         * 旧URLは表示componentを直接返さず、新しいURLへ寄せることで導線名を一箇所へ統一します。
         */
        $this
            ->get('/lab/api-discovery-hub-pp')
            ->assertRedirect('/lab/api-discovery-hub-idea-board');

        $this
            ->get('/lab/quake-wave-map-pp')
            ->assertRedirect('/lab/quake-wave-map-idea-board');

        $this
            ->get('/lab/construction-order-workflow-pp')
            ->assertRedirect('/lab/construction-order-workflow-idea-board');
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

    public function test_construction_order_new_mock_page_is_available(): void
    {
        $this
            ->get('/lab/construction-order-new-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/ConstructionOrderNewMock', false)
            );
    }
}
