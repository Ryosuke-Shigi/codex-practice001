<?php

namespace Tests\Unit\ApiCatalog\DTO;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use PHPUnit\Framework\TestCase;

class ApiCatalogSyncResultDTOTest extends TestCase
{
    public function test_to_array_returns_sync_result_counts(): void
    {
        /*
         * ApiCatalogSyncResultDTO は同期結果の件数をレイヤー間で運ぶDTOです。
         * toArray() はレスポンス生成ではなく配列化だけに限定し、Responderやstatus保存側が
         * その結果をどう出力するかは別レイヤーの責務として残します。
         */
        $dto = new ApiCatalogSyncResultDTO(
            totalCount: 10,
            insertedCount: 2,
            updatedCount: 3,
            skippedCount: 4,
            inactiveCount: 1,
            failedCount: 5,
        );

        $this->assertSame([
            'total_count' => 10,
            'inserted_count' => 2,
            'updated_count' => 3,
            'skipped_count' => 4,
            'inactive_count' => 1,
            'failed_count' => 5,
        ], $dto->toArray());
    }
}
