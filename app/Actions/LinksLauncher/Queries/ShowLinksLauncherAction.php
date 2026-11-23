<?php

namespace App\Actions\LinksLauncher\Queries;

use App\DTO\LinksLauncher\LinksLauncherReadStatus;
use App\DTO\LinksLauncher\ShowLinksLauncherInputDTO;
use App\DTO\LinksLauncher\ShowLinksLauncherResultDTO;
use App\Repositories\LinksLauncher\LinksLauncherRepositoryInterface;

final readonly class ShowLinksLauncherAction
{
    public function __construct(private LinksLauncherRepositoryInterface $repository) {}

    public function execute(ShowLinksLauncherInputDTO $input): ShowLinksLauncherResultDTO
    {
        $launcher = $this->repository->find($input->linksLauncherKey);
        if ($launcher === null) {
            return new ShowLinksLauncherResultDTO(LinksLauncherReadStatus::Missing);
        }

        if ($launcher->deleted) {
            return new ShowLinksLauncherResultDTO(LinksLauncherReadStatus::Unpublished);
        }

        $links = $this->repository->findVisibleLinks($launcher->linksLauncherKey);
        $selectedLinkKey = $links[0]->linkKey ?? null;
        foreach ($links as $link) {
            if ($input->selectedLinkKey !== null && strcasecmp($link->linkKey, $input->selectedLinkKey) === 0) {
                $selectedLinkKey = $link->linkKey;

                break;
            }
        }

        return new ShowLinksLauncherResultDTO(LinksLauncherReadStatus::Available, $launcher, $links, $selectedLinkKey);
    }
}
