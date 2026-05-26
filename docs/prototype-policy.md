# プロトタイプ運用ルール

## 目的

プロトタイプは、画面イメージ・操作感・要件確認のための一時的な実装として扱う。

プロトタイプは本番コードではない。

## 基本ルール

- プロトタイプコードは本番コードと分離する。
- プロトタイプ用ルートは本番ルートと分離する。
- プロトタイプは簡単に削除できる構成にする。
- プロトタイプコードをそのまま本番コードへ流用しない。
- 本番化する場合は、プロトタイプから仕様だけを抽出し、正式な ADR / レイヤード構成で実装し直す。

## ディレクトリ方針

プロトタイプコードは、専用ディレクトリに配置する。

例：

```txt
resources/js/Pages/Prototypes/
resources/js/Components/Prototypes/
app/Http/Controllers/Prototype/
routes/prototypes.php
```

## ルーティング方針

プロトタイプ用ルートは `routes/prototypes.php` に定義する。

`routes/web.php` では、必要に応じてプロトタイプ用ルートを読み込む。

```php
// routes/web.php
require __DIR__ . '/prototypes.php';
```

プロトタイプ URL は `/prototypes/...` 配下に配置する。

```php
Route::prefix('prototypes')
    ->name('prototypes.')
    ->group(function () {
        // prototype routes
    });
```

## 削除方針

プロトタイプは、関連ファイルを削除するだけで取り除ける構成にする。

プロトタイプ削除時は、以下を対象にする。

- プロトタイプ用 Page ディレクトリ
- プロトタイプ用 Component
- プロトタイプ用 Controller
- プロトタイプ用 Route
- 関連するモックデータ
- 不要になったプロトタイプ用メモ

プロトタイプ削除時に、無関係な本番コードを変更しない。

## 本番化方針

プロトタイプコードをそのまま本番コードへ昇格しない。

本番化する場合は、以下だけを抽出する。

- 目的
- 入力
- 出力
- 画面導線
- 成功条件
- 失敗条件
- 必要な挙動
- 実装しないこと
- バリデーション要件
- テスト観点

そのうえで、正式な ADR / レイヤード構成で実装し直す。

## ADR 上の責務

本番実装では、以下の責務境界を守る。

- Controller：HTTP 入口のみ
- Request：入力形式バリデーションのみ
- Action：ユースケースの流れ
- Service：業務判断・ドメインルール
- Repository：DB 操作・永続化
- DTO：レイヤー間データ保持
- Responder：レスポンス整形
- Factory：生成・選択
- Strategy：処理差分
- Event：発生した事実
- Listener：Event 後の副作用

## 原則

プロトタイプは捨てる前提。

本番コードは保守する前提。
