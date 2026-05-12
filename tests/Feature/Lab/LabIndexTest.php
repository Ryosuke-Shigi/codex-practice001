<?php

namespace Tests\Feature\Lab;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LabIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_lab_links_quakewave_card_to_completed_preview_map_entry(): void
    {
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->has('experiments', 4)
                ->where('experiments.2.id', 'quakewave-preview')
                ->where('experiments.2.title', 'QuakeWave Map')
                ->where('experiments.2.status', 'Preview')
                ->where('experiments.2.href', '/quakewave-preview/map')
                ->where('experiments.2.summary', '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認する地震情報可視化画面です。')
                ->where('experiments.3.id', 'quakewave-map-mock')
                ->where('experiments.3.title', 'QuakeWave Map Mock')
                ->where('experiments.3.status', 'Mock')
                ->where('experiments.3.href', '/quakewave-preview/map/mock')
            );
    }
}
