<?php

namespace App\Repositories\ApiCatalog;

interface ApisGuruRepositoryInterface
{
    /**
     * Fetch the APIs.guru API catalog list.
     *
     * @return array<string, mixed>
     */
    public function fetchList(): array;
}
