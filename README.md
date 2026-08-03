# codex-practice001

Laravel 11、Inertia、React、TypeScriptで構成したポートフォリオアプリケーションです。

外部APIを使うPRODUCT、固定データで画面と操作を確認するMOCK、構想と仕様を整理するIDEA BOARDを同じアプリ内で分けて公開しています。

## Links

- [公開サイト](https://ada-works.dev)
- [Project Select](https://ada-works.dev/projects)
- [設計思想](https://ada-works.dev/design-philosophy)
- [Docker / Infrastructure Repository](https://github.com/Ryosuke-Shigi/laravel11-docker)

## Repository Scope

このリポジトリには、Laravelアプリケーション本体、Reactフロントエンド、Migration、テスト、GitHub Actions、機能仕様と開発ルールを含めています。

Docker Compose、nginx、php-fpm、MySQL、Redisなどの開発・実行環境は、別リポジトリの `Ryosuke-Shigi/laravel11-docker` で管理しています。

## Projects

`/projects` では8つの選択肢を表示します。7つのProjectには合計17のStageがあり、アプリログはStageを持たない専用操作として分けています。

| Project | 公開Stage / 操作 | 現在の内容 |
|---|---|---|
| API Discovery Hub | PRODUCT / MOCK / IDEA BOARD | APIs.guruの公開APIカタログを同期・検索し、詳細確認と調査メモ管理を行う |
| DanceShortsRadar | PRODUCT / MOCK / IDEA BOARD | YouTube Shortsの候補収集、snapshot保存、地域別ランキングと上昇候補を表示する |
| DanceShortsAnalyzer | PRODUCT / MOCK / IDEA BOARD | 保存済み動画を検索・選択し、snapshotの推移と差分を比較する |
| Japan Quake Wave Map | PRODUCT / MOCK / IDEA BOARD | 気象庁XMLを取得・解析し、保存済みの震源・震度情報を地図表示する |
| LumiLabo | MOCK / IDEA BOARD | 案件システムの画面構成、一覧、詳細、写真・ファイル操作を固定データで確認する |
| 工事発注管理 | MOCK / IDEA BOARD | 案件、作業カード、見積・請求・領収の流れと画面を固定データで確認する |
| イベント・カードカレンダー | IDEA BOARD | イベントを生成元として、入金・出金・請求カードを扱う構想を整理する |
| アプリログ | 専用操作 | API連携ログとエラーログを表示し、エラーログの対応済み操作を行う |

## Development Stages

| Stage | 扱う内容 |
|---|---|
| IDEA BOARD | 目的、価値、業務の流れ、画面候補、未確定事項を整理する |
| MOCK | 固定データを使い、画面、導線、操作、状態表示を確認する |
| PROTOTYPE | 仮データや簡易的な接続を使い、画面間やデータの流れを確認する |
| PRODUCT | DB、外部API、Validation、責務境界、エラー処理、テストを持つ実装を扱う |

MOCKやPROTOTYPEのコードを、そのままPRODUCTの完成実装として扱いません。確認したUI契約や仕様を分離し、PRODUCTでは必要な責務とデータ境界を定めて実装します。

## PRODUCT / Operations

### API Discovery Hub

APIs.guruの `list.json` を取得し、公開APIカタログを保存・検索する機能です。

- APIカタログの同期
- insert / update / skipの差分判定
- `payload_hash` による変更検知
- keyword / provider / domain検索
- sort / pagination
- API詳細表示
- APIごとの調査メモCRUD
- 同期開始、状態確認、完了後の画面更新
- 外部API通信、DB操作、業務判断、出力整形の責務分離

Feature固有の仕様は [API Discovery Hub](docs/features/api-discovery-hub.md) に記載しています。

### DanceShortsRadar

YouTube Data APIからダンス系Shortsの候補を収集し、保存済みsnapshotを使ってランキングを表示する機能です。

- JP / US / KRの検索キーワード管理
- `search.list` / `videos.list` の取得境界
- 通常同期、page2同期、snapshot専用同期
- video / region / snapshotの保存
- JSTの12時間枠によるsnapshot管理
- normal / summary / risingのranking read model
- 比較期間と並び順を切り替えるStrategy / Factory
- read model生成失敗時に直前のactive世代を維持する処理
- Queue / Scheduler / Jobによる実行入口の分離

Feature固有の仕様は [DanceShortsRadar](docs/features/dance-shorts-radar.md) に記載しています。

### DanceShortsAnalyzer

DanceShortsRadarで保存した動画とsnapshotを使い、複数動画を横比較する機能です。

- 保存済み動画のkeyword検索
- 最大5件の動画選択
- 選択動画ごとのsnapshot推移表示
- 増加量と1時間あたり増加量の比較
- regionを混在させない分析グループ
- ECharts用optionのResponder生成
- 分析表示ではYouTube APIを追加で呼ばない
- 計算不能値を0へ丸めず `null` として扱う

Feature固有の仕様は [DanceShortsAnalyzer](docs/features/dance-shorts-analyzer.md) に記載しています。

### Japan Quake Wave Map

気象庁の地震火山情報Atom feedと個別XMLを取得し、地震情報を保存・解析・表示する機能です。

- Atom feedの取得とentry抽出
- `entry_id` による重複回避
- 個別XMLの取得と解析
- 震源座標、最大震度、マグニチュード、深さ、発生日時の抽出
- 緯度、経度、最大震度を持つデータだけをmap pin化
- 対象外、取得失敗、XML構文破損の分類
- feed処理とmap pin処理の状態分離
- 15分ごとのScheduler入口
- 同期状態を返すstatus API

Feature固有の仕様は [Japan Quake Wave Map](docs/features/japan-quake-wave-map.md) に記載しています。

### Application Logs

外部API連携とアプリケーションエラーをDBへ保存し、`/projects/logs` で確認する機能です。

- API連携ログとエラーログを別テーブルで保存
- Eventで発生事実を表現
- ListenerでDTOへ変換し、Repository経由で保存
- 同じ処理内で大量に発生するログの要約
- API連携タブとエラータブ
- エラーログの詳細表示
- エラーログの対応済み管理
- API key、token、response body全文を保存しない境界

Feature固有の仕様は [Application Logs](docs/features/application-logs.md) に記載しています。

## MOCK / IDEA BOARD

### LumiLabo

LumiLaboは上位Projectとして扱い、現在は案件システムのIDEA BOARDとMOCKを公開しています。

IDEA BOARDでは、案件システムの目的、業務の流れ、構造、画面候補を説明します。

MOCKでは、固定20件の案件データを初回のInertia propsとして渡し、その後の一覧操作と詳細操作をReact state内で行います。

- TOP、サブシステム選択、案件TOP
- 案件登録UI
- keyword検索、登録日順、pagination
- 案件一覧と案件詳細
- 会社名、担当者名、住所、メモの擬似保存
- 地図検索への外部リンク
- ブラウザカメラを使う連続撮影UI
- 写真とファイルのプレビュー・削除
- 案件削除と一覧への反映

現在のMOCKはDB、外部API、本番CRUD、S3保存へ接続していません。保存や削除はブラウザ内の状態として扱います。

詳細は [LumiLabo docs](docs/lumilabo/index.md) と [案件システム MOCK](docs/lumilabo/project-mock.md) に記載しています。

### 工事発注管理

案件、作業カード、見積、請求、領収の流れを整理するProjectです。

- IDEA BOARDによる業務と画面候補の整理
- 固定データを使うUI MOCK
- CSV投入画面
- 案件詳細
- 帳票プレビュー

現在はIDEA BOARD / MOCKであり、PRODUCTのDB、API、保存処理には接続していません。

### イベント・カードカレンダー

イベントを背景・生成元として扱い、入金、出金、請求カードをカレンダー、表、可視化へ展開する構想Projectです。

現在公開しているのはIDEA BOARDです。PRODUCTやMOCKの完成実装としては扱いません。

## Shared Foundations

### S3-compatible Storage

FeatureがLaravel Storageへ直接依存しないための共通境界を実装しています。

- Storage Service
- Storage Repository
- 保存結果DTO
- Laravel disk名 `s3` による接続先切替
- ローカルMinIOとAWS S3向け設定
- `Storage::fake('s3')` を使うテスト

この共通境界は実装済みですが、LumiLaboの写真・案件ファイル、DB紐付け、アップロードCRUDには接続していません。

詳細は [Storage](docs/storage.md) に記載しています。

### Queue / Scheduler / Notification / Reverb

外部データ同期や定期処理は、実行入口と処理本体を分けています。

- Queue Job
- Artisan Command
- Scheduler
- Notification
- Laravel Reverb / Broadcastingの基盤

個別のリアルタイム通知UIが完成済みであるとは扱いません。

### AI-assisted Development

AIは調査、実装補助、差分修正、レビュー補助に使用しています。

仕様、責務境界、合格条件、完成判定、merge判断は人間が持ちます。公開リポジトリ内の作業入口は [AGENTS.md](AGENTS.md)、設計と開発工程の説明は [設計思想ページ](https://ada-works.dev/design-philosophy) に記載しています。

## Architecture

このプロジェクトでいうADR Patternは、Action - Domain - Responderを指します。Architecture Decision Recordとは分けて扱います。

```text
Controller / Request
        ↓
Command Action / Query Action
        ↓
Service / Repository / DTO / Strategy / Factory
        ↓
Responder
        ↓
React / Inertia
```

主な責務は次のとおりです。

| 責務 | 扱う内容 |
|---|---|
| Controller | HTTP入口、Request・Action・Responderの接続 |
| Request | 入力形式と許可値のValidation |
| Action | 1ユースケースの処理手順 |
| Service | 業務判断、計算、状態遷移、処理結果の意味づけ |
| Repository | DBまたは外部データソースとの境界 |
| DTO / ListDTO | レイヤー間のデータ受け渡し |
| Strategy / Factory | 条件ごとの差分処理、実装や設定の選択 |
| Responder | Inertia props、JSON、redirectなどの出力整形 |
| Event / Listener | 発生した事実と保存・通知などの副作用の分離 |
| Job / Command / Scheduler | 非同期処理・定期処理の実行入口 |
| React Page / Hook / Component | 画面入口、UI状態、表示、操作の分担 |

すべての機能に全レイヤーを作るのではなく、変更理由を分ける必要がある責務だけを配置します。

詳細は [Architecture](docs/architecture.md) と [Responsibility Boundaries](docs/ai/rules/responsibility-boundaries.md) に記載しています。

## Technology

### Backend

- PHP 8.3
- Laravel 11
- Inertia Laravel 3
- MySQL
- Redis
- Laravel Queue / Scheduler / Notification
- Laravel Reverb
- Flysystem AWS S3 Adapter

### Frontend

- React 19
- TypeScript
- Inertia.js 2
- Vite 6
- Tailwind CSS 3
- ECharts 6
- Mermaid 11
- Motion 12
- Lucide React
- Vitest 4

### Infrastructure

- Docker Compose
- nginx
- php-fpm
- MySQL
- Redis
- Queue / Scheduler / Reverb services
- AWS Lightsail
- Cloudflare
- GitHub Actions

Docker構成の詳細は [laravel11-docker](https://github.com/Ryosuke-Shigi/laravel11-docker) に分離しています。

## Testing / CI

テストは、現在の仕様とレイヤー間の契約を固定するために使用しています。

- Laravel Feature test
- Laravel Unit test
- Request / Action / Service / Repository / DTO / Responderの境界確認
- Inertia props / API JSON contractの確認
- Job / Artisan Command / Schedulerの実行確認
- React component / utility test
- TypeScript typecheck
- frontend production build
- Pint format check
- `Storage::fake('s3')` によるStorage境界の確認

GitHub ActionsはPull Requestとmainへのpushで実行し、現在は次を確認します。

- 変更されたPHPファイルのPint check
- frontend production build
- Laravel tests
- Vitest

TypeScript typecheckはローカルの登録コマンドとして実行し、現在のGitHub Actionsには含めていません。

詳細は [Testing](docs/testing.md)、[PR Review Strength](docs/operations/pr-review-strength.md)、[Sensors](docs/operations/sensors.md) に記載しています。

## Documentation

READMEは外部閲覧者向けの概要です。機能固有の仕様、共通設計、テスト方針、AI作業ルールは用途ごとの文書へ分けています。

- [Documentation Index](docs/index.md)
- [Architecture](docs/architecture.md)
- [Development Flow](docs/development-flow.md)
- [Product Design Guide](docs/product-design/index.md)
- [Frontend](docs/frontend.md)
- [UI](docs/ui.md)
- [Testing](docs/testing.md)
- [Security](docs/security.md)
- [Storage](docs/storage.md)
- [API Discovery Hub](docs/features/api-discovery-hub.md)
- [DanceShortsRadar](docs/features/dance-shorts-radar.md)
- [DanceShortsAnalyzer](docs/features/dance-shorts-analyzer.md)
- [Japan Quake Wave Map](docs/features/japan-quake-wave-map.md)
- [Application Logs](docs/features/application-logs.md)
- [LumiLabo docs](docs/lumilabo/index.md)
