# API Discovery Hub

- Status: active
- Scope: API Discovery Hub
- Last reviewed: 2026-11-22
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

API Discovery Hub固有の同期、検索、保存メモ、出力境界、テスト固定内容をまとめます。

共通責務は `docs/architecture.md`、共通テスト方針は `docs/testing.md` に従います。

## 機能概要

APIs.guruの `list.json` を取得し、公開APIカタログを検索・保存・調査する機能です。

主な機能:

- APIカタログ同期
- API一覧検索
- provider / domain絞り込み
- pagination
- API詳細表示
- APIごとの調査メモCRUD
- 外部検索リンクの表示時生成

## 同期

外部データは `api_catalog_cache` へ保存します。

APIs.guru `list.json` 取得は外部API呼び出し1回ごとにAPI連携ログを発火します。

同期結果は次に分けます。

- insert
- update
- skip

変更検知には `payload_hash` を使用します。

Repositoryは外部API通信・DB取得保存を担当し、差分の意味づけや同期結果の判断はService / Action側へ置きます。

## 検索

検索で固定する主な仕様:

- keyword検索対象
- provider絞り込み
- domain絞り込み
- sort
- pagination補正
- Inertia props

検索条件の意味判断をRepositoryへ置きすぎず、Repositoryは渡された条件に基づく取得を担当します。

## 保存メモ

`saved_api_notes` の主な仕様:

- create
- update
- delete
- soft delete
- 所有確認
- `return_url` 制御

権限・所有可否はService等で判断し、Repositoryは対象データの取得・保存・削除を担当します。

## 公開一覧・詳細の表示契約

- キーワードは常時表示し、追加条件を閉じても条件の個別解除、並び順、検索結果件数に到達できます。
- Provider候補の文字絞り込みは候補表示だけに適用し、Providerを選択した時だけ既存の完全一致条件で検索します。
- 入力・選択は既存のInertia GETで適用し、条件・並び順変更で1ページ目へ戻ります。全条件解除でも選択した並び順を維持します。
- 応答待ちは確定件数・候補・ページ送りを出さず、検索完了後にサーバーの件数と候補を表示します。検索失敗は再試行できます。
- カードではAPI名、Provider・Service、用途、API版・OpenAPI版を表示し、詳細と4種類の外部検索を分けます。本文のある保存メモは最大2件と残数を表示します。
- 詳細は用途・提供元の原文、技術情報、調査メモの順に読みます。提供済みのHTTP(S)仕様書URLだけをリンク表示し、仕様本文を自動取得しません。MOCK詳細の技術情報開閉と非永続化を維持します。
- 公開詳細の戻り先は公開一覧の条件・並び順・ページを保持します。ページ送りは一覧内に置き、フォーム操作中の矢印キーやスワイプをページ移動に使いません。
- 同期の進行は専用Hookが扱い、検索とは別の取り込み状況として表示します。停止後の内訳は開閉だけで確認でき、開閉では通信・再同期しません。
- 同期完了の部分再取得は検索未確定中に延期し、確定後の最新URLで行います。検索や離脱で旧再取得を取り消し、旧応答処理中でも入力中の条件を巻き戻しません。検索失敗の再試行は失敗した条件・並び順・ページを再送します。
- 未解決の失敗要求も旧propsから保護し、詳細・開発段階選択へ移動中は自動再取得を延期します。新たに受理した同期IDを過去のpropsで戻さず、追跡なしを示す現在のPOSTのnullと遅いnull propsを区別します。ページ送りのフォーカス復帰は、利用者が別操作へ移った場合に取り消します。

## 出力

Responderは次を画面用に整形します。

- API一覧
- filter値
- pagination
- 詳細データ
- 保存メモ
- 外部検索リンク
- redirect / return URLに必要な情報

DB Modelや不要な内部カラムをそのままpropsへ渡しません。

## テストで固定する仕様

### DTO

- 値保持
- query正規化
- `toArray()`
- ListDTOの配列化

### 同期

- insert / update / skip
- `payload_hash` による差分判定
- 空データ・異常レスポンス
- 同期結果集計

### Repository

- DB検索条件
- keyword検索対象
- provider / domain絞り込み
- sort
- pagination

### Feature / Responder

- Inertia props
- API一覧・詳細
- filter値
- pagination補正
- redirect

### 保存メモ

- CRUD
- soft delete
- note所有確認
- `return_url` 制御
- 他APIのメモを操作できない（API単位の所有境界）

## 変更時の確認

- 外部APIレスポンスをそのまま画面へ渡していないか
- payload全文や秘密情報をログへ残していないか
- APIs.guru `list.json` ログへresponse body全文を保存していないか
- Repositoryへ業務判断・所有判断が入っていないか
- DTO / Responder / Componentの境界が崩れていないか
- filter・pagination・return URLの既存仕様を壊していないか
- この文書と現在のコード・テストが一致しているか
