<?php

namespace Tests\Unit\DesignPhilosophy;

use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use PHPUnit\Framework\TestCase;

class DesignPhilosophySectionDTOTest extends TestCase
{
    public function test_from_config_maps_config_section_to_component_props_array(): void
    {
        $dto = DesignPhilosophySectionDTO::fromConfig([
            'key' => 'hero',
            'sort_order' => 10,
            'enabled' => true,
            'title' => 'AIに丸投げしない。',
            'lead' => '仕様・責務・判断は人間が握る。',
            'body' => 'AIは実装速度を上げる補助として使い、完成判断は人間が行う。',
            'proof_label' => '開発運用',
            'proof_text' => 'ChatGPTで仕様整理し、CodexAppで実装し、GitHub差分とテストで確認する。',
        ]);

        $this->assertSame([
            'key' => 'hero',
            'sortOrder' => 10,
            'title' => 'AIに丸投げしない。',
            'lead' => '仕様・責務・判断は人間が握る。',
            'body' => 'AIは実装速度を上げる補助として使い、完成判断は人間が行う。',
            'proofLabel' => '開発運用',
            'proofText' => 'ChatGPTで仕様整理し、CodexAppで実装し、GitHub差分とテストで確認する。',
        ], $dto->toArray());
    }
}
