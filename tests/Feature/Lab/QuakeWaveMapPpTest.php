<?php

namespace Tests\Feature\Lab;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuakeWaveMapPpTest extends TestCase
{
    public function test_quake_wave_map_idea_board_page_is_available(): void
    {
        /*
         * Japan Quake Wave Map の紹介LPも、本体のXML取得や同期処理とは切り離した静的ページです。
         * ここでは地図データの中身ではなく、/lab から遷移する紹介入口が壊れていないことを守ります。
         */
        $this
            ->get('/lab/quake-wave-map-idea-board')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/QuakeWaveMapPp', false)
            );
    }
}
