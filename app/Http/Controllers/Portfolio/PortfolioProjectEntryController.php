<?php

namespace App\Http\Controllers\Portfolio;

use App\Actions\LinksLauncher\Queries\ShowLinksLauncherAction;
use App\DTO\LinksLauncher\ShowLinksLauncherInputDTO;
use App\Http\Controllers\Controller;
use App\Responders\LinksLauncher\LinksLauncherResponder;
use App\Support\Portfolio\PortfolioLinksLauncherDefinition;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class PortfolioProjectEntryController extends Controller
{
    public function __invoke(
        Request $request,
        ShowLinksLauncherAction $action,
        LinksLauncherResponder $responder,
    ): Response {
        $selectedLinkKey = $request->query('selectedLinkKey');
        $projectId = $request->query('project');

        // 選択UUIDの指定がないURLに限り、既存の作品IDを変換する。
        if ($selectedLinkKey === null && is_string($projectId)) {
            $selectedLinkKey = PortfolioLinksLauncherDefinition::linkKeyForProject($projectId);
        }

        $input = new ShowLinksLauncherInputDTO(
            PortfolioLinksLauncherDefinition::LINKS_LAUNCHER_KEY,
            is_string($selectedLinkKey) && Str::isUuid($selectedLinkKey) ? $selectedLinkKey : null,
        );

        return $responder($request, $action->execute($input));
    }
}
