<?php

namespace App\DTO\LinksLauncher;

final readonly class ShowLinksLauncherInputDTO
{
    public function __construct(
        public string $linksLauncherKey,
        public ?string $selectedLinkKey,
    ) {}
}
