<?php

namespace Tests\Unit\DesignPhilosophy;

use App\Actions\DesignPhilosophy\Queries\GetDesignPhilosophySectionsAction;
use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class GetDesignPhilosophySectionsActionTest extends TestCase
{
    public function test_execute_returns_default_config_sections_in_display_order(): void
    {
        $sections = app(GetDesignPhilosophySectionsAction::class)->execute();

        $this->assertSame([
            'hero',
            'principles',
            'architecture',
            'development-stages',
            'human-ai-flow',
            'subagents',
            'engineering-loop',
            'understanding-reboot',
            'closing',
        ], array_map(
            fn (DesignPhilosophySectionDTO $section): string => $section->key,
            $sections,
        ));
    }

    public function test_execute_returns_enabled_sections_sorted_by_sort_order_as_dtos(): void
    {
        Config::set('design_philosophy.sections', [
            $this->section('third', 30, true),
            $this->section('disabled', 10, false),
            $this->section('first', 20, true),
        ]);

        $sections = app(GetDesignPhilosophySectionsAction::class)->execute();

        $this->assertCount(2, $sections);
        $this->assertContainsOnlyInstancesOf(DesignPhilosophySectionDTO::class, $sections);
        $this->assertSame(['first', 'third'], array_map(
            fn (DesignPhilosophySectionDTO $section): string => $section->key,
            $sections,
        ));
        $this->assertSame([20, 30], array_map(
            fn (DesignPhilosophySectionDTO $section): int => $section->sortOrder,
            $sections,
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function section(string $key, int $sortOrder, bool $enabled): array
    {
        return [
            'key' => $key,
            'sort_order' => $sortOrder,
            'enabled' => $enabled,
            'eyebrow' => 'Section',
            'title' => "{$key} title",
            'lead' => "{$key} lead",
            'body' => "{$key} body",
        ];
    }
}
