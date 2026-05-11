<?php

use App\Http\Controllers\ApiCatalogController;
use App\Http\Controllers\ApiCatalogNoteController;
use App\Http\Controllers\ApiCatalogSyncController;
use App\Http\Controllers\ApiPreviewController;
use App\Http\Controllers\ApisGuruPreviewController;
use App\Http\Controllers\QuakeWavePreviewXmlController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('/lab', function () {
    // 将来 DB 取得に置き換える仮データです。
    // Lab では現在触れる検証入口だけを表示し、未実装の仮カードはここへ戻さない方針です。
    $experiments = [
        [
            // API Preview は本体同期とは切り離した、外部API疎通確認用の入口です。
            'id' => 'api-preview',
            'title' => 'API Preview',
            'summary' => '外部APIを本体実装前に叩き、成功時・失敗時のレスポンスを確認する開発補助画面です。',
            'status' => 'Ready',
            'href' => '/api-preview',
        ],
        [
            // API Discovery Hub は api_catalog_cache を使う本番一覧画面への入口です。
            'id' => 'api-discovery-hub',
            'title' => 'API Discovery Hub',
            'summary' => '公開APIを検索・調査・保存していくためのAPIカタログ画面です。',
            'status' => 'Preview',
            'href' => '/api-catalog',
        ],
        [
            // QuakeWave Preview は地震波可視化系 UI モックの入口です。
            'id' => 'quakewave-preview',
            'title' => 'QuakeWave Preview',
            'summary' => '地震波可視化の UI モックを、本実装や API 接続前に画面単位で確認する入口です。',
            'status' => 'Mock',
            'href' => '/quakewave-preview',
        ],
    ];

    return Inertia::render('Lab/Index', [
        'experiments' => $experiments,
    ]);
})->name('lab.index');

Route::get('/quakewave-preview', function () {
    $mocks = [
        [
            // MAP 表示は地震API接続前に、水背景と日本地図の見え方だけを確認するモックです。
            'id' => 'map-display',
            'title' => 'MAP表示',
            'summary' => '水背景の上に日本地図を重ね、後で地震ピンと波紋を配置する土台を確認します。',
            'status' => 'Ready',
            'href' => '/quakewave-preview/map',
        ],
        [
            // XML取得プレビューは地図表示へ接続せず、JMA Atom feed の entry 確認だけを行います。
            'id' => 'xml-preview',
            'title' => 'XML取得プレビュー',
            'summary' => '気象庁の地震火山情報 Atom フィードを取得し、entry の title / updated / link を確認します。',
            'status' => 'Ready',
            'href' => '/quakewave-preview/xml',
        ],
    ];

    return Inertia::render('QuakeWavePreview/Index', [
        'mocks' => $mocks,
    ]);
})->name('quakewave-preview.index');

Route::get('/quakewave-preview/map', function () {
    /*
     * 第1段階では地震API接続やDB取得を行わず、空配列だけを React に渡します。
     * 将来は Laravel 側で EarthquakeMapPinDTO / EarthquakeMapPinListDTO を作り、
     * ここから pins props として渡す想定です。
     */
    return Inertia::render('QuakeWavePreview/Map', [
        'pins' => [],
    ]);
})->name('quakewave-preview.map');

Route::get('/quakewave-preview/xml', QuakeWavePreviewXmlController::class)
    ->name('quakewave-preview.xml');

Route::get('/api-preview', ApiPreviewController::class)->name('api-preview.index');

// API Discovery Hub 本体一覧です。表示整形は Responder、DB 取得は Repository に分離します。
Route::get('/api-catalog', ApiCatalogController::class)->name('api-catalog.index');

// API Discovery Hub 本番一覧から起動する同期開始ルートです。API Preview 側には更新責務を持たせません。
Route::post('/api-catalog/sync', ApiCatalogSyncController::class)->name('api-catalog.sync');
Route::get('/api-catalog/sync/status', [ApiCatalogSyncController::class, 'status'])
    ->name('api-catalog.sync.status');

// API Discovery Hub 本体一覧の UI 確認用モックです。DB 取得や Responder とは切り離します。
Route::get('/api-catalog/mock', function () {
    return Inertia::render('ApiCatalog/MockIndex');
})->name('api-catalog.mock');

// API Discovery Hub 本体詳細の UI 確認用モックです。DB 取得や Query Action とは切り離します。
Route::get('/api-catalog/mock/{apiKey}', function (Request $request, string $apiKey) {
    $returnUrl = $request->query('return_url');

    /*
     * モック詳細も本番詳細と同じ戻り導線で確認できるよう return_url を受けます。
     * ただし戻り先はモック一覧内に限定し、外部 URL や本番詳細 URL を混ぜないようにします。
     * /api-catalog は本番一覧なので、モック詳細からの戻り先としては採用しません。
     */
    return Inertia::render('ApiCatalog/MockDetail', [
        'apiKey' => $apiKey,
        'returnUrl' => is_string($returnUrl)
            && ($returnUrl === '/api-catalog/mock' || str_starts_with($returnUrl, '/api-catalog/mock?'))
            ? $returnUrl
            : '/api-catalog/mock',
    ]);
})->name('api-catalog.mock.detail');

/*
 * API Discovery Hub 本番詳細の保存メモ操作です。
 * apiKey は詳細表示と同じ識別子として扱い、Controller で rawurldecode してから Action へ渡します。
 */
Route::post('/api-catalog/{apiKey}/notes', [ApiCatalogNoteController::class, 'store'])
    ->name('api-catalog.notes.store');
Route::patch('/api-catalog/{apiKey}/notes/{note}', [ApiCatalogNoteController::class, 'update'])
    ->name('api-catalog.notes.update');
Route::delete('/api-catalog/{apiKey}/notes/{note}', [ApiCatalogNoteController::class, 'destroy'])
    ->name('api-catalog.notes.destroy');

/*
 * API Discovery Hub 本体詳細です。
 * api_key には "." や ":" を含むため、slug ではなく path 末尾全体を識別子として受けます。
 */
Route::get('/api-catalog/{apiKey}', [ApiCatalogController::class, 'show'])
    ->where('apiKey', '.*')
    ->name('api-catalog.show');

// API preview は本体同期や DB 保存とは切り離した、開発補助用の確認ルートです。
Route::get('/api-preview/apis-guru', ApisGuruPreviewController::class)->name('api-preview.apis-guru');
Route::get('/api-preview/apis-guru/mock', [ApisGuruPreviewController::class, 'mock'])
    ->name('api-preview.apis-guru.mock');
Route::get('/api-preview/apis-guru/mock-error', [ApisGuruPreviewController::class, 'mockError'])
    ->name('api-preview.apis-guru.mock-error');
