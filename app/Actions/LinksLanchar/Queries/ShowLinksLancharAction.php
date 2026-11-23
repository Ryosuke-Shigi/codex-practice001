<?php

namespace App\Actions\LinksLanchar\Queries;

use App\DTO\LinksLanchar\LinksLancharReadStatus;
use App\DTO\LinksLanchar\ShowLinksLancharInputDTO;
use App\DTO\LinksLanchar\ShowLinksLancharResultDTO;
use App\Repositories\LinksLanchar\LinksLancharRepositoryInterface;

final readonly class ShowLinksLancharAction
{
    public function __construct(private LinksLancharRepositoryInterface $repository) {}

    public function execute(ShowLinksLancharInputDTO $input): ShowLinksLancharResultDTO
    {
        $launcher = $this->repository->find($input->linksLancharKey);
        if ($launcher === null) {
            return new ShowLinksLancharResultDTO(LinksLancharReadStatus::Missing);
        }

        if ($launcher->deleted) {
            return new ShowLinksLancharResultDTO(LinksLancharReadStatus::Unpublished);
        }

        $links = $this->repository->findVisibleLinks($launcher->linksLancharKey);
        $selectedLinkKey = $links[0]->linkKey ?? null;
        foreach ($links as $link) {
            if ($input->selectedLinkKey !== null && strcasecmp($link->linkKey, $input->selectedLinkKey) === 0) {
                $selectedLinkKey = $link->linkKey;

                break;
            }
        }

        return new ShowLinksLancharResultDTO(LinksLancharReadStatus::Available, $launcher, $links, $selectedLinkKey);
    }
}
