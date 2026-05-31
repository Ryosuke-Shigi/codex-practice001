<?php

use App\Http\Controllers\ApiCatalogController;
use App\Http\Controllers\ApiCatalogNoteController;
use App\Http\Controllers\ApiCatalogSyncController;
use App\Http\Controllers\ApiPreviewController;
use App\Http\Controllers\ApisGuruPreviewController;
use App\Http\Controllers\DesignPhilosophyController;
use App\Http\Controllers\QuakeWavePreviewController;
use App\Http\Controllers\QuakeWavePreviewFeedEntrySyncController;
use App\Http\Controllers\QuakeWavePreviewFeedEntrySyncStatusController;
use App\Http\Controllers\QuakeWavePreviewMapController;
use App\Http\Controllers\QuakeWavePreviewMapMockController;
use App\Http\Controllers\QuakeWavePreviewMapRefreshController;
use App\Http\Controllers\QuakeWavePreviewMapPinSyncController;
use App\Http\Controllers\QuakeWavePreviewMapPinSyncStatusController;
use App\Http\Controllers\QuakeWavePreviewXmlController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('/design-philosophy', DesignPhilosophyController::class)
    ->name('design-philosophy');

Route::get('/lab', function () {
    /*
     * Lab の入口カードは、現時点ではDB管理せず routes/web.php の固定配列として扱います。
     * ここで守りたい仕様は「ポートフォリオで見せる順番」と「既存導線を壊さないこと」です。
     *
     * アイデアボードカテゴリは面接・レビュー時の入口として使うため、表示順そのものが仕様になります。
     * ユーザーが指定した Lab Index の並びは PROJECT -> IDEA-BOARD -> MOCK です。
     * ここで props の配列順も同じ順番にしておくことで、React 側のタブ順、初期表示、
     * Feature テストで守る仕様が同じ読み方になります。
     *
     * この配列は紹介カード用の Inertia props だけを返します。同期処理、DB取得、外部API取得、
     * 本体機能の状態変更はここに持たせず、既存の Controller / Action / Service / Repository 側へ
     * 責務が戻るようにしています。
     */
    $experiments = [
        [
            /*
             * PROJECTカテゴリには、実装済み本体画面への直接導線も残します。
             * IDEA-BOARDカテゴリは紹介、PROJECTカテゴリは実データやDBを読む本体確認、という役割を分けます。
             */
            'id' => 'api-discovery-hub',
            'title' => 'API Discovery Hub 本番一覧',
            'summary' => '公開APIを検索・調査・保存していくためのAPIカタログ本体画面です。',
            'status' => 'Preview',
            'category' => 'PROJECT',
            'href' => '/api-catalog',
        ],
        [
            // QuakeWave Map は DB 保存済み地震ピンを地図へ表示する、完成寄りの Preview 入口です。
            // Lab の完成寄り入口として、DB pins を読む地図画面へ直接入ります。
            'id' => 'quakewave-preview',
            'title' => 'Japan Quake Wave Map 地図表示',
            'summary' => '気象庁XML由来の地震情報を保存し、震源・震度・波紋を地図上で確認する地震情報可視化画面です。',
            'status' => 'Preview',
            'category' => 'PROJECT',
            'href' => '/quakewave-preview/map',
        ],
        [
            /*
             * 完成済み機能の本体一覧へ直接飛ばすのではなく、まず紹介LPを挟みます。
             * 初見の人が「何を作ったか」「裏側で何を工夫したか」を短時間で読んでから、
             * /api-catalog や /api-catalog/mock へ進める導線にするためです。
             * 旧PP表記はユーザー向けには使わず、URL / category / status を IDEA-BOARD 側へ寄せます。
             */
            'id' => 'api-discovery-hub-idea-board',
            'title' => 'API Discovery Hub',
            'summary' => '公開APIカタログを取得・検索・保存・調査できるポートフォリオ機能の紹介ページです。',
            'status' => '完成済み',
            'category' => 'IDEA-BOARD',
            'href' => '/lab/api-discovery-hub-idea-board',
            'actionLabel' => '紹介LPを見る',
            'tags' => [
                'APIs.guru',
                'DBキャッシュ',
                '検索',
                'メモ保存',
                'DTO',
                'Responder',
            ],
        ],
        [
            /*
             * 地震マップも本体機能へ直接入る前に、XML取得、解析、pin生成、部分失敗管理などの
             * 技術的な見どころを説明するLPへ案内します。防災サービスではなくポートフォリオの
             * 可視化機能であることも、この紹介ページ側で明示します。
             */
            'id' => 'quake-wave-map-idea-board',
            'title' => 'Japan Quake Wave Map',
            'summary' => '気象庁XMLを取得・解析し、地震情報を地図上に可視化するポートフォリオ機能の紹介ページです。',
            'status' => '完成済み',
            'category' => 'IDEA-BOARD',
            'href' => '/lab/quake-wave-map-idea-board',
            'actionLabel' => '紹介LPを見る',
            'tags' => [
                '気象庁XML',
                '地図表示',
                'Queue',
                'Job',
                'status API',
                '部分失敗',
            ],
        ],
        [
            /*
             * Dance Shorts Radar は、YouTube Data API を使った次のポートフォリオ候補です。
             * まだ本体処理やDB保存は持たせず、IDEA-BOARD として API 方針、snapshot 設計、
             * 断定しない分析UIの見せ方を整理する入口に限定します。
             */
            'id' => 'dance-shorts-radar-idea-board',
            'title' => 'Dance Shorts Radar',
            'summary' => 'YouTube Shorts のダンス候補を、公開APIの統計snapshotと差分から分析するポートフォリオ候補です。',
            'status' => 'ポートフォリオ候補',
            'category' => 'IDEA-BOARD',
            'href' => '/lab/dance-shorts-radar-idea-board',
            'actionLabel' => '構想を見る',
            'tags' => [
                'YouTube Data API',
                'Shorts',
                'Snapshot',
                '差分計算',
                'JP / US / KR',
                'Scheduler',
                'Ranking',
            ],
        ],
        [
            /*
             * 工事発注は今回の主対象ではありませんが、アイデアボードカテゴリの並び順を
             * 固定するために API / 地震LPの後ろへ置きます。本体やモック側の内容には触れません。
             */
            'id' => 'construction-order-workflow-idea-board',
            'title' => '工事発注管理・請求システム',
            'summary' => 'Excel入口、CSV連携、Laravel正本化、画像管理、工程管理、請求書テンプレート選択型出力までをまとめた構想説明枠です。',
            'status' => 'アイデアボード',
            'category' => 'IDEA-BOARD',
            'href' => '/lab/construction-order-workflow-idea-board',
            'actionLabel' => '構想を見る',
            'tags' => [
                '工事発注',
                '請求',
                'CSV連携',
                '画像管理',
                '工程管理',
                '帳票',
            ],
        ],
        [
            /*
             * Spec Flow Trainer は構想中の開発補助ツールです。
             * 今回はAPI / 地震LPを先頭に出す目的なので4番目へ移動しますが、
             * 既存ページのURLと導線は維持し、仕様外の本体機能追加は行いません。
             */
            'id' => 'spec-flow-trainer',
            'title' => 'Spec Flow Trainer',
            'summary' => 'コードを書く前の設計を、仕様・DTO / ListDTO・ADR責務・TDD・AI指示として視覚化する開発補助ツール。',
            'status' => '構想・設計中',
            'category' => 'IDEA-BOARD',
            'href' => '/lab/spec-flow-trainer',
            'actionLabel' => '構想を見る',
            'tags' => [
                '仕様駆動開発',
                'DTO',
                'ListDTO',
                'ADR',
                'レイヤードアーキテクチャ',
                'TDD',
                'AIエージェント',
                'Mermaid',
                'GPT相談用テキスト',
            ],
        ],
        [
            // API Preview は本体同期とは切り離した、外部API疎通確認用のモック入口です。
            'id' => 'api-preview',
            'title' => 'API Preview',
            'summary' => '外部APIを本体実装前に叩き、成功時・失敗時のレスポンスを確認する開発補助画面です。',
            'status' => 'Mock',
            'category' => 'MOCK',
            'href' => '/api-preview',
        ],
        [
            // QuakeWave Preview はモック、部品確認、XML確認、同期確認をまとめた開発確認入口です。
            // Lab からモック確認へ行きたい場合は、個別の勝手なページではなくこの入口へ戻します。
            'id' => 'quakewave-preview-tools',
            'title' => 'QuakeWave Preview',
            'summary' => '地震マップのモック、ピン・波紋の部品、XML取得、同期状態を確認する開発用入口です。',
            'status' => 'Mock',
            'category' => 'MOCK',
            'href' => '/quakewave-preview',
        ],
        [
            // 工事発注管理・請求システムの見た目確認用モックです。
            // DB 接続、CSV 取込、S3 保存、PDF 生成は行わず、画面内 state のみで確認します。
            'id' => 'construction-order-workflow-mock',
            'title' => '工事発注管理・請求システム モック',
            'summary' => '発注登録、画像、工程、請求、履歴の業務フローを仮データだけで確認する画面モックです。',
            'status' => 'Mock',
            'category' => 'MOCK',
            'href' => '/lab/construction-order-workflow-mock',
        ],
    ];

    return Inertia::render('Lab/Index', [
        'experiments' => $experiments,
    ]);
})->name('lab.index');

Route::get('/lab/api-discovery-hub-idea-board', function () {
    /*
     * API Discovery Hub 本体機能の紹介LPです。
     * ここでは Inertia ページを返すだけに限定し、DBキャッシュ取得、同期開始、
     * status API 取得、メモ保存などの本体責務は既存ルートへ残します。
     */
    return Inertia::render('Lab/ApiDiscoveryHubPp');
})->name('lab.api-discovery-hub-idea-board');

/*
 * PP から IDEA-BOARD へ名称変更しましたが、過去に共有したURLやREADMEの古いリンクから
 * 404へ落ちないよう旧URLは新URLへ寄せます。表示責務は新しい idea-board ルートだけに置き、
 * 旧ルート側では Inertia component を直接返しません。
 */
Route::redirect('/lab/api-discovery-hub-pp', '/lab/api-discovery-hub-idea-board');

Route::get('/lab/quake-wave-map-idea-board', function () {
    /*
     * Japan Quake Wave Map 本体機能の紹介LPです。
     * XML取得、feed同期、map pin同期、地図props生成は既存の QuakeWave Preview 側の責務です。
     * このルートでは紹介ページの表示だけを行い、外部APIやDBには触りません。
     */
    return Inertia::render('Lab/QuakeWaveMapPp');
})->name('lab.quake-wave-map-idea-board');

// 旧PP URLの互換導線です。実体表示は idea-board ルートへ集約します。
Route::redirect('/lab/quake-wave-map-pp', '/lab/quake-wave-map-idea-board');

Route::get('/lab/dance-shorts-radar-idea-board', function () {
    /*
     * Dance Shorts Radar の構想紹介ページです。
     * YouTube Data API の疎通、DB保存、snapshot計算、ランキング画面はまだ持たせず、
     * portfolio 上のアイデアボードとして「何を作る予定か」を静的に説明する責務に限定します。
     */
    return Inertia::render('Lab/DanceShortsRadar');
})->name('lab.dance-shorts-radar-idea-board');

Route::get('/lab/construction-order-workflow-mock', function () {
    // 見た目確認専用の Inertia ページです。業務処理は後続の責務分離時に追加します。
    return Inertia::render('Lab/ConstructionOrderWorkflowMock');
})->name('lab.construction-order-workflow-mock');

Route::get('/lab/construction-order-workflow-idea-board', function () {
    // 非エンジニア向けの構想説明ページです。本番処理や保存処理は持たせません。
    return Inertia::render('Lab/ConstructionOrderWorkflowPP');
})->name('lab.construction-order-workflow-idea-board');

// 旧PP URLの互換導線です。工事発注の説明ページも新しい名称のURLへ統一します。
Route::redirect('/lab/construction-order-workflow-pp', '/lab/construction-order-workflow-idea-board');

Route::get('/lab/spec-flow-trainer', function () {
    /*
     * SpecFlowTrainer の構想紹介ページです。
     * 実体アプリの保存処理、Mermaid生成、React Flow編集はまだ持たせず、
     * portfolio 上のアイデアボードとして「何を作る予定か」を静的に説明する責務に限定します。
     */
    return Inertia::render('Lab/SpecFlowTrainer');
})->name('lab.spec-flow-trainer');

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
