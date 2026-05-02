<?php

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
