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
                ->where('sections.0.title', '変更できる。理解し直せる。確かめられる。')
                ->where('sections.0.eyebrow', '設計思想')
                ->where('sections.0.lead', '継続的に開発・保守できるシステムを目指し、責務を分け、設計の意図を残し、実際の結果を確かめます。')
                ->where('sections.1.key', 'principles')
                ->where('sections.2.key', 'human-ai-roles')
                ->where('sections.2.title', '役割と作業条件を、仕組みでつなぐ。')
                ->where('sections.3.key', 'ai-development-flow')
                ->where('sections.3.title', '作業条件から最終判断まで、確認結果をつなぐ。')
                ->where('sections.3.lead', '作業条件、調査、実装、検証、レビュー、最終判断へと、確認結果と未確認事項を渡します。')
                ->where('sections.3.body', '技術相談は必要な場合に依頼し、指摘があれば修正と再確認へ戻します。')
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

    public function test_design_philosophy_sections_keep_the_existing_props_without_chapter_numbers(): void
    {
        $this->get('/design-philosophy')->assertOk()->assertInertia(function (Assert $page): void {
            for ($index = 0; $index < 9; $index++) {
                $page->has('sections.'.$index, fn (Assert $section) => $section
                    ->whereAllType([
                        'key' => 'string',
                        'sortOrder' => 'integer',
                        'eyebrow' => 'string',
                        'title' => 'string',
                        'lead' => 'string',
                        'body' => 'string',
                    ])
                    ->where('eyebrow', fn (string $eyebrow): bool => preg_match('~^(?:\d+\s*[/／]|FINAL\b)~iu', $eyebrow) === 0)
                );
            }
        });
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
