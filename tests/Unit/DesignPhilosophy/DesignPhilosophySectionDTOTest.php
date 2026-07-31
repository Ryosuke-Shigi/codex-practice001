<?php

namespace Tests\Unit\DesignPhilosophy;

use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class DesignPhilosophySectionDTOTest extends TestCase
{
    public function test_from_config_maps_config_section_to_component_props_array(): void
    {
        $dto = DesignPhilosophySectionDTO::fromConfig([
            'key' => 'ai-development-flow',
            'sort_order' => 40,
            'enabled' => true,
            'eyebrow' => '03 / CONTROLLED FLOW',
            'title' => '速さではなく、制御できる流れをつくる。',
            'lead' => '探索、設計、実装、検証、レビューを混在させません。',
            'body' => '各工程の責務を分け、確認不能な状態では安全に停止します。',
        ]);

        $this->assertSame([
            'key' => 'ai-development-flow',
            'sortOrder' => 40,
            'eyebrow' => '03 / CONTROLLED FLOW',
            'title' => '速さではなく、制御できる流れをつくる。',
            'lead' => '探索、設計、実装、検証、レビューを混在させません。',
            'body' => '各工程の責務を分け、確認不能な状態では安全に停止します。',
        ], $dto->toArray());
    }

    public function test_from_config_rejects_a_key_outside_the_fixed_nine_sections(): void
    {
        $this->expectException(InvalidArgumentException::class);

        DesignPhilosophySectionDTO::fromConfig([
            'key' => 'unknown-section',
            'sort_order' => 100,
            'enabled' => true,
            'eyebrow' => 'UNKNOWN',
            'title' => 'Unknown',
            'lead' => 'Unknown',
            'body' => 'Unknown',
        ]);
    }
}
