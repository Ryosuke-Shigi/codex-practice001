<?php

namespace App\DTO\LinksLanchar;

final readonly class LinksLancharSnapshotDTO
{
    public function __construct(
        public string $linksLancharKey,
        public ?string $title,
        public ?string $description,
        public bool $deleted,
    ) {}
}
