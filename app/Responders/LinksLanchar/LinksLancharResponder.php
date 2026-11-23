<?php

namespace App\Responders\LinksLanchar;

use App\DTO\LinksLanchar\LinkDTO;
use App\DTO\LinksLanchar\LinkListDTO;
use App\DTO\LinksLanchar\LinksLancharReadStatus;
use App\DTO\LinksLanchar\ShowLinksLancharResultDTO;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

final readonly class LinksLancharResponder
{
    public function __construct(
        private LinkDisplayResolver $display,
        private LinkDestinationUrlSelector $destinationUrls,
        private string $topUrl,
    ) {}

    public function __invoke(Request $request, ShowLinksLancharResultDTO $result): Response
    {
        if ($result->status === LinksLancharReadStatus::Unpublished) {
            return Inertia::render('LinksLanchar/Unavailable')
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_NOT_FOUND);
        }

        $launcher = $result->linksLanchar;
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

        return Inertia::render('LinksLanchar/Show', [
            'linksLanchar' => [
                'linksLancharKey' => $launcher->linksLancharKey,
                'title' => $launcher->title,
                'description' => $launcher->description,
            ],
            'selectedLinkKey' => $result->selectedLinkKey,
            'linkList' => (new LinkListDTO($links))->toArray(),
            'navigation' => ['topUrl' => $this->topUrl],
        ])->toResponse($request);
    }
}
