<?php

namespace App\Repositories\ApiPreview;

/**
 * API Preview 側の APIs.guru Repository 契約です。
 *
 * Action はこの Interface に依存します。
 * これにより、実 HTTP 通信を行う Repository と、将来の fake/stub 実装を差し替えやすくします。
 */
interface ApisGuruPreviewRepositoryInterface
{
    /**
     * APIs.guru list.json を Preview 確認用に取得します。
     *
     * @return array<string, mixed>
     */
    public function fetchList(): array;
}
