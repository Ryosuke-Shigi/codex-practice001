<?php

namespace Tests\Unit\DesignPhilosophy;

use App\Actions\DesignPhilosophy\Queries\GetDesignPhilosophySectionsAction;
use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use Illuminate\Config\Repository;
use PHPUnit\Framework\TestCase;

class GetDesignPhilosophySectionsActionTest extends TestCase
{
    public function test_execute_returns_default_config_sections_in_display_order(): void
    {
        $config = new Repository([
            'design_philosophy' => require dirname(__DIR__, 3).'/config/design_philosophy.php',
        ]);
        $sections = (new GetDesignPhilosophySectionsAction($config))->execute();

        $this->assertSame([
            'hero',
            'principles',
            'human-ai-roles',
            'ai-development-flow',
            'architecture',
            'development-stages',
            'quality-gates',
            'improvement-loop',
            'closing',
        ], array_map(
            fn (DesignPhilosophySectionDTO $section): string => $section->key,
            $sections,
        ));
    }

    public function test_execute_returns_supported_enabled_sections_sorted_by_sort_order_as_dtos(): void
    {
        $config = new Repository;
        $config->set('design_philosophy.sections', [
            $this->section('architecture', 30, true),
            $this->section('unknown-section', 15, true),
            $this->section('hero', 10, false),
            $this->section('principles', 20, true),
        ]);

        $sections = (new GetDesignPhilosophySectionsAction($config))->execute();

        $this->assertCount(2, $sections);
        $this->assertContainsOnlyInstancesOf(DesignPhilosophySectionDTO::class, $sections);
        $this->assertSame(['principles', 'architecture'], array_map(
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
