# API Discovery Hub

- Status: active
- Scope: API Discovery Hub
- Last reviewed: 2026-06-10
- Canonical source: current code, migrations, configuration, and successful tests

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
- 他ユーザーのメモを操作できない

## 変更時の確認

- 外部APIレスポンスをそのまま画面へ渡していないか
- payload全文や秘密情報をログへ残していないか
- Repositoryへ業務判断・所有判断が入っていないか
- DTO / Responder / Componentの境界が崩れていないか
- filter・pagination・return URLの既存仕様を壊していないか
- この文書と現在のコード・テストが一致しているか
