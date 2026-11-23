<?php

namespace App\Responders\LinksLauncher;

use App\DTO\LinksLauncher\LinkDTO;
use App\DTO\LinksLauncher\LinkListDTO;
use App\DTO\LinksLauncher\LinksLauncherReadStatus;
use App\DTO\LinksLauncher\ShowLinksLauncherResultDTO;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

final readonly class LinksLauncherResponder
{
    public function __construct(
        private LinkDisplayResolver $display,
        private LinkDestinationUrlSelector $destinationUrls,
        private string $topUrl,
    ) {}

    public function __invoke(Request $request, ShowLinksLauncherResultDTO $result): Response
    {
        if ($result->status === LinksLauncherReadStatus::Unpublished) {
            return Inertia::render('LinksLauncher/Unavailable')
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_NOT_FOUND);
        }

        $launcher = $result->linksLauncher;
        abort_if($launcher === null, Response::HTTP_NOT_FOUND);

        $sphereColors = $this->display->assignSphereColors($result->links);
        $links = [];
        foreach ($result->links as $link) {
            $links[] = new LinkDTO(
                linkKey: $link->linkKey,
                destinationUrl: $this->destinationUrls->resolve($link),
                displayValues: $this->display->resolve($link, $sphereColors[$link->linkKey] ?? null),
            );
        }

        return Inertia::render('LinksLauncher/Show', [
            'linksLauncher' => [
                'linksLauncherKey' => $launcher->linksLauncherKey,
                'title' => $launcher->title,
                'description' => $launcher->description,
            ],
            'selectedLinkKey' => $result->selectedLinkKey,
            'linkList' => (new LinkListDTO($links))->toArray(),
            'navigation' => ['topUrl' => $this->topUrl],
        ])->toResponse($request);
    }
}
