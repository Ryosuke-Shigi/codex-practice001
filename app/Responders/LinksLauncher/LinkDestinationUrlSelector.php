<?php

namespace App\Responders\LinksLauncher;

use App\DTO\LinksLauncher\LinkSnapshotDTO;

final readonly class LinkDestinationUrlSelector
{
    public function __construct(
        private LinkDestinationUrlResolver $linksLauncherResolver,
        private LinkDestinationUrlResolver $pageResolver,
    ) {}

    public function resolve(LinkSnapshotDTO $link): ?string
    {
        return match (true) {
            $link->destinationLinksLauncherKey !== null => $this->linksLauncherResolver->resolve($link->destinationLinksLauncherKey),
            $link->destinationPageUrl !== null => $this->pageResolver->resolve($link->destinationPageUrl),
            default => null,
        };
    }
}
