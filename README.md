# Laravel Portfolio - API Discovery Hub / QuakeWave Preview

Laravel 11 + Docker + Inertia + React + TypeScript で構築したポートフォリオアプリです。

このリポジトリでは、公開APIカタログを検索・保存・調査できる **API Discovery Hub** と、気象庁XMLを取得・保存・地図可視化する **QuakeWave Preview** を実装しています。

単に画面を作るだけではなく、外部データ取得、DBキャッシュ、差分同期、Queue / Scheduler、status API、DTO / ListDTO、Repository、Service、Action、Responder、Feature / Unit Test、CI/CD を組み合わせ、後から読める・直せる・説明できる構成を重視しています。

- 公開URL: https://ada-works.dev
- Repository: https://github.com/Ryosuke-Shigi/codex-practice001
- Backend: PHP 8.3, Laravel 11
- Frontend: Inertia, React 19, TypeScript, Vite, Tailwind CSS, motion
- Database / Queue: MySQL 8.0, Redis
- Infrastructure: Docker Compose, nginx, php-fpm, AWS Lightsail, Cloudflare
- Test: PHPUnit / Laravel Feature Test / Unit Test / Vitest
- CI/CD: GitHub Actions / CI成功後のみLightsailへDeploy

## このポートフォリオで見せたいこと

このポートフォリオは、AIにコードを丸投げして作ったアプリではありません。

人間が先に仕様・責務・境界・テスト観点を決め、ChatGPT / CodexApp を設計整理・実装補助・差分修正・レビュー補助として使っています。

重視している点は以下です。

- 外部データ取得をその場限りの処理にせず、DBキャッシュと差分同期で扱う
- Controller に業務処理を集めず、Action / Service / Repository / DTO / Responder に責務を分ける
- Queue / Scheduler を使い、重い同期処理を画面操作から分離する
- status API とポーリングで、非同期処理の進行状態を画面から確認できるようにする
- Feature / Unit Test で仕様・境界値・失敗時の状態を固定する
- GitHub Actions で `php artisan test` / `npm run test:run` / `npm run build` を実行する
- CI 成功後だけ Lightsail へデプロイする
- APIカタログと地震データという別ドメインに、同じ設計方針を適用する
- React 側でも背景描画・選択UI・個別オーブ・移動ロジック・候補定義を分け、UI演出を安全に追加・削除・差し替えできるようにする
- README / docs / AGENTS.md / Notion により、人間とAIが後から作業文脈を再起動できるようにする

## 実装済みドメイン

### API Discovery Hub

APIs.guru の `list.json` を取得し、公開APIカタログを検索・保存・調査できる機能です。

主な機能:

- APIs.guru `list.json` から公開APIカタログを取得
- `api_catalog_cache` への同期キャッシュ保存
- API の insert / update / skip の差分同期
- APIs.guru から消えた API を `is_active=false` として扱う同期処理
- `payload_hash` による変更検知
- API 一覧のキーワード検索
- provider / domain 絞り込み
- 更新日時・名称など、このアプリ内の指標による並び替え
- URL query による検索条件、並び順、ページ番号の保持
- API詳細画面でのキャッシュ済みメタ情報表示
- APIごとの調査メモ保存・更新・削除
- Google / GitHub / Docs / Sample 検索リンクの表示時生成
- Queue による手動同期開始
- Scheduler による定期同期 Job 投入
- API Preview による外部API疎通確認
- 外部APIに依存しないモック画面によるUI確認
- アイデアボードによる初見向け説明導線

API Discovery Hub では、外部APIの値をそのまま画面に出すのではなく、取得・変換・保存・表示用整形を分離しています。

### QuakeWave Preview

気象庁の地震火山情報 Atom feed と個別XMLを取得し、地震情報を保存・解析・地図表示する機能です。

主な機能:

- 気象庁の地震火山情報 Atom feed を取得
- 地震情報 entry の抽出
- `earthquake_feed_entries` への保存
- `entry_id` を基準にした insert / update / skip の差分同期
- 保存済み feed entry から個別 XML を取得
- 個別 XML から震源座標・最大震度・マグニチュード・深さを抽出
- 緯度・経度・最大震度があるデータだけを地図表示用 pin として保存
- 震度なしデータ・座標なしデータを map pin 化しない制御
- feed entry 取込と map pin 生成を分けた同期処理
- 1ボタン更新で feed entry 取込 → map pin 生成を順番に実行
- 同期ステータスの JSON API
- 同期ステータスのポーリング表示
- 水面上の日本地図と地震ピン表示
- 日付範囲、表示件数、震度フィルタ、詳細パネル折りたたみを含む地図UI
- アイデアボードによる初見向け説明導線

QuakeWave Preview では、Atom feed の取得、個別XML解析、地図表示用データ生成、画面表示を分離しています。

地震情報を防災用途として保証するものではなく、外部XMLデータの取得・解析・可視化を題材にしたポートフォリオ機能です。

## IDEA-BOARD / Lab 導線

`/lab` では、実装済み・構想中の機能を PROJECT / IDEA-BOARD / MOCK に分けて確認できます。

IDEA-BOARDカテゴリは、初見の人が短時間で「何を作ったか」「どこが工夫か」「本体画面はどこか」を理解するためのアイデアボードです。

Lab Index 表示順:

1. PROJECT
2. IDEA-BOARD
3. MOCK

IDEA-BOARD表示順:

1. API Discovery Hub
2. Japan Quake Wave Map
3. 工事発注管理・請求システム
4. Spec Flow Trainer

主なIDEA-BOARD導線:

- `/lab/api-discovery-hub-idea-board`: API Discovery Hub の紹介ページ
- `/lab/quake-wave-map-idea-board`: Japan Quake Wave Map の紹介ページ
- `/lab/construction-order-workflow-idea-board`: 工事発注管理・請求システムの構想説明
- `/lab/spec-flow-trainer`: Spec Flow Trainer の構想説明

IDEA-BOARDでは、DB取得・同期処理・外部API通信は行わず、静的な紹介ページとして本体機能への導線を担当します。

## Welcome / 背景エフェクト選択UI

`/` の Welcome 画面では、背景エフェクトを円形オーブで選択できます。

選択できるエフェクトは以下です。

- `water`: 明るい水面と波紋
- `caustics`: 水中の光の揺らぎ
- `cursorRipple`: カーソル反応を含む波紋表現
- `aquaParticles`: 水中の粒子・気泡のような浮遊表現
- `surfaceShimmer`: 水面のきらめき

`none` のような背景なし選択肢や、見た目の違いが分かりづらい `floatingLight` は候補から外しています。

このUIは単なる装飾ではなく、フロント側でも責務分離を確認するための実装です。

主な分離:

- `EffectLayer`: 選択された背景エフェクトを描画する
- `effectPatterns`: エフェクト候補、表示名、実コンポーネント、プレビュー情報を集約する
- `EffectPatternSelector`: 円形オーブ一覧と選択操作を管理する
- `EffectPatternOrb`: 1つのオーブの見た目、プレビュー、選択中状態を担当する
- `useBouncingOrbs`: オーブの座標、速度、画面端での跳ね返り処理を担当する
- `AquaParticlesBackground`: 水中粒子風のCSS-only背景エフェクトを担当する

背景描画、選択UI、個別オーブ、移動ロジック、候補定義を分けることで、エフェクトの追加・削除・差し替えをページ全体に広げずに行えるようにしています。

## 画面導線

短時間で確認する場合は、`/` → `/lab` → IDEA-BOARD → 本番機能の順で見ると全体像を追いやすいです。

- `/`: ポートフォリオ入口
- `/lab`: 実験・機能一覧
- `/lab/api-discovery-hub-idea-board`: API Discovery Hub 紹介ページ
- `/lab/quake-wave-map-idea-board`: Japan Quake Wave Map 紹介ページ
- `/api-preview`: 外部API確認用画面
- `/api-catalog`: API Discovery Hub の本番一覧
- `/api-catalog/{apiKey}`: API詳細・調査メモ画面
- `/api-catalog/mock`: APIカタログUI確認用モック
- `/quakewave-preview`: QuakeWave Preview 入口
- `/quakewave-preview/map`: 地震ピン地図表示
- `/quakewave-preview/xml`: 気象庁 Atom feed / 個別XML取得確認

補助的なルート:

- `/api-preview/apis-guru`
- `/api-preview/apis-guru/mock`
- `/api-preview/apis-guru/mock-error`
- `/api-catalog/sync`
- `/api-catalog/sync/status`
- `/api-catalog/{apiKey}/notes`
- `/quakewave-preview/feed-entries/sync`
- `/quakewave-preview/feed-entries/sync/status`
- `/quakewave-preview/map-pins/sync`
- `/quakewave-preview/map-pins/sync/status`
- `/quakewave-preview/refresh`
- `/quakewave-preview/refresh/status`

## スクリーンショット

### Welcome

<img width="975" height="959" alt="Welcome画面" src="https://github.com/user-attachments/assets/996061ae-cb83-49a7-b4af-ab0003a9d7df" />

### Lab

<img width="955" height="891" alt="Lab画面" src="https://github.com/user-attachments/assets/facd87a9-7f27-4f65-a5fe-c81d155ac4ac" />

### API Preview

<img width="961" height="961" alt="API Preview画面" src="https://github.com/user-attachments/assets/269f445f-b15c-4a44-be2b-cc395a656432" />

### API Discovery Hub - 一覧

<img width="955" height="957" alt="API Catalog一覧画面" src="https://github.com/user-attachments/assets/4b5a1f7f-f2f7-4600-9f67-306b6633b1a9" />

### API Discovery Hub - 詳細

<img width="955" height="953" alt="API Catalog詳細画面" src="https://github.com/user-attachments/assets/b7a93dbb-b29c-4fba-8b33-ff1b50d37645" />

### API Discovery Hub - モック

<img width="957" height="515" alt="API Catalogモック画面" src="https://github.com/user-attachments/assets/cef2175f-5788-47d5-911b-357312d7a4e1" />

## 設計方針

このポートフォリオは、ADR パターンとレイヤードアーキテクチャを基準にしています。
ここでの ADR は Action-Domain-Responder の考え方を指します。

主な責務分離:

- Controller: HTTP 入口
- Request: 入力バリデーション
- Action: 1ユースケースの手順
- Command: 登録・更新・削除・同期開始などの状態変更
- Query: 一覧・詳細・検索などの参照処理
- Service: 業務判断、同期方針、状態判断
- Repository: DB取得・保存、Eloquentクエリ、外部API通信の境界
- DTO / ListDTO: レイヤー間のデータ受け渡し
- Responder: Inertia props などの出力整形
- Factory: DTO生成、Strategy / Responder 選択
- Strategy: 処理差分、アルゴリズム差分
- Event / Listener: 発生した事実と副作用処理
- Component: 画面表示、UI状態、ユーザー操作

API Discovery Hub と QuakeWave Preview は異なるドメインですが、どちらも以下の流れで構成しています。

1. 外部データを取得する
2. DTO / ListDTO に変換する
3. Repository 経由でDBへ保存する
4. Service で差分同期や状態判断を扱う
5. Action でユースケースの手順を制御する
6. Responder で画面表示用データに整える
7. React / Inertia で表示する
8. Feature / Unit Test で仕様を固定する

フロントエンド側でも、画面を一枚の大きなコンポーネントにせず、表示責務・状態管理・選択UI・演出ロジックを分ける方針です。
Welcome の背景エフェクト選択UIでは、エフェクト候補、描画レイヤー、選択オーブ、移動ロジックを分け、見た目の試行錯誤をしてもページ全体へ影響が広がりにくい構成にしています。

設計方針の詳細は [docs/architecture.md](./docs/architecture.md) にまとめています。

## テスト方針

このプロジェクトでは、テストを単なる確認ではなく、AIが壊してはいけない仕様を固定するための安全柵として扱っています。

テストで守る主な対象:

- DTO / ListDTO の形
- Repository の取得条件・保存条件
- Service の判定
- Action の処理順序
- Job の実行結果
- Responder が渡す Inertia props
- 保存APIやメモ機能
- 地震データ取得・保存・ピン再生成
- IDEA-BOARDのルート・Inertia component・Lab表示順
- 同期処理の結果集計

テストはコードレビューの代替ではありません。

テストで確認できるのは主に「期待する仕様が壊れていないか」です。
「責務分離が崩れていないか」「設計が汚れていないか」は、別途レビューで確認します。

テスト方針の詳細は [docs/testing.md](./docs/testing.md) にまとめています。

### 主なテスト

API Discovery Hub:

- `tests/Feature/ApiCatalog/ApiCatalogSyncTest.php`
- `tests/Feature/ApiCatalog/ApiCatalogListSearchTest.php`
- `tests/Feature/ApiCatalog/ApiCatalogNoteTest.php`
- `tests/Feature/ApiPreviewTest.php`
- `tests/Unit/ApiCatalog/Services/ApiCatalogSyncServiceTest.php`
- `resources/js/Components/ApiCatalog/apiCatalogSearchLinks.test.ts`

QuakeWave Preview:

- `tests/Feature/QuakeWavePreview/QuakeWavePreviewFeedEntrySyncTest.php`
- `tests/Feature/QuakeWavePreview/QuakeWavePreviewXmlPreviewTest.php`
- `tests/Feature/QuakeWavePreview/EarthquakeFeedEntryRepositoryTest.php`
- `tests/Feature/QuakeWavePreview/EarthquakeMapPinRepositoryTest.php`
- `tests/Feature/QuakeWavePreview/EarthquakeMapRefreshActionTest.php`
- `tests/Feature/QuakeWavePreview/QuakeWavePreviewSyncStatusTest.php`
- `tests/Feature/QuakeWavePreview/QuakeWavePreviewMapRequestTest.php`

Lab / IDEA-BOARD:

- `tests/Feature/Lab/ApiDiscoveryHubPpTest.php`
- `tests/Feature/Lab/QuakeWaveMapPpTest.php`
- `tests/Feature/Lab/LabIndexTest.php`

テスト実行:

```bash
docker compose run --rm artisan test
docker compose run --rm npm run test:run
docker compose run --rm npm run build
```

## CI/CD

このリポジトリでは、GitHub Actions で CI と Deploy を分けています。

CI workflow:

- `.github/workflows/ci.yml`
- `pull_request` 時に実行
- `main` push 時に実行
- PHP 8.3 をセットアップ
- Node 22 をセットアップ
- `composer install`
- `npm ci`
- `npm run build`
- `.env.example` から `.env` を作成
- `php artisan key:generate`
- `php artisan test`
- `npm run test:run`

CIでは `.env.example` を元に testing 環境を作成し、Vite build 後に Laravel Feature / Unit Test と Vitest を実行します。
Inertia 画面系Featureテストは Vite manifest を必要とするため、CIでは Laravel テストより先に `npm run build` を実行します。

CI/CD確認時に発生した環境差のエラー対応は、Notionの「CI/CDエラー対応」に整理しています。

Deploy workflow:

- `.github/workflows/deploy.yml`
- CI workflow 成功後のみ実行
- GitHub runner 上で Vite build を作成
- build済み assets を Lightsail へ転送
- Lightsail 上で `git pull --ff-only origin main`
- `php artisan optimize:clear`
- `queue` / `scheduler` / `php-fpm` を再起動

CIが失敗した場合、Deploy job は実行されません。

これにより、テストが落ちた状態のコードを本番へ反映しない構成にしています。

## AI駆動開発の方針

このリポジトリでは、AI に仕様決定や完成判定を任せません。

- 人間が仕様、責務、境界、DB設計、テスト観点を先に決める
- ChatGPT は設計整理、責務分離の壁打ち、レビュー観点整理に使う
- CodexApp は既存コード確認、差分作成、実装補助、テスト追加、README整理に使う
- 最終判断、仕様確定、レビュー、本番反映判断は人間が行う

このプロジェクトでは、AI駆動開発を「AIに作らせること」ではなく、人間が仕様・責務・テスト・Git運用・CI/CDを制御したうえで、AIを実装補助として使う開発フローとして扱っています。

AIを信用することと、任せて放置することは別です。
このプロジェクトでは、テスト・CI・差分確認・責務レビューによって、AIの作業範囲を人間が制御します。

AIエージェント向けの固定ルールは [AGENTS.md](./AGENTS.md) にまとめています。

## 関連ドキュメント

- [AGENTS.md](./AGENTS.md): CodexApp / AIエージェント向けの作業ルール
- [docs/architecture.md](./docs/architecture.md): ADR / レイヤード構成と各レイヤーの責務境界
- [docs/testing.md](./docs/testing.md): テスト方針、優先順位、AI駆動開発でのテスト活用方針

README は外部の人間向けの概要説明です。
AGENTS.md は AIエージェント向けの固定ルールです。
architecture.md は設計思想と責務境界の説明です。
testing.md は仕様破壊検知とトークン消費削減のためのテスト方針です。

## データ保存方針

### API Discovery Hub

- `api_catalog_cache` は同期キャッシュ用テーブルとして扱う
- `raw_payload` は保存しない
- OpenAPI 定義本文、paths、schemas、parameters、responses は最初から保存しない
- Google / GitHub / Docs / Sample 検索リンクはDBに保存しない
- 検索リンクは表示時にAPI名・provider名などから生成する
- `domain` はDBカラムとして追加せず、`provider_key` から表示・絞り込み用に扱う
- APIメモは保存対象APIに紐づく調査メモとして扱う

### QuakeWave Preview

- 気象庁 Atom feed の entry は `earthquake_feed_entries` に保存する
- `entry_id` を一意な識別子として扱う
- 同じ `entry_id` のデータは insert / update / skip に分けて扱う
- 個別XML本文そのものは保存対象にせず、地図表示に必要な情報へ変換して扱う
- 地図表示用 pin は、個別XML解析後の結果として `earthquake_map_pins` に保存する
- feed entry 取込と map pin 生成は別処理として分ける

### IDEA-BOARD

- IDEA-BOARDは静的な紹介ページとして扱う
- DB取得、外部API通信、同期開始処理は持たせない
- 本体機能への導線と、技術的な見どころの説明を担当する
- Lab表示順は Feature Test で固定する

## Docker / ローカル開発

Docker 構成は Laravel アプリケーション本体の一階層上にあります。
このリポジトリは Docker Compose から `./src` としてマウントされ、コンテナ内では `/var/www/html` として扱われます。

Docker コマンドは、一階層上のプロジェクトルートで実行する前提です。

主な構成要素:

- `nginx`: Laravel の入口
- `php-fpm`: Laravel アプリ実行
- `php-cli`: PHP CLI 実行用
- `artisan`: `php artisan` 実行用
- `composer`: Composer 実行用
- `npm`: npm / Vite / Vitest 実行用
- `queue`: Queue worker
- `scheduler`: Laravel Scheduler
- `mysql`: APIカタログキャッシュ、保存メモ、地震情報のDB
- `redis`: Queue / Cache 用
- `minio`: ローカル開発用の S3 互換ストレージ
- `mailpit`: メール確認用
- `adminer`: DB確認用

ローカル開発の基本コマンド:

```bash
docker compose build
docker compose up -d nginx php-fpm queue scheduler mysql redis minio mailpit adminer
docker compose run --rm composer install
docker compose run --rm npm install
docker compose run --rm artisan migrate
docker compose run --rm artisan test
docker compose run --rm npm run test:run
docker compose run --rm npm run build
```

ローカルS3 / MinIO:

本番は AWS S3 を使い、ローカル開発では MinIO を S3 互換ストレージとして使います。
Laravel 側の保存処理は `Storage::disk('s3')` に統一し、接続先の違いは `.env` と Docker Compose で切り替えます。
MinIO は `make up` の全体起動に含めています。単体で起動・確認したい場合は次のコマンドを使います。

```bash
make minio-up
make minio-ps
make minio-logs
```

MinIO Console は http://localhost:9001 で確認できます。
ローカルの `src/.env` には次の値を設定し、Console で `local-bucket` を作成します。

```dotenv
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=minio
AWS_SECRET_ACCESS_KEY=minio_password
AWS_DEFAULT_REGION=ap-northeast-1
AWS_BUCKET=local-bucket
AWS_ENDPOINT=http://minio:9000
AWS_URL=http://localhost:9000/local-bucket
AWS_USE_PATH_STYLE_ENDPOINT=true
```

`.env` 変更後は `make app-clear` で Laravel の設定キャッシュをクリアします。
保存確認は Tinker で次を実行します。

```php
Storage::disk('s3')->put('test/hello.txt', 'hello minio');
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
- `tests/Unit`: Unit テスト
- `.github/workflows`: CI / Deploy workflow
- `docs`: 設計方針・テスト方針などの補助ドキュメント

## 注意事項

API Discovery Hub は公開APIを探す補助とAPI調査の入口を目的にした機能であり、API の価値や注目度を断定するものではありません。

QuakeWave Preview は気象庁XMLを利用した地震情報の取得・保存・地図可視化の検証機能であり、防災情報としての正確性や速報性を保証するものではありません。

この README は、現状の API Discovery Hub、QuakeWave Preview、IDEA-BOARD、テスト、CI/CD の実装範囲に合わせたポートフォリオ概要です。
