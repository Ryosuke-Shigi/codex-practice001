<?php

namespace App\Http\Controllers;

use App\Actions\ApiCatalog\Commands\DeleteApiCatalogNoteAction;
use App\Actions\ApiCatalog\Commands\StoreApiCatalogNoteAction;
use App\Actions\ApiCatalog\Commands\UpdateApiCatalogNoteAction;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteCreateDTO;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteUpdateDTO;
use App\Http\Requests\ApiCatalog\StoreApiCatalogNoteRequest;
use App\Http\Requests\ApiCatalog\UpdateApiCatalogNoteRequest;
use Illuminate\Http\RedirectResponse;

class ApiCatalogNoteController extends Controller
{
    public function store(
        StoreApiCatalogNoteRequest $request,
        string $apiKey,
        StoreApiCatalogNoteAction $action,
    ): RedirectResponse {
        /*
         * Controller はHTTP入力をDTOへ詰めてActionへ渡すだけにします。
         * api_key は詳細画面と同じくURL decodeしてからユースケース層へ渡します。
         */
        $note = $action->execute(
            rawurldecode($apiKey),
            ApiCatalogNoteCreateDTO::fromArray($request->validated()),
        );

        if ($note === null) {
            abort(404);
        }

        return back();
    }

    public function update(
        UpdateApiCatalogNoteRequest $request,
        string $apiKey,
        int $note,
        UpdateApiCatalogNoteAction $action,
    ): RedirectResponse {
        $updatedNote = $action->execute(
            rawurldecode($apiKey),
            $note,
            ApiCatalogNoteUpdateDTO::fromArray($request->validated()),
        );

        if ($updatedNote === null) {
            abort(404);
        }

        return back();
    }

    public function destroy(
        string $apiKey,
        int $note,
        DeleteApiCatalogNoteAction $action,
    ): RedirectResponse {
        if (! $action->execute(rawurldecode($apiKey), $note)) {
            abort(404);
        }

        return back();
    }
}
