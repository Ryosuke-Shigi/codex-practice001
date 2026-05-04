<?php

namespace App\Console\Commands;

use App\Actions\ApiCatalog\Commands\SyncApiCatalogAction;
use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use Illuminate\Console\Command;

class SyncApiCatalogCommand extends Command
{
    protected $signature = 'api-catalog:sync {--queue : Dispatch the API catalog sync job to the queue.}';

    protected $description = 'Sync the API catalog cache from APIs.guru list.json.';

    public function handle(SyncApiCatalogAction $action): int
    {
        if ($this->option('queue')) {
            SyncApiCatalogJob::dispatch();

            $this->info('API catalog sync job dispatched.');

            return self::SUCCESS;
        }

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
