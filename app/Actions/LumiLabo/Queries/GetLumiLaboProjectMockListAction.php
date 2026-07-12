<?php

namespace App\Actions\LumiLabo\Queries;

/**
 * LumiLabo 案件一覧 MOCK の固定データを検索、登録日順、ページ単位へ整えます。
 *
 * DB、外部 API、本番 CRUD には接続しません。
 */
final readonly class GetLumiLaboProjectMockListAction
{
    /**
     * 固定定義順は同じ登録日の安定した並び順だけに使い、React props へは公開しません。
     *
     * @var array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string}>
     */
    private const PROJECTS = [
        [
            'id' => 'mock-project-001',
            'companyName' => 'ルミラボ工務店',
            'contactName' => '山田 太郎',
            'address' => '大阪府岸和田市上町 1-2-3',
            'memo' => '初回訪問予定。現場確認後に写真と資料を追加する。',
            'registeredDate' => '2026-07-07',
        ],
        [
            'id' => 'mock-project-002',
            'companyName' => '南海リフォーム',
            'contactName' => '田中 花子',
            'address' => '大阪府堺市堺区南島町 2-8-4',
            'memo' => '外壁点検の見積もり確認。',
            'registeredDate' => '2026-07-12',
        ],
        [
            'id' => 'mock-project-003',
            'companyName' => '光建設株式会社',
            'contactName' => '佐藤 恒一',
            'address' => '大阪府大阪市住之江区北加賀屋 4-1-9',
            'memo' => '初回ヒアリングの日程を調整中。',
            'registeredDate' => '2026-07-12',
        ],
        [
            'id' => 'mock-project-004',
            'companyName' => '岸和田設備',
            'contactName' => '西村 亮',
            'address' => '大阪府貝塚市近木町 8-12',
            'memo' => '給排水設備の更新相談。',
            'registeredDate' => '2026-07-11',
        ],
        [
            'id' => 'mock-project-005',
            'companyName' => '大阪住設メンテナンス',
            'contactName' => '高橋 美咲',
            'address' => '大阪府大阪市平野区長吉長原 3-6-2',
            'memo' => '岸和田エリアの初回現地確認。',
            'registeredDate' => '2026-07-10',
        ],
        [
            'id' => 'mock-project-006',
            'companyName' => '泉州ホーム',
            'contactName' => '松本 健',
            'address' => '大阪府泉佐野市市場西 1-14-7',
            'memo' => '屋根補修の写真を受領済み。',
            'registeredDate' => '2026-07-10',
        ],
        [
            'id' => 'mock-project-007',
            'companyName' => 'なにわ建装',
            'contactName' => '森田 恒一',
            'address' => '大阪府大阪市西成区玉出中 2-3-10',
            'memo' => '初回の打ち合わせ後に材料を選定する。',
            'registeredDate' => '2026-07-09',
        ],
        [
            'id' => 'mock-project-008',
            'companyName' => '北摂住まい工房',
            'contactName' => '井上 由佳',
            'address' => '大阪府吹田市江坂町 1-21-5',
            'memo' => '浴室改修の概算見積もり。',
            'registeredDate' => '2026-07-09',
        ],
        [
            'id' => 'mock-project-009',
            'companyName' => '和泉空調サービス',
            'contactName' => '中川 拓也',
            'address' => '大阪府和泉市府中町 5-4-16',
            'memo' => '空調入替の現地調査を予定。',
            'registeredDate' => '2026-07-08',
        ],
        [
            'id' => 'mock-project-010',
            'companyName' => '堺まちづくり建設',
            'contactName' => '藤井 翔',
            'address' => '大阪府堺市北区中百舌鳥町 6-9-1',
            'memo' => '初回資料をメールで送付済み。',
            'registeredDate' => '2026-07-08',
        ],
        [
            'id' => 'mock-project-011',
            'companyName' => '河内リノベーション',
            'contactName' => '岡本 彩',
            'address' => '大阪府東大阪市長田西 3-2-11',
            'memo' => 'キッチン交換の要望を確認。',
            'registeredDate' => '2026-07-06',
        ],
        [
            'id' => 'mock-project-012',
            'companyName' => '阪南塗装店',
            'contactName' => '小林 直人',
            'address' => '大阪府阪南市尾崎町 4-7-3',
            'memo' => '外壁の色見本を準備する。',
            'registeredDate' => '2026-07-05',
        ],
        [
            'id' => 'mock-project-013',
            'companyName' => '淀川住宅設備',
            'contactName' => '吉田 恒一',
            'address' => '大阪府大阪市淀川区十三東 1-18-8',
            'memo' => '排水管洗浄の見積もり依頼。',
            'registeredDate' => '2026-07-04',
        ],
        [
            'id' => 'mock-project-014',
            'companyName' => '枚方クラフト',
            'contactName' => '石井 里奈',
            'address' => '大阪府枚方市岡東町 9-15',
            'memo' => '造作棚の寸法を再確認する。',
            'registeredDate' => '2026-07-03',
        ],
        [
            'id' => 'mock-project-015',
            'companyName' => '豊中住建',
            'contactName' => '前田 恒一',
            'address' => '大阪府豊中市本町 7-3-20',
            'memo' => '初回相談の内容を共有する。',
            'registeredDate' => '2026-07-02',
        ],
        [
            'id' => 'mock-project-016',
            'companyName' => '岸和田工房',
            'contactName' => '橋本 麻衣',
            'address' => '大阪府泉大津市旭町 2-19',
            'memo' => '造作家具の納期を確認中。',
            'registeredDate' => '2026-07-01',
        ],
        [
            'id' => 'mock-project-017',
            'companyName' => '天王寺リフォーム',
            'contactName' => '加藤 大輔',
            'address' => '大阪府大阪市天王寺区上本町 8-5-6',
            'memo' => '内装更新の概算を作成。',
            'registeredDate' => '2026-06-29',
        ],
        [
            'id' => 'mock-project-018',
            'companyName' => '泉北電設',
            'contactName' => '山本 舞',
            'address' => '大阪府堺市南区茶山台 1-6-14',
            'memo' => '照明器具の品番を確認する。',
            'registeredDate' => '2026-06-27',
        ],
        [
            'id' => 'mock-project-019',
            'companyName' => '阿倍野住設',
            'contactName' => '木村 和也',
            'address' => '大阪府大阪市阿倍野区昭和町 3-11-2',
            'memo' => '初回訪問は来週午前を希望。',
            'registeredDate' => '2026-06-24',
        ],
        [
            'id' => 'mock-project-020',
            'companyName' => '高槻木工',
            'contactName' => '清水 恒一',
            'address' => '大阪府高槻市芥川町 2-16-4',
            'memo' => '収納改修の図面を確認。',
            'registeredDate' => '2026-06-20',
        ],
    ];

    /**
     * @return array{
     *     items: array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string}>,
     *     keyword: string,
     *     sort: string,
     *     perPage: ?int,
     *     isReady: bool,
     *     currentPage: int,
     *     hasPrevious: bool,
     *     previousPage: ?int,
     *     hasNext: bool,
     *     nextPage: ?int,
     *     showPagination: bool
     * }
     */
    public function execute(?string $keyword, string $sort, int $page, ?int $perPage): array
    {
        $terms = $this->splitSearchTerms($keyword);
        $projects = $this->filteredProjects($terms);
        $this->sortProjects($projects, $sort);

        if ($perPage === null) {
            return [
                'items' => [],
                'keyword' => implode(' ', $terms),
                'sort' => $sort,
                'perPage' => null,
                'isReady' => false,
                'currentPage' => 1,
                'hasPrevious' => false,
                'previousPage' => null,
                'hasNext' => false,
                'nextPage' => null,
                'showPagination' => false,
            ];
        }

        $totalPages = max(1, (int) ceil(count($projects) / $perPage));
        $currentPage = min($page, $totalPages);
        $offset = ($currentPage - 1) * $perPage;
        $items = array_map(
            fn (array $project): array => $this->publicProject($project),
            array_slice($projects, $offset, $perPage),
        );

        return [
            'items' => $items,
            'keyword' => implode(' ', $terms),
            'sort' => $sort,
            'perPage' => $perPage,
            'isReady' => true,
            'currentPage' => $currentPage,
            'hasPrevious' => $currentPage > 1,
            'previousPage' => $currentPage > 1 ? $currentPage - 1 : null,
            'hasNext' => $currentPage < $totalPages,
            'nextPage' => $currentPage < $totalPages ? $currentPage + 1 : null,
            'showPagination' => count($projects) > $perPage,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function splitSearchTerms(?string $keyword): array
    {
        if ($keyword === null || $keyword === '') {
            return [];
        }

        return array_values(array_filter(
            preg_split('/[\s　]+/u', $keyword) ?: [],
            fn (string $term): bool => $term !== '',
        ));
    }

    /**
     * @param  array<int, string>  $terms
     * @return array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string, order: int}>
     */
    private function filteredProjects(array $terms): array
    {
        return array_values(array_filter(
            array_map(
                fn (array $project, int $order): array => [...$project, 'order' => $order],
                self::PROJECTS,
                array_keys(self::PROJECTS),
            ),
            function (array $project) use ($terms): bool {
                $searchableValues = [
                    $project['companyName'],
                    $project['contactName'],
                    $project['address'],
                    $project['memo'],
                ];

                foreach ($terms as $term) {
                    $matchesTerm = false;

                    foreach ($searchableValues as $value) {
                        if (str_contains($value, $term)) {
                            $matchesTerm = true;

                            break;
                        }
                    }

                    if (! $matchesTerm) {
                        return false;
                    }
                }

                return true;
            },
        ));
    }

    /**
     * @param  array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string, order: int}>  $projects
     */
    private function sortProjects(array &$projects, string $sort): void
    {
        usort($projects, function (array $first, array $second) use ($sort): int {
            $dateComparison = $first['registeredDate'] <=> $second['registeredDate'];

            if ($sort === 'registered_desc') {
                $dateComparison *= -1;
            }

            return $dateComparison ?: ($first['order'] <=> $second['order']);
        });
    }

    /**
     * @param  array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string, order: int}  $project
     * @return array{id: string, companyName: string, contactName: string, address: string, memo: string, registeredDate: string}
     */
    private function publicProject(array $project): array
    {
        unset($project['order']);

        return $project;
    }
}
