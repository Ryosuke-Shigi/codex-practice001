<?php

namespace Tests\Feature\DesignPhilosophy;

use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DesignPhilosophyPageTest extends TestCase
{
    public function test_design_philosophy_page_renders_default_sections_from_config(): void
    {
        $this
            ->get('/design-philosophy')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DesignPhilosophy/Index', false)
                ->has('sections', 9)
                ->where('sections.0.key', 'hero')
                ->where('sections.0.title', 'AIに丸投げしない。')
                ->where('sections.1.key', 'human-driven')
                ->where('sections.1.title', '人間が仕様・責務・判断を握る。')
                ->where('sections.2.key', 'agent-guide')
                ->where('sections.3.key', 'spec-first')
                ->where('sections.4.key', 'dto-boundary')
                ->where('sections.5.key', 'layered-architecture')
                ->where('sections.6.key', 'tdd-guardrail')
                ->where('sections.7.key', 'review-flow')
                ->where('sections.8.key', 'understanding-reboot')
                ->where('sections.8.title', '理解を再起動できる構造にする。')
            );
    }

    public function test_design_philosophy_page_renders_sorted_enabled_sections(): void
    {
        Config::set('design_philosophy.sections', [
            $this->section('later', 30, true, 'Later title'),
            $this->section('hidden', 10, false, 'Hidden title'),
            $this->section('first', 20, true, 'First title'),
        ]);

        $this
            ->get('/design-philosophy')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DesignPhilosophy/Index', false)
                ->has('sections', 2)
                ->where('sections.0.key', 'first')
                ->where('sections.0.sortOrder', 20)
                ->where('sections.0.title', 'First title')
                ->where('sections.0.proofLabel', 'Proof')
                ->where('sections.0.proofText', 'Proof text')
                ->where('sections.1.key', 'later')
                ->where('sections.1.sortOrder', 30)
            );
    }

    /**
     * @return array<string, mixed>
     */
    private function section(string $key, int $sortOrder, bool $enabled, string $title): array
    {
        return [
            'key' => $key,
            'sort_order' => $sortOrder,
            'enabled' => $enabled,
            'title' => $title,
            'lead' => 'Lead',
            'body' => 'Body',
            'proof_label' => 'Proof',
            'proof_text' => 'Proof text',
        ];
    }
}
