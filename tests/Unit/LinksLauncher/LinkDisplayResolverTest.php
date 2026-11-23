<?php

namespace Tests\Unit\LinksLauncher;

use App\DTO\LinksLauncher\LinkSnapshotDTO;
use App\Responders\LinksLauncher\LinkDisplayResolver;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class LinkDisplayResolverTest extends TestCase
{
    public function test_unconfigured_spheres_get_distinct_colors_without_using_configured_sphere_colors(): void
    {
        $links = [
            $this->link('unset-first'),
            $this->link('image', '#60a5fa', '/images/selection.gif'),
            $this->link('configured-green', '#4ADE80'),
            $this->link('blank', ''),
            $this->link('configured-pink', '#f472b6'),
            $this->link('unset-last'),
        ];

        $colors = (new LinkDisplayResolver)->assignSphereColors($links);

        $this->assertCount(5, $colors);
        $this->assertArrayNotHasKey('image', $colors);
        $this->assertSame('#4ADE80', $colors['configured-green']);
        $this->assertSame('#f472b6', $colors['configured-pink']);

        // 候補色の具体的な割り当て順ではなく、一覧内の重複回避を検証する。
        $assigned = array_map('strtolower', [
            $colors['unset-first'],
            $colors['blank'],
            $colors['unset-last'],
        ]);
        $this->assertCount(3, array_unique($assigned));
        $this->assertNotContains('#4ade80', $assigned);
        $this->assertNotContains('#f472b6', $assigned);
    }

    public function test_every_sphere_still_gets_a_color_when_the_palette_is_exhausted(): void
    {
        $links = array_map(fn (int $index): LinkSnapshotDTO => $this->link('sphere-'.$index), range(1, 12));

        $colors = (new LinkDisplayResolver)->assignSphereColors($links);

        $this->assertEqualsCanonicalizing(array_map(fn (LinkSnapshotDTO $link): string => $link->linkKey, $links), array_keys($colors));
        foreach ($colors as $color) {
            $this->assertMatchesRegularExpression('/\A#[0-9a-f]{6}\z/i', $color);
        }
    }

    private function link(string $key, ?string $sphereColor = null, ?string $selectionImage = null): LinkSnapshotDTO
    {
        return new LinkSnapshotDTO(
            linkKey: $key,
            title: null,
            description: null,
            selectionImageReference: $selectionImage,
            selectionImagePosterReference: null,
            sphereColor: $sphereColor,
            iconImageReference: null,
            lucideIconName: null,
            backgroundColor: null,
            backgroundImageReference: null,
            backgroundImagePosterReference: null,
            backgroundImageEntranceAnimationName: null,
            backgroundEffectName: null,
            destinationLinksLauncherKey: null,
            destinationPageUrl: null,
            updatedAt: new DateTimeImmutable('2026-11-23T00:15:00+09:00'),
        );
    }
}
