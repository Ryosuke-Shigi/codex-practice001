<?php

namespace App\Repositories\LinksLanchar;

use App\DTO\LinksLanchar\LinksLancharSnapshotDTO;
use App\DTO\LinksLanchar\LinkSnapshotDTO;
use App\Models\Link;
use App\Models\LinksLanchar;

final class LinksLancharRepository implements LinksLancharRepositoryInterface
{
    public function find(string $linksLancharKey): ?LinksLancharSnapshotDTO
    {
        $launcher = LinksLanchar::withTrashed()
            ->where('links_lanchar_key', $linksLancharKey)
            ->first();

        return $launcher === null ? null : new LinksLancharSnapshotDTO(
            linksLancharKey: $launcher->links_lanchar_key,
            title: $launcher->title,
            description: $launcher->description,
            deleted: $launcher->trashed(),
        );
    }

    public function findVisibleLinks(string $linksLancharKey): array
    {
        return Link::query()
            ->where('owner_links_lanchar_key', $linksLancharKey)
            ->where('is_visible', true)
            ->with(['destinationLinksLanchar:links_lanchar_key', 'destinationPage:id,url'])
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
                destinationLinksLancharKey: $link->destinationLinksLanchar?->links_lanchar_key,
                destinationPageUrl: $link->destinationPage?->url,
                updatedAt: $link->updated_at->toDateTimeImmutable(),
            ))
            ->all();
    }
}
