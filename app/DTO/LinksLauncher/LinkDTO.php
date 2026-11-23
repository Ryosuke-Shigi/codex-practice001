<?php

namespace App\DTO\LinksLauncher;

/**
 * @phpstan-type LinkDisplayValues array{
 *     title: string,
 *     description: ?string,
 *     selectionDisplayType: 'image'|'sphere',
 *     selectionImageSource: ?string,
 *     selectionImagePosterSource: ?string,
 *     sphereColor: ?string,
 *     sphereShadowColor: ?string,
 *     iconImageSource: ?string,
 *     lucideIconName: ?string,
 *     backgroundColor: string,
 *     backgroundImageSource: ?string,
 *     backgroundImagePosterSource: ?string,
 *     backgroundImageEntranceAnimationName: ?string,
 *     backgroundEffectName: ?string,
 *     accentColor: string,
 *     textColor: string
 * }
 * @phpstan-type LinkProps array{linkKey: string, destinationUrl: ?string, displayValues: LinkDisplayValues}
 */
final readonly class LinkDTO
{
    /**
     * @param  LinkDisplayValues  $displayValues
     */
    public function __construct(
        public string $linkKey,
        public ?string $destinationUrl,
        public array $displayValues,
    ) {}

    /**
     * @return LinkProps
     */
    public function toArray(): array
    {
        return [
            'linkKey' => $this->linkKey,
            'destinationUrl' => $this->destinationUrl,
            'displayValues' => $this->displayValues,
        ];
    }
}
