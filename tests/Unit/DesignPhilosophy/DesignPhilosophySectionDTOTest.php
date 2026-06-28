<?php

namespace Tests\Unit\DesignPhilosophy;

use App\DTO\DesignPhilosophy\Sections\DesignPhilosophySectionDTO;
use PHPUnit\Framework\TestCase;

class DesignPhilosophySectionDTOTest extends TestCase
{
    public function test_from_config_maps_config_section_to_component_props_array(): void
    {
        $dto = DesignPhilosophySectionDTO::fromConfig([
            'key' => 'human-led-ai',
            'sort_order' => 50,
            'enabled' => true,
            'eyebrow' => 'Human Led AI',
            'visual_type' => 'split',
            'icon' => 'Bot',
            'title' => 'AIと人間の分担',
            'lead' => 'AIは補助、人間は判断を持つ。',
            'body' => 'AIに丸投げするのではなく、構造と判断を人間側に残します。',
            'proof_label' => '分担',
            'proof_text' => '速く作ることと、後から保守できる形に留めることを分けて扱います。',
            'items' => [
                ['label' => '作る', 'description' => '目的を決める'],
                'invalid item',
            ],
            'left_label' => '人間',
            'right_label' => 'AI',
            'left_items' => ['仕様', '責務境界', ''],
            'right_items' => ['調査', '実装補助'],
        ]);

        $this->assertSame([
            'key' => 'human-led-ai',
            'sortOrder' => 50,
            'eyebrow' => 'Human Led AI',
            'visualType' => 'split',
            'icon' => 'Bot',
            'title' => 'AIと人間の分担',
            'lead' => 'AIは補助、人間は判断を持つ。',
            'body' => 'AIに丸投げするのではなく、構造と判断を人間側に残します。',
            'proofLabel' => '分担',
            'proofText' => '速く作ることと、後から保守できる形に留めることを分けて扱います。',
            'items' => [
                ['label' => '作る', 'description' => '目的を決める'],
            ],
            'leftLabel' => '人間',
            'rightLabel' => 'AI',
            'leftItems' => ['仕様', '責務境界'],
            'rightItems' => ['調査', '実装補助'],
        ], $dto->toArray());
    }
}
