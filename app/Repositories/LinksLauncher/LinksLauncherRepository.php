<?php

namespace App\Repositories\LinksLauncher;

use App\DTO\LinksLauncher\LinksLauncherSnapshotDTO;
use App\DTO\LinksLauncher\LinkSnapshotDTO;
use App\Models\Link;
use App\Models\LinksLauncher;

final class LinksLauncherRepository implements LinksLauncherRepositoryInterface
{
    public function find(string $linksLauncherKey): ?LinksLauncherSnapshotDTO
    {
        $launcher = LinksLauncher::withTrashed()
            ->where('links_launcher_key', $linksLauncherKey)
            ->first();

        return $launcher === null ? null : new LinksLauncherSnapshotDTO(
            linksLauncherKey: $launcher->links_launcher_key,
            title: $launcher->title,
            description: $launcher->description,
            deleted: $launcher->trashed(),
        );
    }

    public function findVisibleLinks(string $linksLauncherKey): array
    {
        return Link::query()
            ->where('owner_links_launcher_key', $linksLauncherKey)
            ->where('is_visible', true)
            ->with(['destinationLinksLauncher:links_launcher_key', 'destinationPage:id,url'])
            // SQLiteとMySQLで未指定の優先度を末尾にそろえる。
            ->orderByRaw('CASE WHEN priority IS NULL THEN 1 ELSE 0 END')
            ->orderBy('priority')
            ->orderByDesc('updated_at')
            ->get()
            ->map(static fn (Link $link): LinkSnapshotDTO => new LinkSnapshotDTO(
                linkKey: $link->link_key,
                title: $link->title,
                description: $link->description,
                selectionImageReference: $link->selection_image_reference,
                selectionImagePosterReference: $link->selection_image_poster_reference,
                sphereColor: $link->sphere_color,
                iconImageReference: $link->icon_image_reference,
                lucideIconName: $link->lucide_icon_name,
                backgroundColor: $link->background_color,
                backgroundImageReference: $link->background_image_reference,
                backgroundImagePosterReference: $link->background_image_poster_reference,
                backgroundImageEntranceAnimationName: $link->background_image_entrance_animation_name,
                backgroundEffectName: $link->background_effect_name,
                destinationLinksLauncherKey: $link->destinationLinksLauncher?->links_launcher_key,
                destinationPageUrl: $link->destinationPage?->url,
                updatedAt: $link->updated_at->toDateTimeImmutable(),
            ))
            ->all();
    }
}
