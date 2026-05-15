# Laravel Portfolio - API Discovery Hub / QuakeWave Preview

Laravel 11 + Docker + Inertia + React + TypeScript で構築したポートフォリオアプリです。

このリポジトリでは、AI駆動開発・仕様駆動開発を前提に、人間が仕様・責務・設計境界・レビュー観点を決め、ChatGPT / CodexApp を設計整理・実装補助・差分修正・レビュー補助として利用しています。

現在は、公開APIカタログを検索・保存・調査できる `API Discovery Hub` と、気象庁XMLを取得・保存・地図可視化する `QuakeWave Preview` を実装しています。

- 公開URL: https://ada-works.dev
- 技術スタック: Laravel 11, Docker, Inertia, React, TypeScript, MySQL, Redis
- 設計方針: ADRパターン、レイヤードアーキテクチャ、DTO / ListDTO、Repository、Service、Action、Responder、Queue
- 開発方針: AI丸投げではなく、人間が仕様・責務・境界を決め、AIを補助として使う

## 関連ドキュメント

このプロジェクトでは、README とは別に、AIエージェント向けルール・設計方針・テスト方針を Markdown として管理しています。

- [AGENTS.md](./AGENTS.md): CodexApp / AIエージェントが毎回参照する作業ルール
- [docs/architecture.md](./docs/architecture.md): ADR / レイヤード構成と各レイヤーの責務境界
- [docs/testing.md](./docs/testing.md): テスト方針、優先順位、AI駆動開発でのテスト活用方針

README は外部の人間向けの概要説明です。
AGENTS.md は AIエージェント向けの固定ルールです。
architecture.md は設計思想と責務境界の説明です。
testing.md は仕様破壊検知とトークン消費削減のためのテスト方針です。

## プロジェクト概要

このポートフォリオは、外部データの取得・変換・保存・表示を題材に、Laravel アプリケーションを ADR / レイヤード構成で整理することを目的としています。

実装済みの主な機能は以下です。

- `API Discovery Hub`: APIs.guru の公開APIカタログを取得し、検索・絞り込み・詳細確認・調査メモ保存を行う
- `QuakeWave Preview`: 気象庁XMLを取得し、地震情報 entry の保存、個別XML解析、地図表示用 pin 生成を行う

どちらも、外部データ取得、DTO化、DB保存、差分同期、画面表示用データ生成という流れを持ちます。
異なるドメインでも同じ設計方針を適用できることを示すため、Action / Service / Repository / DTO / Responder などの責務を分離しています。

このポートフォリオは AWS Lightsail で外部公開し、Cloudflare で取得した正式ドメイン `https://ada-works.dev` を導入済みです。

## 公開URL

- https://ada-works.dev

ローカル確認 URL は次のとおりです。

- Laravel: http://localhost:8080
- Vite: http://localhost:5173
- Mailpit: http://localhost:8025
- Adminer: http://localhost:8081

## 主な機能

### API Discovery Hub

- APIs.guru `list.json` から公開APIカタログを取得
- `api_catalog_cache` への同期キャッシュ保存
- APIs.guru から消えた API を `is_active=false` として扱う差分同期
- API 一覧のキーワード検索、provider 絞り込み、domain 絞り込み
- 更新日時や名称など、このアプリ内の指標による並び替え
- URL query による検索条件、並び順、ページ番号の保持
- API 詳細でのキャッシュ済みメタ情報表示
- Google 検索リンクの表示時生成
- API ごとの調査メモ保存、更新、削除
- Queue による手動同期開始
- Scheduler による定期同期 Job 投入
- API Preview での外部 API 疎通確認
- モック画面での UI 確認

### QuakeWave Preview

- 気象庁の地震火山情報 Atom feed を取得
- 地震情報 entry の抽出
- `earthquake_feed_entries` への保存
- entry_id を基準にした insert / update / skip の差分同期
- 保存済み feed entry から個別 XML を取得
- 個別 XML から震源座標・最大震度・マグニチュード・深さを抽出
- 地図表示用 pin の生成・保存
- Queue による地震 feed 取込と map pin 生成
- 同期ステータスのポーリング表示
- 水面上に日本地図と地震ピンを表示する UI モック

同期失敗ログや同期履歴表示としての整理は、今後追加予定です。

## 画面導線とスクリーンショット

短時間で見る場合は、まず `/` から全体の入口を確認し、次に `/lab` から実験画面と本番画面の関係を見ると流れを追いやすいです。

- `/`: ポートフォリオ入口。アプリ全体の起点として見る画面です。

<img width="975" height="959" alt="Welcome画面" src="https://github.com/user-attachments/assets/996061ae-cb83-49a7-b4af-ab0003a9d7df" />

- `/lab`: 実験・機能一覧。API Preview、API Discovery Hub、QuakeWave Preview への導線をまとめています。

<img width="955" height="891" alt="Lab画面" src="https://github.com/user-attachments/assets/facd87a9-7f27-4f65-a5fe-c81d155ac4ac" />

- `/api-preview`: 外部API確認用画面。APIs.guru の実取得、成功モック、エラーモックの入口です。

<img width="961" height="961" alt="API Preview画面" src="https://github.com/user-attachments/assets/269f445f-b15c-4a44-be2b-cc395a656432" />

- `/api-catalog`: API Discovery Hub の本番一覧。公開APIカタログの検索、絞り込み、並び替え、同期開始を確認できます。

<img width="955" height="957" alt="API Catalog一覧画面" src="https://github.com/user-attachments/assets/4b5a1f7f-f2f7-4600-9f67-306b6633b1a9" />

- `/api-catalog/{apiKey}`: API詳細。提供元、preferred version、OpenAPI URL、更新日時、調査メモの保存・更新・削除を確認できます。

<img width="955" height="953" alt="API Catalog詳細画面" src="https://github.com/user-attachments/assets/b7a93dbb-b29c-4fba-8b33-ff1b50d37645" />

- `/api-catalog/mock`: UI確認用モック一覧。外部APIや同期キャッシュに依存せず、一覧UIの見た目と導線を確認できます。

<img width="957" height="515" alt="API Catalogモック画面" src="https://github.com/user-attachments/assets/cef2175f-5788-47d5-911b-357312d7a4e1" />

- `/quakewave-preview`: 気象庁XMLの取得・保存・地図表示用データ生成を確認する地震波可視化プレビュー画面です。
- `/quakewave-preview/map`: 水面上の日本地図と地震ピン表示を確認する画面です。
- `/quakewave-preview/xml`: 気象庁 Atom feed と個別 XML の取得・解析を確認する画面です。

補助的なルートとして、`/api-preview/apis-guru`、`/api-preview/apis-guru/mock`、`/api-preview/apis-guru/mock-error`、`/api-catalog/sync`、`/api-catalog/sync/status`、`/api-catalog/mock/{apiKey}`、`/api-catalog/{apiKey}/notes`、`/quakewave-preview/feed-entries/sync`、`/quakewave-preview/feed-entries/sync/status`、`/quakewave-preview/map-pins/sync`、`/quakewave-preview/map-pins/sync/status` があります。

## 技術スタック

- Backend: PHP 8.3, Laravel 11
- Frontend: Inertia, React 19, TypeScript, Vite, Tailwind CSS, motion
- Database / Queue: MySQL 8.0, Redis
- Infrastructure: Docker Compose, nginx, php-fpm, AWS Lightsail
- Development tools: Composer, npm, PHPUnit, Laravel Pint, Mailpit, Adminer

## 設計方針

このポートフォリオは、ADR パターンとレイヤードアーキテクチャを基準にしています。
ここでの ADR は Action-Domain-Responder の考え方を指します。

より詳しい責務境界は [docs/architecture.md](./docs/architecture.md) にまとめています。

主な責務分離は以下です。

- Controller は HTTP 入口に限定する
- Request は入力バリデーションに限定する
- Action は 1 ユースケースの手順を担当する
- Command は登録、更新、削除、同期開始など状態変更を扱う
- Query は一覧、詳細、検索など状態を変えない取得を扱う
- Service は同期時の業務ルールや状態判断を担当する
- Repository は DB 取得・保存、Eloquent クエリ、外部 API 通信の境界を担当する
- DTO / ListDTO はレイヤー間のデータ受け渡しに使う
- DTO / ListDTO の `toArray()` は配列変換までに限定する
- Responder は Inertia props など出力形式の整形を担当する
- Factory は DTO 生成や Strategy / Responder 選択を担当する
- Strategy は処理差分やアルゴリズム差分を担当する
- Event / Listener は発生した事実と、その後の副作用を分けて扱う

API Preview と API Discovery Hub 本体は分離しています。
Preview 側の Repository / DTO / Responder は、本体側に流用しない方針です。

QuakeWave Preview でも同じ設計思想を使い、外部データ取得、XML解析、DB保存、画面表示用データ生成を分離しています。
これにより、異なるドメインでも ADR パターン・レイヤードアーキテクチャを再利用できることを示しています。

## 設計判断

### Queue を使う理由

外部データの取得・同期処理をバックグラウンドで実行し、ユーザーの閲覧体験を妨げないために使用しています。

### DB にキャッシュする理由

外部データをその場で毎回取得するのではなく、取得済みデータを DB に保持し、一覧表示・検索・過去情報の参照に利用できるようにするためです。

### 差分判定を行う理由

外部データを無条件に保存し続けるとデータ量が増えすぎるため、変更がある場合のみ更新・追加する構成にしています。

### 同じ設計思想で複数機能を作る理由

API Discovery Hub と QuakeWave Preview は異なるドメインですが、外部データ取得、変換、保存、表示という流れは共通しています。

同じ ADR パターン・レイヤードアーキテクチャを使うことで、設計が場当たりではなく、別ドメインにも再利用可能であることを示しています。

## AI駆動開発の方針

このリポジトリでは、AI に仕様決定や完成判定を任せません。

- 人間が仕様、責務、境界、DB 設計、テスト観点を先に決める
- ChatGPT は設計整理、責務分離の壁打ち、レビュー観点整理に使う
- CodexApp は既存コード確認、差分作成、実装補助、README 整理に使う
- 最終判断、仕様確定、レビュー、本番反映判断は人間が行う

「AIが自律的に作ったアプリ」ではなく、「人間が設計判断を持ち、AIを補助として使った開発ポートフォリオ」として扱っています。

AIエージェント向けの固定ルールは [AGENTS.md](./AGENTS.md) にまとめています。

## テスト方針

テスト方針の詳細は [docs/testing.md](./docs/testing.md) にまとめています。

このプロジェクトでは、テストを以下の目的で扱います。

- 既存仕様の破壊を検知する
- CodexApp / AIエージェントへの説明量を減らす
- 失敗したテスト結果を起点に、修正対象と影響範囲を絞る
- ADR / レイヤード構成の責務境界を固定しやすくする

テストはコードレビューの代替ではありません。
テストで確認できるのは主に「期待する仕様が壊れていないか」です。
責務分離が崩れていないか、設計が汚れていないかは、別途レビューで確認します。

実装済みの Feature テストでは、API Discovery Hub、API Preview、QuakeWave Preview の主要導線を確認しています。

- `ApiCatalogSyncTest`: 同期 Job の Queue 投入、同期開始レスポンス、return_url の制限、同期ステータス、失敗状態の扱いを確認
- `ApiCatalogNoteTest`: API詳細表示 props、保存メモの保存・更新・削除、別APIメモの更新防止、モック詳細で保存しないことを確認
- `ApiPreviewTest`: API Preview 一覧、APIs.guru の実取得時 props、エラーレスポンス時 props、成功モック、エラー確認用モックを確認
- `QuakeWavePreviewFeedEntrySyncTest`: 気象庁 Atom feed の取得、地震情報 entry の抽出、DB保存、insert / update / skip、Queue 投入、同期ステータス、失敗状態を確認
- `QuakeWavePreviewXmlPreviewTest`: 気象庁XML取得プレビューと、XML解析結果の表示導線を確認

外部API取得では、成功レスポンスだけでなく、失敗レスポンスや固定エラー表示の確認導線も用意しています。
外部通信に依存しないモック画面により、UI とエラー表示を切り分けて確認できます。

テスト実行コマンド:

```bash
docker compose run --rm artisan test
docker compose run --rm npm run build
```

## データ保存方針

### API Discovery Hub

- `api_catalog_cache` は同期キャッシュ用テーブルとして扱う
- `raw_payload` は保存しない
- OpenAPI 定義本文、paths、schemas、parameters、responses は最初から保存しない
- Google 検索リンクは DB に保存しない
- Google 検索リンクは表示時に API 名などから生成する
- `domain` は DB カラムとして追加せず、`provider_key` から表示・絞り込み用に扱う
- softDeletes は使わない

### QuakeWave Preview

- 気象庁 Atom feed の entry は `earthquake_feed_entries` に保存する
- entry_id を一意な識別子として扱う
- 同じ entry_id のデータは insert / update / skip に分けて扱う
- 個別 XML の本文そのものは保存対象にせず、地図表示に必要な情報へ変換して扱う
- 地図表示用 pin は、個別 XML 解析後の結果として保存する
- feed entry 取込と map pin 生成は別処理として分ける

## Docker構成

Docker 構成は Laravel アプリケーション本体の一階層上にあります。
このリポジトリは Docker Compose から `./src` としてマウントされ、コンテナ内では `/var/www/html` として扱われます。

Docker コマンドは、一階層上のプロジェクトルートで実行する前提です。

主な構成要素:

- `nginx`: Laravel の入口
- `php-fpm`: Laravel アプリ実行
- `php-cli`: PHP CLI 実行用
- `artisan`: `php artisan` 実行用
- `composer`: Composer 実行用
- `npm`: npm / Vite 実行用
- `queue`: Queue worker
- `scheduler`: Laravel Scheduler
- `mysql`: API カタログキャッシュ、保存メモ、地震情報の DB
- `redis`: Queue / Cache 用
- `mailpit`: メール確認用
- `adminer`: DB確認用

ローカル開発の基本コマンド:

```bash
docker compose build
docker compose up -d nginx php-fpm queue scheduler mysql redis mailpit adminer
docker compose run --rm composer install
docker compose run --rm npm install
docker compose run --rm artisan migrate
docker compose run --rm npm run build
```

同期処理の手動確認:

```bash
docker compose run --rm artisan api-catalog:sync
docker compose run --rm artisan api-catalog:sync --queue
```

## ディレクトリ構成

主な配置は次のとおりです。

- `app/Http/Controllers`: HTTP 入口
- `app/Http/Requests`: 入力バリデーション
- `app/Actions`: ユースケース手順
- `app/Services`: 業務ルール、状態判断
- `app/Repositories`: DB / 外部API境界
- `app/DTO`: レイヤー間データ
- `app/Responders`: Inertia props などの出力整形
- `app/Factories`: DTO や Strategy などの生成・選択
- `app/Strategies`: 処理差分
- `app/Events`, `app/Jobs`: 副作用や非同期処理
- `resources/js/Pages`: Inertia / React の画面
- `resources/js/Components`: React コンポーネント
- `routes/web.php`: 画面ルート
- `tests/Feature`: Feature テスト
- `docs`: 設計方針・テスト方針などの補助ドキュメント

## 今後予定

- 同期履歴表示と同期失敗ログ
- ポーリングなどによる同期状態表示の改善
- 詳細画面を開いたタイミングで OpenAPI 定義本文を取得する別導線
- paths、schemas、parameters、responses の扱い方の検討
- 保存メモ周辺の表示・入力体験の改善
- API Discovery Hub 一覧・詳細の追加テスト
- QuakeWave Preview のスクリーンショット追加
- 気象庁XML解析範囲の整理
- Service / Action / Repository の Unit テスト拡充
- Factory / Strategy の使いどころの検証
- Lightsail 運用手順の整理

## 注意事項

この README は、現在実装済みの範囲に合わせています。

API Discovery Hub は公開APIを探す補助とAPI調査の入口を目的にした機能であり、API の価値や注目度を断定するものではありません。

QuakeWave Preview は気象庁XMLを利用した地震情報の取得・保存・地図可視化の検証機能であり、防災情報としての正確性や速報性を保証するものではありません。
