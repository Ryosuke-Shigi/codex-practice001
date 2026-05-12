<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class QuakeWavePreviewMapMockController extends Controller
{
    public function __invoke(): Response
    {
        /*
         * モック用 MAP ページの HTTP 入口です。
         * 仮データは React ページ側で作り、共通表示コンポーネントへ渡します。
         * DB pins を読む本番寄りページとは URL を分け、保存処理や Repository には触れません。
         */
        return Inertia::render('QuakeWavePreview/JapanQuakeWaveMapMockPage');
    }
}
