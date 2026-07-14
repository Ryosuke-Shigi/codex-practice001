<?php

namespace App\DTO\LumiLabo;

/**
 * LumiLabo 案件一覧 MOCK の固定データ1件を運ぶ readonly DTO です。
 */
final readonly class LumiLaboProjectMockItemDTO
{
    public function __construct(
        public string $id,
        public string $companyName,
        public string $contactName,
        public string $address,
        public string $memo,
        public string $registeredDate,
    ) {}

    /**
     * @return array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'companyName' => $this->companyName,
            'contactName' => $this->contactName,
            'address' => $this->address,
            'memo' => $this->memo,
            'registeredDate' => $this->registeredDate,
        ];
    }
}
