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
                ->where('sections.0.title', '人間主導のAI開発設計思想')
                ->where('sections.0.eyebrow', 'ポートフォリオ／設計思想')
                ->where('sections.1.key', 'principles')
                ->where('sections.2.key', 'human-ai-roles')
                ->where('sections.3.key', 'ai-development-flow')
                ->where('sections.4.key', 'architecture')
                ->where('sections.4.title', 'Laravelの責務を、変更理由で分ける。')
                ->where('sections.5.key', 'development-stages')
                ->where('sections.6.key', 'quality-gates')
                ->where('sections.7.key', 'improvement-loop')
                ->where('sections.8.key', 'closing')
                ->where('sections.8.title', '壊さず、迷わず、成長し続ける。')
            );
    }

    public function test_design_philosophy_page_renders_sorted_enabled_sections(): void
    {
        Config::set('design_philosophy.sections', [
            $this->section('architecture', 30, true, 'Architecture title'),
            $this->section('hero', 10, false, 'Hero title'),
            $this->section('principles', 20, true, 'Principles title'),
        ]);

        $this
            ->get('/design-philosophy')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DesignPhilosophy/Index', false)
                ->has('sections', 2)
                ->where('sections.0.key', 'principles')
                ->where('sections.0.sortOrder', 20)
                ->where('sections.0.title', 'Principles title')
                ->where('sections.0.eyebrow', 'Section')
                ->where('sections.0.lead', 'Lead')
                ->where('sections.0.body', 'Body')
                ->where('sections.1.key', 'architecture')
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
            'eyebrow' => 'Section',
            'title' => $title,
            'lead' => 'Lead',
            'body' => 'Body',
        ];
    }
}
