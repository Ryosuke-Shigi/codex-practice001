<?php

namespace App\DTO\LinksLanchar;

final readonly class ShowLinksLancharInputDTO
{
    public function __construct(
        public string $linksLancharKey,
        public ?string $selectedLinkKey,
    ) {}
}
