<?php

namespace App\Responders\LumiLab;

use App\DTO\LumiLab\LumiLabProjectMockItemDTO;
use App\DTO\LumiLab\LumiLabProjectMockListDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * LumiLab 案件一覧 MOCK の Inertia props を整えます。
 */
final readonly class LumiLabProjectMockResponder
{
    public function index(LumiLabProjectMockListDTO $projectList): Response
    {
        return Inertia::render('Lab/LumiLabProjectMock', [
            'projectList' => [
                'items' => array_map(
                    fn (LumiLabProjectMockItemDTO $project): array => [
                        ...$project->toArray(),
                        'registeredDate' => str_replace('-', '/', $project->registeredDate),
                    ],
                    $projectList->items,
                ),
            ],
        ]);
    }
}
