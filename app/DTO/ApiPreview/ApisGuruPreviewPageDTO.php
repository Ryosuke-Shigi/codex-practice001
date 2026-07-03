<?php

namespace App\DTO\ApiPreview;

final readonly class ApisGuruPreviewPageDTO
{
    public function __construct(
        public string $apiName,
        public string $endpoint,
        public string $method,
        public bool $canFetch,
        public bool $hasFetched,
        public ?ApiPreviewResultDTO $result,
    ) {}
}
