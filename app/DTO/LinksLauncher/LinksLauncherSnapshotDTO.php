<?php

namespace App\DTO\LinksLauncher;

final readonly class LinksLauncherSnapshotDTO
{
    public function __construct(
        public string $linksLauncherKey,
        public ?string $title,
        public ?string $description,
        public bool $deleted,
    ) {}
}
