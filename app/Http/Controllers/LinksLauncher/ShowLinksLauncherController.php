<?php

namespace App\Http\Controllers\LinksLauncher;

use App\Actions\LinksLauncher\Queries\ShowLinksLauncherAction;
use App\DTO\LinksLauncher\ShowLinksLauncherInputDTO;
use App\Http\Controllers\Controller;
use App\Responders\LinksLauncher\LinksLauncherResponder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class ShowLinksLauncherController extends Controller
{
    public function __invoke(
        Request $request,
        string $linksLauncherKey,
        ShowLinksLauncherAction $action,
        LinksLauncherResponder $responder,
    ): Response {
        $selectedLinkKey = $request->query('selectedLinkKey');
        $input = new ShowLinksLauncherInputDTO(
            $linksLauncherKey,
            is_string($selectedLinkKey) && Str::isUuid($selectedLinkKey) ? $selectedLinkKey : null,
        );

        return $responder($request, $action->execute($input));
    }
}
