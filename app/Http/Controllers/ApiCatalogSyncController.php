<?php

namespace App\Http\Controllers;

use App\Actions\ApiCatalog\Commands\StartApiCatalogSyncAction;
use App\Actions\ApiCatalog\Queries\GetApiCatalogSyncStatusAction;
use App\Responders\ApiCatalog\ApiCatalogSyncStatusResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * APIカタログ同期開始と同期状態取得の HTTP 入口です。
 *
 * 同期開始POSTと polling 用JSONを Action / Responder へ接続します。
 * 同期本体や件数集計は Job / Service に置き、Controller はHTTP入力と戻り先の安全確認に限定します。
 */
class ApiCatalogSyncController extends Controller
{
    public function __invoke(
        Request $request,
        StartApiCatalogSyncAction $action,
        ApiCatalogSyncStatusResponder $responder,
    ): RedirectResponse|JsonResponse {
        /*
         * Controller はHTTP入口に留め、同期開始の手順は Action に任せます。
         * 一覧状態は return_url で受け、検索・並び替え・ページ番号を保ったまま戻します。
         * ここで同期結果を整形しないことで、完了確認や集計表示の責務を後続の専用導線へ残します。
         */
        $status = $action->execute();

        if ($request->expectsJson()) {
            return $responder->json($status);
        }

        return redirect($this->listReturnUrl($request));
    }

    public function status(
        Request $request,
        GetApiCatalogSyncStatusAction $action,
        ApiCatalogSyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->integer('sync_id') > 0 ? $request->integer('sync_id') : null;

        return $responder->json($action->execute($syncRunId));
    }

    private function listReturnUrl(Request $request): string
    {
        $returnUrl = $request->input('return_url');

        /*
         * POST後の戻り先は本番一覧だけに限定します。
         * 外部URLや詳細URLへリダイレクトしないことで、同期開始導線を一覧画面内に閉じます。
         * API Preview やモック一覧には同期開始責務を持たせないため、許可する戻り先も本番一覧だけです。
         */
        if (
            is_string($returnUrl)
            && ($returnUrl === '/api-catalog' || str_starts_with($returnUrl, '/api-catalog?'))
        ) {
            return $returnUrl;
        }

        return route('api-catalog.index');
    }
}
