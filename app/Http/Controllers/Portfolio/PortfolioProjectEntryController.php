<?php

namespace App\Http\Controllers\Portfolio;

use App\Actions\LinksLanchar\Queries\ShowLinksLancharAction;
use App\DTO\LinksLanchar\ShowLinksLancharInputDTO;
use App\Http\Controllers\Controller;
use App\Responders\LinksLanchar\LinksLancharResponder;
use App\Support\Portfolio\PortfolioLinksLancharDefinition;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class PortfolioProjectEntryController extends Controller
{
    public function __invoke(
        Request $request,
        ShowLinksLancharAction $action,
        LinksLancharResponder $responder,
    ): Response {
        $selectedLinkKey = $request->query('selectedLinkKey');
        $projectId = $request->query('project');

        // 選択UUIDの指定がないURLに限り、既存の作品IDを変換する。
        if ($selectedLinkKey === null && is_string($projectId)) {
            $selectedLinkKey = PortfolioLinksLancharDefinition::linkKeyForProject($projectId);
        }

        $input = new ShowLinksLancharInputDTO(
            PortfolioLinksLancharDefinition::LINKS_LANCHAR_KEY,
            is_string($selectedLinkKey) && Str::isUuid($selectedLinkKey) ? $selectedLinkKey : null,
        );

        return $responder($request, $action->execute($input));
    }
}
