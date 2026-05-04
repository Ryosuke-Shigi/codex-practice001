<?php

namespace App\Http\Controllers;

use App\Actions\ApiPreview\ListApiPreviewsAction;
use Inertia\Response;

class ApiPreviewController extends Controller
{
    public function __invoke(ListApiPreviewsAction $action): Response
    {
        // 一覧画面の HTTP 入口です。表示データの組み立ては Action に任せます。
        return $action->execute();
    }
}
