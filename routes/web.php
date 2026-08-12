<?php

use App\Http\Controllers\ApiCatalogController;
use App\Http\Controllers\ApiCatalogNoteController;
use App\Http\Controllers\ApiCatalogSyncController;
use App\Http\Controllers\ApiPreviewController;
use App\Http\Controllers\ApisGuruPreviewController;
use App\Http\Controllers\ApplicationErrorLogResolveController;
use App\Http\Controllers\DanceShortsAnalyzerAnalyzeController;
use App\Http\Controllers\DanceShortsAnalyzerController;
use App\Http\Controllers\DanceShortsRadarController;
use App\Http\Controllers\DanceShortsRadarDisplayCardWindowController;
use App\Http\Controllers\DanceShortsRadarMockController;
use App\Http\Controllers\DesignPhilosophyController;
use App\Http\Controllers\LumiLabProjectMockController;
use App\Http\Controllers\ProjectLogsController;
use App\Http\Controllers\QuakeWavePreviewController;
use App\Http\Controllers\QuakeWavePreviewFeedEntrySyncController;
use App\Http\Controllers\QuakeWavePreviewFeedEntrySyncStatusController;
use App\Http\Controllers\QuakeWavePreviewMapController;
use App\Http\Controllers\QuakeWavePreviewMapMockController;
use App\Http\Controllers\QuakeWavePreviewMapPinSyncController;
use App\Http\Controllers\QuakeWavePreviewMapPinSyncStatusController;
use App\Http\Controllers\QuakeWavePreviewMapRefreshController;
use App\Http\Controllers\QuakeWavePreviewXmlController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('/projects', function () {
    return Inertia::render('Projects/Select');
})->name('projects.select');

Route::get('/projects/logs', ProjectLogsController::class)
    ->name('projects.logs');

Route::post('/application-error-logs/{log}/resolve', ApplicationErrorLogResolveController::class)
    ->whereNumber('log')
    ->name('application-error-logs.resolve');

Route::get('/design-philosophy', DesignPhilosophyController::class)
    ->name('design-philosophy');

Route::get('/lab/api-discovery-hub-idea-board', function () {
    /*
     * API Discovery Hub 本体機能の紹介LPです。
     * ここでは Inertia ページを返すだけに限定し、DBキャッシュ取得、同期開始、
     * status API 取得、メモ保存などの本体責務は既存ルートへ残します。
     */
    return Inertia::render('Lab/ApiDiscoveryHubPp');
})->name('lab.api-discovery-hub-idea-board');

Route::get('/lab/quake-wave-map-idea-board', function () {
    /*
     * Japan Quake Wave Map 本体機能の紹介LPです。
     * XML取得、feed同期、map pin同期、地図props生成は既存の QuakeWave Preview 側の責務です。
     * このルートでは紹介ページの表示だけを行い、外部APIやDBには触りません。
     */
    return Inertia::render('Lab/QuakeWaveMapPp');
})->name('lab.quake-wave-map-idea-board');

Route::get('/lab/dance-shorts-radar-idea-board', function () {
    /*
     * Dance Shorts Radar の構想紹介ページです。
     * YouTube Data API の疎通、DB保存、snapshot計算、ランキング画面はまだ持たせず、
     * portfolio 上のアイデアボードとして「何を作る予定か」を静的に説明する責務に限定します。
     */
    return Inertia::render('Lab/DanceShortsRadar');
})->name('lab.dance-shorts-radar-idea-board');

Route::get('/lab/dance-shorts-analyzer-idea-board', function () {
    return Inertia::render('Lab/DanceShortsAnalyzer');
})->name('lab.dance-shorts-analyzer-idea-board');

Route::get('/lab/dance-shorts-analyzer-mock', function () {
    // 表示専用MOCKです。本体分析、DB取得、YouTube API取得は行いません。
    return Inertia::render('Lab/DanceShortsAnalyzerMock');
})->name('lab.dance-shorts-analyzer-mock');

Route::get('/lab/dance-shorts-radar-mock', DanceShortsRadarMockController::class)
    ->name('lab.dance-shorts-radar-mock');

/*
 * DanceShortsAnalyzer の PRODUCT 入口です。
 * Search は保存済み動画の検索、Analyze は選択済み動画の snapshot 比較を担当します。
 * routes では URL と Controller の対応だけを定義し、検索条件、最大選択数、ECharts props は
 * Request / Action / Responder / Component 側の境界で扱います。
 */
Route::get('/dance-shorts-analyzer', DanceShortsAnalyzerController::class)
    ->name('dance-shorts-analyzer.index');

Route::get('/dance-shorts-analyzer/analyze', DanceShortsAnalyzerAnalyzeController::class)
    ->name('dance-shorts-analyzer.analyze');

/*
 * DanceShortsRadar の PRODUCT 表示入口です。
 * 初期表示は Inertia、display-card-window は同じ表示条件を使う JSON 追加取得APIとして扱います。
 * YouTube API 同期、snapshot専用同期、cleanup は console / Job 側に分け、この route 群では起動しません。
 */
Route::get('/dance-shorts-radar', DanceShortsRadarController::class)
    ->name('dance-shorts-radar.index');

Route::get('/api/dance-shorts-radar/display-card-window', DanceShortsRadarDisplayCardWindowController::class)
    ->name('dance-shorts-radar.display-card-window');

Route::get('/lab/construction-order-workflow-mock', function () {
    // UI MOCK専用の Inertia ページです。保存、取込、地図API連携、帳票生成は行いません。
    return Inertia::render('Lab/ConstructionOrderNewMock');
})->name('lab.construction-order-workflow-mock');

Route::get('/lab/construction-order-workflow-idea-board', function () {
    // 非エンジニア向けの構想説明ページです。本番処理や保存処理は持たせません。
    return Inertia::render('Lab/ConstructionOrderWorkflowPP');
})->name('lab.construction-order-workflow-idea-board');

Route::get('/lab/event-card-calendar-idea-board', function () {
    // イベント・カードカレンダーのIDEA BOARDです。DB保存、通知、実集計、実グラフは行いません。
    return Inertia::render('Lab/EventCardCalendarIdeaBoard');
})->name('lab.event-card-calendar-idea-board');

/*
 * QuakeWave Preview の開発確認入口です。
 * index / mock / xml / map / sync status を分け、表示確認、XML確認、DB保存済みpin表示、
 * 非同期同期開始を同じ Controller へ詰め込まないようにしています。
 */
Route::get('/quakewave-preview', QuakeWavePreviewController::class)
    ->name('quakewave-preview.index');

Route::get('/quakewave-preview/map', QuakeWavePreviewMapController::class)
    ->name('quakewave-preview.map');

Route::get('/quakewave-preview/map/mock', QuakeWavePreviewMapMockController::class)
    ->name('quakewave-preview.map.mock');

Route::post('/quakewave-preview/map/refresh', QuakeWavePreviewMapRefreshController::class)
    ->name('quakewave-preview.map.refresh');

Route::get('/quakewave-preview/xml', QuakeWavePreviewXmlController::class)
    ->name('quakewave-preview.xml');

Route::post('/quakewave-preview/feed-entries/sync', QuakeWavePreviewFeedEntrySyncController::class)
    ->name('quakewave-preview.feed-entries.sync');
Route::get('/quakewave-preview/feed-entries/sync/status', QuakeWavePreviewFeedEntrySyncStatusController::class)
    ->name('quakewave-preview.feed-entries.sync.status');

Route::post('/quakewave-preview/map-pins/sync', QuakeWavePreviewMapPinSyncController::class)
    ->name('quakewave-preview.map-pins.sync');
Route::get('/quakewave-preview/map-pins/sync/status', QuakeWavePreviewMapPinSyncStatusController::class)
    ->name('quakewave-preview.map-pins.sync.status');

/*
 * API Preview は外部API疎通とレスポンス形確認の入口です。
 * API Discovery Hub 本体同期やDBキャッシュ保存とは切り離し、成功/失敗の画面確認だけを扱います。
 */
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

Route::get('/lab/lumilab-project-idea-board', function () {
    return Inertia::render('Lab/LumiLabProjectIdeaBoard');
})->name('lab.lumilab-project-idea-board');

// LumiLab案件一覧MOCKの入口。固定データを扱い、DB、外部API、本番保存は行わない。
Route::get('/lab/lumilab-project-mock', LumiLabProjectMockController::class)
    ->name('lab.lumilab-project-mock');

Route::redirect('/lab/lumilab-project-create-idea-board', '/lab/lumilab-project-idea-board')
    ->name('lab.lumilab-project-create-idea-board.redirect');
