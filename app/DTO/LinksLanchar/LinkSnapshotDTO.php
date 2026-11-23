<?php

namespace App\DTO\LinksLanchar;

use DateTimeImmutable;

/**
 * 保存値と、取得時点で利用可能な行き先を保持します。
 */
final readonly class LinkSnapshotDTO
{
    public function __construct(
        public string $linkKey,
        public ?string $title,
        public ?string $description,
        public ?string $selectionImageReference,
        public ?string $selectionImagePosterReference,
        public ?string $sphereColor,
        public ?string $iconImageReference,
        public ?string $lucideIconName,
        public ?string $backgroundColor,
        public ?string $backgroundImageReference,
        public ?string $backgroundImagePosterReference,
        public ?string $backgroundImageEntranceAnimationName,
        public ?string $backgroundEffectName,
        public ?string $destinationLinksLancharKey,
        public ?string $destinationPageUrl,
        public DateTimeImmutable $updatedAt,
    ) {}
}
