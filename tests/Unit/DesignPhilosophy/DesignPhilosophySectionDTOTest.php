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
            'key' => 'human-ai-flow',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => '04 / HUMAN + AI',
            'title' => 'コードだけでなく、AIにも責務を分ける。',
            'lead' => '人間、ChatGPT、Codex親Agentの判断と作業を混ぜない。',
            'body' => '同じ正本と停止条件から、必要な役だけを選びます。',
        ]);

        $this->assertSame([
            'key' => 'human-ai-flow',
            'sortOrder' => 50,
            'eyebrow' => '04 / HUMAN + AI',
            'title' => 'コードだけでなく、AIにも責務を分ける。',
            'lead' => '人間、ChatGPT、Codex親Agentの判断と作業を混ぜない。',
            'body' => '同じ正本と停止条件から、必要な役だけを選びます。',
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
