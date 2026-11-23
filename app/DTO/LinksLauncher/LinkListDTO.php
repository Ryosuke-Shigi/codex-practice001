<?php

namespace App\DTO\LinksLauncher;

/**
 * @phpstan-import-type LinkProps from LinkDTO
 */
final readonly class LinkListDTO
{
    /**
     * @param  list<LinkDTO>  $links
     */
    public function __construct(public array $links) {}

    /**
     * @return array{links: list<LinkProps>}
     */
    public function toArray(): array
    {
        return [
            'links' => array_map(static fn (LinkDTO $link): array => $link->toArray(), $this->links),
        ];
    }
}
