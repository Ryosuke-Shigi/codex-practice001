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
                ->where('sections.0.title', '責務でつなぐ AI駆動開発')
                ->where('sections.0.eyebrow', 'ポートフォリオ／設計思想')
                ->where('sections.1.key', 'principles')
                ->where('sections.2.key', 'architecture')
                ->where('sections.2.title', 'コードの責務を、変更理由で分ける。')
                ->where('sections.3.key', 'development-stages')
                ->where('sections.4.key', 'human-ai-flow')
                ->where('sections.5.key', 'subagents')
                ->where('sections.5.title', '必要な役だけを選ぶ。')
                ->where('sections.6.key', 'engineering-loop')
                ->where('sections.7.key', 'understanding-reboot')
                ->where('sections.8.key', 'closing')
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
