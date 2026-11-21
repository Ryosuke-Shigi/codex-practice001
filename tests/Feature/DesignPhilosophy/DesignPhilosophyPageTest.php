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
                ->where('sections.0.title', 'AIとつくる。品質は、仕組みで確かめる。')
                ->where('sections.0.eyebrow', '設計思想')
                ->where('sections.0.lead', '責務が分かるコードと、実装・検証・判断を分ける開発の仕組みを大切にしています。')
                ->where('sections.1.key', 'principles')
                ->where('sections.2.key', 'human-ai-roles')
                ->where('sections.2.title', '役割と作業条件を、仕組みでつなぐ。')
                ->where('sections.3.key', 'ai-development-flow')
                ->where('sections.4.key', 'architecture')
                ->where('sections.4.title', '責務を分け、意図を残す。')
                ->where('sections.5.key', 'development-stages')
                ->where('sections.5.title', '試してから、本番へ進める。')
                ->where('sections.6.key', 'quality-gates')
                ->where('sections.6.title', 'AIの答えを、そのまま完成にしない。')
                ->where('sections.7.key', 'improvement-loop')
                ->where('sections.8.key', 'closing')
                ->where('sections.8.title', '実行可能であることを、実行してよいことへ変換しない。')
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
