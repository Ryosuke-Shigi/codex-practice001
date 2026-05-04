<?php

namespace App\Jobs\ApiCatalog;

use App\Actions\ApiCatalog\Commands\SyncApiCatalogAction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncApiCatalogJob implements ShouldQueue
{
    use Queueable;

    public function handle(SyncApiCatalogAction $action): void
    {
        $action->execute();
    }
}
