<?php

namespace App\Actions\ApiPreview;

use App\DTO\ApiPreview\ApisGuruPreviewPageDTO;
use App\Factories\ApiPreview\ApisGuruPreviewResultFactory;
use App\Repositories\ApiPreview\ApisGuruPreviewRepository;
use App\Repositories\ApiPreview\ApisGuruPreviewRepositoryInterface;

/**
 * APIs.guru list.json を実 API で確認するためのユースケース Action です。
 *
 * この Action は「手順」だけを持ちます。
 * 外部 API 通信の詳細は Repository、レスポンス構造の観察用変換は Factory、
 * Inertia props への変換は Controller 経由で Responder に渡し、Action は PageDTO の作成までに留めます。
 */
class PreviewApisGuruListAction
{
    public function __construct(
        // Interface へ依存しておくと、外部通信の実装を mock/stub に差し替えやすくなります。
        private readonly ApisGuruPreviewRepositoryInterface $repository,
        // transport result array を React 画面用 DTO へ変換する責務は Factory に閉じ込めます。
        private readonly ApisGuruPreviewResultFactory $factory,
    ) {}

    public function execute(bool $shouldFetch): ApisGuruPreviewPageDTO
    {
        /*
         * 初期表示では $shouldFetch=false なので外部 API を叩きません。
         * 画面の「list.json を取得」ボタンが fetch=1 を付けて再訪問したときだけ、
         * Repository → Factory の順に処理して取得結果 DTO を作ります。
         */
        $result = null;

        if ($shouldFetch) {
            /*
             * Repository の返り値は transport result です。
             * そのまま画面へ渡さず、Preview 画面専用 DTO に変換します。
             */
            $result = $this->factory
                ->fromTransportResult($this->repository->fetchList());
        }

        return new ApisGuruPreviewPageDTO(
            apiName: 'APIs.guru list.json',
            endpoint: ApisGuruPreviewRepository::LIST_URL,
            method: 'GET',
            canFetch: true,
            hasFetched: $shouldFetch,
            result: $result,
        );
    }
}
