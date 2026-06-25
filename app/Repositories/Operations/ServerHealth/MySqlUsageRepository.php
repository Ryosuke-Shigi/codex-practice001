<?php

namespace App\Repositories\Operations\ServerHealth;

use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * MySQL の DB 容量と binlog 容量を取得する Repository です。
 *
 * binlog は権限や設定で取得できない場合があるため、取得不可は null として返します。
 */
class MySqlUsageRepository implements MySqlUsageRepositoryInterface
{
    public function getDatabaseUsageBytes(): int
    {
        $connection = DB::connection();

        if ($connection->getDriverName() !== 'mysql') {
            return 0;
        }

        $databaseName = (string) $connection->getDatabaseName();
        $row = $connection->selectOne(
            'select coalesce(sum(data_length + index_length), 0) as bytes from information_schema.tables where table_schema = ?',
            [$databaseName],
        );

        return (int) ($row->bytes ?? 0);
    }

    public function getBinaryLogUsageBytes(): ?int
    {
        $connection = DB::connection();

        if ($connection->getDriverName() !== 'mysql') {
            return null;
        }

        try {
            $logs = $connection->select('SHOW BINARY LOGS');
        } catch (Throwable) {
            return null;
        }

        $totalBytes = 0;

        foreach ($logs as $log) {
            $values = (array) $log;
            $fileSize = $values['File_size'] ?? $values['file_size'] ?? null;

            if (! is_numeric($fileSize)) {
                return null;
            }

            $totalBytes += (int) $fileSize;
        }

        return $totalBytes;
    }
}
