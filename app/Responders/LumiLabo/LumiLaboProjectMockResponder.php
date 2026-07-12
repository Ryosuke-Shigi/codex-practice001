<?php

namespace App\Responders\LumiLabo;

use Inertia\Inertia;
use Inertia\Response;

/**
 * LumiLabo 案件一覧 MOCK の Inertia props を整えます。
 */
final readonly class LumiLaboProjectMockResponder
{
    /**
     * @param  array{
     *     items: array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string}>,
     *     keyword: string,
     *     sort: string,
     *     viewport: string,
     *     currentPage: int,
     *     hasPrevious: bool,
     *     previousPage: ?int,
     *     hasNext: bool,
     *     nextPage: ?int,
     *     showPagination: bool
     * }  $projectList
     */
    public function index(array $projectList): Response
    {
        return Inertia::render('Lab/LumiLaboProjectMock', [
            'projectList' => [
                ...$projectList,
                'items' => array_map(
                    fn (array $project): array => [
                        ...$project,
                        'registeredDate' => str_replace('-', '/', $project['registeredDate']),
                    ],
                    $projectList['items'],
                ),
                'action' => route('lab.lumilabo-project-mock'),
            ],
        ]);
    }
}
