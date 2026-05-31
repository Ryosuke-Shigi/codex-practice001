<?php

namespace Tests\Feature\Lab;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DanceShortsRadarTest extends TestCase
{
    public function test_dance_shorts_radar_idea_board_page_is_available(): void
    {
        /*
         * Dance Shorts Radar はまだ本体API連携を持たないアイデアボードです。
         * Featureテストでは、Labから遷移する静的紹介ページの導線だけを固定します。
         */
        $this
            ->get('/lab/dance-shorts-radar-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/DanceShortsRadar', false)
            );
    }

    public function test_dance_shorts_radar_mock_page_is_available_with_sorted_mock_candidates(): void
    {
        /*
         * YouTube API疎通前のモック画面です。
         * 固定データを地域別に渡し、React側はタブ選択と表示だけに寄せます。
         */
        $this
            ->get('/lab/dance-shorts-radar-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/DanceShortsRadarMock', false)
                ->where('mockNotice', 'この一覧は YouTube Data API には接続していないモックデータです。')
                ->has('regions', 3)
                ->where('regions.0.code', 'JP')
                ->where('regions.1.code', 'US')
                ->where('regions.2.code', 'KR')
                ->has('candidatesByRegion.JP', 3)
                ->has('candidatesByRegion.US', 3)
                ->has('candidatesByRegion.KR', 3)
                ->where('candidatesByRegion.JP.0.views_per_hour', 28600)
                ->where('candidatesByRegion.JP.0.view_diff', 171600)
                ->where('candidatesByRegion.JP.0.thumbnail_url', '/images/dance-shorts-radar/mock-jp.svg')
                ->where('candidatesByRegion.JP.0.youtube_url', 'https://www.youtube.com/shorts/mock-jp-studio-mirror')
            );
    }
}
