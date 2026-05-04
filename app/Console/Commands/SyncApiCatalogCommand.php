<?php

namespace App\Console\Commands;

use App\Actions\ApiCatalog\Commands\SyncApiCatalogAction;
use Illuminate\Console\Command;

class SyncApiCatalogCommand extends Command
{
    protected $signature = 'api-catalog:sync';

    protected $description = 'Sync the API catalog cache from APIs.guru list.json.';

    public function handle(SyncApiCatalogAction $action): int
    {
        $result = $action->execute();

        $this->info('API catalog sync completed.');
        $this->table(
            ['total', 'inserted', 'updated', 'skipped', 'inactive', 'failed'],
            [[
                $result->totalCount,
                $result->insertedCount,
                $result->updatedCount,
                $result->skippedCount,
                $result->inactiveCount,
                $result->failedCount,
            ]],
        );

        return self::SUCCESS;
    }
}
