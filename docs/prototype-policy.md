# プロトタイプ運用ルール

## 目的

このドキュメントは、MOCKとPROTOTYPEの役割、配置、許可する処理、本番化時の境界を明文化するためのものです。

全体の開発段階は `docs/development-flow.md` に従います。

```text
IDEA BOARD
    ↓
MOCK
    ↓
PROTOTYPE
    ↓
PRODUCT
```

MOCKとPROTOTYPEは検証用であり、本番コードではありません。

## MOCKの役割

MOCKは、UI部品、レイアウト、状態表示、操作感を確認するためのデモです。

扱ってよいもの:

- 固定データ
- Card、Button、Field、ModalなどのUI部品
- タブ、スワイプ、自動送りなどの操作感
- loading、error、empty、selectedなどの状態表示
- モバイル縦向き・横向き・PCのレイアウト
- 背景エフェクト

扱わないもの:

- DB保存
- 本番API通信
- 業務判断
- 権限判断
- 正式な状態遷移
- 本番用のAction / Service / Repository

MOCKはUIの種類や目的ごとにタブで整理します。

例:

```text
Layout
Card
Field
Modal
Navigation
Swipe / Auto Play
Loading / Error / Empty
Effects
```

機能名だけでタブを分けず、UIの種類や目的から対象デモを探せる構成にします。

## PROTOTYPEの役割

PROTOTYPEは、MOCKで確認したUIを使い、画面遷移、操作手順、簡易的なデータの流れを動かして検証するための一時実装です。

扱ってよいもの:

- MOCKと同じUI、デザイン、Common Component
- 仮データ
- 簡易的な状態変化
- 検証用ルート
- 検証用Controller
- 簡易通信
- 画面遷移
- 操作フロー

扱わないもの:

- 本番業務ロジック
- 正式なDB設計
- 本番データの更新
- 本番APIへの更新・削除
- Productと同等の完成判定

速度を優先して一気に作ってよいのはPrototypeまでです。ただし、速く作れたことを完成判定に使いません。

## MOCKとPROTOTYPEのUI共有

MOCKとPROTOTYPEは、同じ見た目やCommon Componentを使ってよいものとします。

共有してよいもの:

- 業務非依存のButton、Card、Field、Modal
- Layout
- theme
- Effects
- 汎用的なUI状態

共有しないもの:

- MOCKの固定データ
- Prototypeの簡易処理
- 機能固有の仮条件
- 本番業務ロジック

Common Componentの責務は `docs/ui.md`、React / Inertia / TypeScriptの実装責務は `docs/frontend.md` に従います。

## 基本ルール

- MOCKとPrototypeのコードはProductコードと分離する
- Prototype用ルートは本番ルートと分離する
- MOCKとPrototypeは簡単に削除できる構成にする
- PrototypeコードをそのままProductへ流用しない
- Product化する場合は、確認できた仕様だけを抽出して実装し直す
- 本番化の判断は人間が行う
- Prototypeで省略した責務・テスト・バリデーションをProductへ持ち越さない

## ディレクトリ方針

MOCKとPrototypeは専用ディレクトリに配置します。

例:

```text
resources/js/Pages/Mocks/
resources/js/Components/Mocks/
resources/js/Pages/Prototypes/
resources/js/Components/Prototypes/
app/Http/Controllers/Prototype/
routes/prototypes.php
```

複数段階で使用する業務非依存UIは `resources/js/Components/Common/` に置きます。

MOCK専用、Prototype専用、Product専用の処理をCommonへ移しません。

## ルーティング方針

Prototype用ルートは `routes/prototypes.php` に定義します。

`routes/web.php` では、必要に応じてPrototype用ルートを読み込みます。

```php
// routes/web.php
require __DIR__ . '/prototypes.php';
```

Prototype URLは `/prototypes/...` 配下に配置します。

```php
Route::prefix('prototypes')
    ->name('prototypes.')
    ->group(function () {
        // prototype routes
    });
```

MOCKがフロントだけで完結する場合は、Laravelへの再通信を増やしません。

## 削除方針

MOCKとPrototypeは、関連ファイルを削除するだけで取り除ける構成にします。

削除対象:

- MOCK用Page / Component
- Prototype用Page / Component
- Prototype用Controller
- Prototype用Route
- 固定データ・仮データ
- 検証用メモ

削除時に、無関係なProductコードやCommon Componentを変更しません。

Common Componentを削除する場合は、Productを含む利用箇所を確認します。

## Product化方針

PrototypeコードをそのままProductへ昇格しません。

Product化する場合は、次の内容を抽出します。

- 目的
- 入力
- 出力
- 画面導線
- 成功条件
- 失敗条件
- 必要な挙動
- 実装しないこと
- バリデーション要件
- 業務ルール
- 権限
- テスト観点

そのうえで、1機能・1ユースケース単位に分解し、正式なADR / レイヤード構成で実装します。

## Productにおける責務

Productでは、以下の責務境界を守ります。

- Controller: HTTP入口のみ
- Request: 入力形式バリデーションのみ
- Action: ユースケースの流れ
- Service: 業務判断・ドメインルール
- Repository: DB操作・永続化
- DTO: レイヤー間データ保持
- Responder: レスポンス整形
- Factory: 生成・選択
- Strategy: 処理差分
- Event: 発生した事実
- Listener: Event後の副作用
- Feature Component: 機能固有の表示・操作
- Common Component: 業務非依存の表示・操作

必要なテストは `docs/testing.md`、実装手順は `docs/development-flow.md` に従います。

## 原則

```text
MOCKはUIを見せるために作る
PROTOTYPEは操作と流れを試すために作る
PRODUCTは保守するために作る
```

MOCKとPrototypeは捨てられる構成にし、Productは変更理由と影響範囲を説明できる構成にします。
