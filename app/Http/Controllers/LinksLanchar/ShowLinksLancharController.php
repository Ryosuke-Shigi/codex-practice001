<?php

namespace App\Http\Controllers\LinksLanchar;

use App\Actions\LinksLanchar\Queries\ShowLinksLancharAction;
use App\DTO\LinksLanchar\ShowLinksLancharInputDTO;
use App\Http\Controllers\Controller;
use App\Responders\LinksLanchar\LinksLancharResponder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class ShowLinksLancharController extends Controller
{
    public function __invoke(
        Request $request,
        string $linksLancharKey,
        ShowLinksLancharAction $action,
        LinksLancharResponder $responder,
    ): Response {
        $selectedLinkKey = $request->query('selectedLinkKey');
        $input = new ShowLinksLancharInputDTO(
            $linksLancharKey,
            is_string($selectedLinkKey) && Str::isUuid($selectedLinkKey) ? $selectedLinkKey : null,
        );

        return $responder($request, $action->execute($input));
    }
}
