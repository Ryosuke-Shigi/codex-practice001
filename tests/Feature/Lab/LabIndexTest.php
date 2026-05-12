<?php

namespace Tests\Feature\Lab;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LabIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_lab_lists_production_like_entries_above_mock_preview_entries(): void
    {
        $this
            ->get('/lab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/Index', false)
                ->has('experiments', 4)
                ->where('experiments.0.id', 'api-discovery-hub')
                ->where('experiments.0.title', 'API Discovery Hub')
                ->where('experiments.0.status', 'Preview')
                ->where('experiments.0.href', '/api-catalog')
                ->where('experiments.1.id', 'quakewave-preview')
                ->where('experiments.1.title', 'QuakeWave Map')
                ->where('experiments.1.status', 'Preview')
                ->where('experiments.1.href', '/quakewave-preview/map')
                ->where('experiments.1.summary', '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認する地震情報可視化画面です。')
                ->where('experiments.2.id', 'api-preview')
                ->where('experiments.2.title', 'API Preview')
                ->where('experiments.2.status', 'Mock')
                ->where('experiments.2.href', '/api-preview')
                ->where('experiments.3.id', 'quakewave-preview-tools')
                ->where('experiments.3.title', 'QuakeWave Preview')
                ->where('experiments.3.status', 'Mock')
                ->where('experiments.3.href', '/quakewave-preview')
            );
    }
}
