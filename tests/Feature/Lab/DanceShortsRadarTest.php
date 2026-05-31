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
}
