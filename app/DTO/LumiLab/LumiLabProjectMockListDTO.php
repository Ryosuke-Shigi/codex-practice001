<?php

namespace App\DTO\LumiLab;

/**
 * LumiLab 案件一覧 MOCK の readonly item DTO を固定定義順のまま運ぶ ListDTO です。
 */
final readonly class LumiLabProjectMockListDTO
{
    /**
     * @param  array<int, LumiLabProjectMockItemDTO>  $items
     */
    public function __construct(
        public array $items,
    ) {}

    /**
     * @return array{items: array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string}>}
     */
    public function toArray(): array
    {
        return [
            'items' => array_map(
                fn (LumiLabProjectMockItemDTO $item): array => $item->toArray(),
                $this->items,
            ),
        ];
    }
}
