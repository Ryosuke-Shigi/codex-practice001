<?php

namespace Tests\Unit\DesignPhilosophy;

use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use PHPUnit\Framework\TestCase;

class DesignPhilosophySectionDTOTest extends TestCase
{
    public function test_from_config_maps_config_section_to_component_props_array(): void
    {
        $dto = DesignPhilosophySectionDTO::fromConfig([
            'key' => 'overview',
            'sort_order' => 10,
            'enabled' => true,
            'title' => 'この設計思想について。',
            'lead' => 'できている範囲を大きく見せるためではなく、変更しながら壊しにくくするための判断基準です。',
            'body' => 'このページでは、なぜ責務、段階、確認手段を分けるのかを説明します。',
            'proof_label' => '扱っていること',
            'proof_text' => 'READMEは概要に留め、詳細な判断理由はDesign Philosophy画面とdocsへ分けます。',
        ]);

        $this->assertSame([
            'key' => 'overview',
            'sortOrder' => 10,
            'title' => 'この設計思想について。',
            'lead' => 'できている範囲を大きく見せるためではなく、変更しながら壊しにくくするための判断基準です。',
            'body' => 'このページでは、なぜ責務、段階、確認手段を分けるのかを説明します。',
            'proofLabel' => '扱っていること',
            'proofText' => 'READMEは概要に留め、詳細な判断理由はDesign Philosophy画面とdocsへ分けます。',
        ], $dto->toArray());
    }
}
