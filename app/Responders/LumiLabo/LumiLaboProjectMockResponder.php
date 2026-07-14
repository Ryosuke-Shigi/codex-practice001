<?php

namespace App\Responders\LumiLabo;

use App\DTO\LumiLabo\LumiLaboProjectMockItemDTO;
use App\DTO\LumiLabo\LumiLaboProjectMockListDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * LumiLabo 案件一覧 MOCK の Inertia props を整えます。
 */
final readonly class LumiLaboProjectMockResponder
{
    public function index(LumiLaboProjectMockListDTO $projectList): Response
    {
        return Inertia::render('Lab/LumiLaboProjectMock', [
            'projectList' => [
                'items' => array_map(
                    fn (LumiLaboProjectMockItemDTO $project): array => [
                        ...$project->toArray(),
                        'registeredDate' => str_replace('-', '/', $project->registeredDate),
                    ],
                    $projectList->items,
                ),
            ],
        ]);
    }
}
