<?php

namespace App\Responders\LinksLanchar;

use App\DTO\LinksLanchar\LinkDTO;
use App\DTO\LinksLanchar\LinkSnapshotDTO;
use DateTimeZone;

/**
 * @phpstan-import-type LinkDisplayValues from LinkDTO
 */
final class LinkDisplayResolver
{
    private const SPHERE_PALETTE = [
        '#22d3ee', '#14b8a6', '#f472b6', '#60a5fa', '#facc15', '#4ade80', '#a78bfa', '#fb923c',
    ];

    private const DEFAULT_BACKGROUND = '#0e1b2b';

    /**
     * 指定済みの球体色と同じ一覧での重複を避け、候補が尽きた場合だけ再利用します。
     *
     * @param  list<LinkSnapshotDTO>  $links
     * @return array<string, string>
     */
    public function assignSphereColors(array $links): array
    {
        $colors = [];
        $sphereLinks = [];
        foreach ($links as $link) {
            if ($this->imageSource($link->selectionImageReference) !== null) {
                continue;
            }

            $sphereLinks[] = $link;
            $configuredColor = $this->hexColor($link->sphereColor);
            if ($configuredColor !== null) {
                $colors[$link->linkKey] = $configuredColor;
            }
        }

        $availableColors = array_values(array_diff(self::SPHERE_PALETTE, array_map('strtolower', $colors)));
        shuffle($availableColors);

        foreach ($sphereLinks as $link) {
            $colors[$link->linkKey] ??= array_pop($availableColors)
                ?? self::SPHERE_PALETTE[array_rand(self::SPHERE_PALETTE)];
        }

        return $colors;
    }

    /**
     * @return LinkDisplayValues
     */
    public function resolve(LinkSnapshotDTO $link, ?string $sphereColor): array
    {
        $selectionImage = $this->imageSource($link->selectionImageReference);
        $backgroundImage = $this->imageSource($link->backgroundImageReference);
        $iconImage = $selectionImage === null ? $this->imageSource($link->iconImageReference) : null;
        $lucideIconName = $selectionImage === null && $iconImage === null
            ? ($this->optionalText($link->lucideIconName) ?? 'Link')
            : null;

        return [
            'title' => $this->optionalText($link->title)
                ?? 'NO_NAME：'.$link->updatedAt->setTimezone(new DateTimeZone('Asia/Tokyo'))->format('Y-m-d H:i'),
            'description' => $this->optionalText($link->description),
            'selectionDisplayType' => $selectionImage !== null ? 'image' : 'sphere',
            'selectionImageSource' => $selectionImage,
            'selectionImagePosterSource' => $selectionImage === null ? null : $this->imageSource($link->selectionImagePosterReference),
            'sphereColor' => $sphereColor,
            'sphereShadowColor' => $sphereColor === null ? null : $this->sphereShadow($sphereColor),
            'iconImageSource' => $iconImage,
            'lucideIconName' => $lucideIconName,
            'backgroundColor' => $this->hexColor($link->backgroundColor) ?? self::DEFAULT_BACKGROUND,
            'backgroundImageSource' => $backgroundImage,
            'backgroundImagePosterSource' => $backgroundImage === null ? null : $this->imageSource($link->backgroundImagePosterReference),
            'backgroundImageEntranceAnimationName' => $backgroundImage === null
                ? null
                : ($this->optionalText($link->backgroundImageEntranceAnimationName) ?? 'fade-in'),
            'backgroundEffectName' => $this->optionalText($link->backgroundEffectName),
            ...$this->resolvePanelColors($sphereColor ?? $this->hexColor($link->sphereColor)),
        ];
    }

    private function optionalText(?string $value): ?string
    {
        return $value === null || trim($value) === '' ? null : $value;
    }

    private function imageSource(?string $path): ?string
    {
        // 初版の画像はアプリに同梱するため、公開ルートからの同一オリジンのパスを扱う。
        if ($path === null || ! str_starts_with($path, '/') || str_starts_with($path, '//')) {
            return null;
        }

        return preg_match('/[\x00-\x20\x7f]/', $path) || str_contains($path, '\\') ? null : $path;
    }

    private function hexColor(?string $color): ?string
    {
        return $color !== null && preg_match('/^#[0-9a-f]{6}$/iD', $color) ? $color : null;
    }

    private function sphereShadow(string $color): string
    {
        return sprintf(
            'rgba(%d, %d, %d, 0.38)',
            hexdec(substr($color, 1, 2)),
            hexdec(substr($color, 3, 2)),
            hexdec(substr($color, 5, 2)),
        );
    }

    /**
     * 説明欄の暗い下地を前提に、球体色から明るいアクセントを作ります。
     *
     * @return array{accentColor: string, textColor: string}
     */
    private function resolvePanelColors(?string $color): array
    {
        $channels = str_split(substr($color ?? '#22d3ee', 1), 2);
        $accent = array_map(static fn (string $channel): int => (int) round(hexdec($channel) * 0.55 + 255 * 0.45), $channels);

        return [
            'accentColor' => sprintf('#%02x%02x%02x', ...$accent),
            'textColor' => '#f8fafc',
        ];
    }
}
