<?php

namespace App\DTO\LumiLabo;

/**
 * LumiLabo 案件一覧 MOCK の readonly item DTO を固定定義順のまま運ぶ ListDTO です。
 */
final readonly class LumiLaboProjectMockListDTO
{
    /**
     * @param  array<int, LumiLaboProjectMockItemDTO>  $items
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
                fn (LumiLaboProjectMockItemDTO $item): array => $item->toArray(),
                $this->items,
            ),
        ];
    }
}
