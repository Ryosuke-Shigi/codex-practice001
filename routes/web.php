<?php

use App\Http\Controllers\ApiPreviewController;
use App\Http\Controllers\ApisGuruPreviewController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('/lab', function () {
    // 将来 DB 取得に置き換える仮データです。
    // 今回は公開画面の完成形を先に確認するため、Controller/Service/Repository はまだ使いません。
    $experiments = [
        [
            'id' => 'vtuber-management',
            'title' => 'VTuberマネジメントシステム',
            'summary' => 'タレント、案件、配信予定をまとめるための管理UIプロトタイプ。',
            'status' => 'Concept',
        ],
        [
            'id' => 'python-bridge',
            'title' => 'Python連動',
            'summary' => 'Laravel 画面から Python 側の処理結果を扱う将来検証用の入口。',
            'status' => 'Planned',
        ],
        [
            'id' => 'water-ui',
            'title' => 'Water UI 実験',
            'summary' => '水面、透明感、シーグラス調のコンポーネント表現を試す領域。',
            'status' => 'Preview',
        ],
    ];

    return Inertia::render('Lab/Index', [
        'experiments' => $experiments,
    ]);
})->name('lab.index');

Route::get('/api-preview', ApiPreviewController::class)->name('api-preview.index');

// API preview は本体同期や DB 保存とは切り離した、開発補助用の確認ルートです。
Route::get('/api-preview/apis-guru', ApisGuruPreviewController::class)->name('api-preview.apis-guru');
Route::get('/api-preview/apis-guru/mock', [ApisGuruPreviewController::class, 'mock'])
    ->name('api-preview.apis-guru.mock');
Route::get('/api-preview/apis-guru/mock-error', [ApisGuruPreviewController::class, 'mockError'])
    ->name('api-preview.apis-guru.mock-error');
