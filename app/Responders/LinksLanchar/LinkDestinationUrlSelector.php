<?php

namespace App\Responders\LinksLanchar;

use App\DTO\LinksLanchar\LinkSnapshotDTO;

final readonly class LinkDestinationUrlSelector
{
    public function __construct(
        private LinkDestinationUrlResolver $linksLancharResolver,
        private LinkDestinationUrlResolver $pageResolver,
    ) {}

    public function resolve(LinkSnapshotDTO $link): ?string
    {
        return match (true) {
            $link->destinationLinksLancharKey !== null => $this->linksLancharResolver->resolve($link->destinationLinksLancharKey),
            $link->destinationPageUrl !== null => $this->pageResolver->resolve($link->destinationPageUrl),
            default => null,
        };
    }
}
