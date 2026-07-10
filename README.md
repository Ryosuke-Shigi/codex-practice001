# Laravel Portfolio - codex-practice001

Laravel 11 / Inertia / React / TypeScriptを中心に、外部API連携、非同期同期、分析UI、運用ログ、S3互換Storage、AI支援開発の運用までをまとめたポートフォリオです。

- 公開URL: https://ada-works.dev
- Project Hub: https://ada-works.dev/projects
- Docker / infrastructure: https://github.com/Ryosuke-Shigi/laravel11-docker

## このポートフォリオで示していること

このリポジトリは、画面だけを並べたデモではなく、構想、UI確認、本実装、検証、運用までを段階ごとに分けて追える実装例です。

- Laravel / React / Inertia / TypeScriptによるフルスタック実装
- Action - Domain - Responderを軸にしたレイヤード設計
- Controller / Request / Action / Service / Repository / DTO / Responder / Componentの責務分離
- YouTube Data API、APIs.guru、気象庁XMLを使った外部データ連携
- Queue / Scheduler / Job / Event / Listenerによる非同期処理と副作用の分離
- snapshot / read modelを使った、同期処理と参照画面の分離
- API連携ログ、エラーログ、運用通知による状態確認
- S3互換StorageをFeatureから切り離す共通Service / Repository / DTO境界
- Feature / Unit / React test、CI、Pull Request、docsによる仕様固定
- CodexなどのAI支援を利用しつつ、人間が仕様、責務境界、合格条件、merge判断を持つ開発プロセス

READMEは外部閲覧者向けの概要に絞り、詳細な仕様と作業ルールは用途別のdocsへ分離しています。

## 開発段階

構想と実装済み機能を混同しないため、次の段階を分けています。

| 段階 | 役割 |
|---|---|
| IDEA BOARD | 目的、価値、流れ、画面候補をお客様向けに説明する |
| MOCK | 固定データで画面、導線、操作感、状態表示を確認する |
| PROTOTYPE | 仮データや簡易通信で画面間の接続とデータの流れを検証する |
| PRODUCT | DB、API、Validation、権限、責務境界、テストを持つ本実装 |

MOCKやPROTOTYPEのコードを、そのままPRODUCT完成版として扱いません。確認できたUI契約や仕様を取り出し、PRODUCTでは責務境界に沿って実装し直します。

## Projects / Current Stage

公開画面ではProject Hubから、各ProjectのIDEA BOARD、MOCK、PRODUCTへ進めます。

| Project | 現在公開している段階 | 概要 |
|---|---|---|
| DanceShorts | PRODUCT / MOCK / IDEA BOARD | YouTube Shortsの候補収集、snapshot、地域別ランキング、比較分析 |
| API Discovery Hub | PRODUCT / MOCK / IDEA BOARD | 公開APIカタログの同期、検索、詳細、調査メモ |
| Japan Quake Wave Map | PRODUCT / MOCK / IDEA BOARD | 気象庁XMLの取得、保存、震源・震度・波紋の地図表示 |
| LumiLabo | MOCK / IDEA BOARD | 案件システムを最初のサブシステムとして育てる上位プロダクト |
| 工事発注管理 | MOCK / IDEA BOARD | 案件、作業カード、見積、請求、領収の画面検証 |
| イベント・カードカレンダー | IDEA BOARD | イベントを起点に入金・出金・請求カードを可視化する構想 |
| アプリログ | 運用機能 | API連携ログとエラーログの確認、対応済み管理 |

## PRODUCT実装

### DanceShorts

YouTube Shortsのダンス動画を保存・観測し、伸び方や地域別候補を確認するProjectです。

- **Radar**: 保存済みsnapshotから、地域別ランキング候補や上昇候補を表示
- **Analyzer**: 保存済み動画を検索し、選択したShortsのsnapshotを横比較
- YouTube Data API連携、動画保存、snapshot保存
- Queue / Schedulerによる通常同期、page2同期、snapshot専用同期
- ranking read modelとEChartsによる表示
- Strategy / Factory / Responderによるランキング条件と表示整形の分離
- Analyzerでは保存済みデータを使い、分析表示のためにYouTube APIを追加で呼ばない設計

### API Discovery Hub

APIs.guruの公開APIカタログを取得し、検索、詳細確認、調査メモ保存ができるProjectです。

- `list.json`の同期キャッシュ
- insert / update / skipの差分同期
- `payload_hash`による変更検知
- provider / domain / keyword検索
- APIごとの調査メモCRUD
- 同期開始、status polling、完了後の部分更新
- Repository / Service / DTO / Action / Responderの責務分離

### Japan Quake Wave Map

気象庁の地震火山情報Atom feedと個別XMLを取得し、保存済みの震源、震度、波紋を地図上で確認するProjectです。

- Atom feed取得、entry保存、個別XML解析
- 震源座標、最大震度、マグニチュード、深さの抽出
- 緯度、経度、最大震度を持つデータだけをmap pin化
- 座標なし、震度なし、XML取得失敗、XML解析失敗の扱いを分離
- feed entry同期とmap pin同期を別処理として管理
- Queue Jobを実行入口に寄せ、処理本体をCommand Action / Serviceへ分離
- 同期開始API、status API、polling、完了後のpartial reloadを責務別に整理

### Project Logs / アプリログ

アプリ内で保存したAPI連携ログとエラーログを確認するための機能です。

- API連携ログとエラーログを別テーブルで保存
- Event / Listener / Repositoryでログ保存の副作用を分離
- 成功ログを大量化させず、処理単位や分類ごとの要約ログへ集約
- エラーログの詳細表示と対応済み管理

## LumiLabo

LumiLaboは上位プロダクトとして扱い、最初のサブシステムとして案件システムを設計しています。現在公開しているのは **IDEA BOARD / MOCK** であり、PRODUCT完成済みの業務システムではありません。

### IDEA BOARD

案件システムの目的、価値、流れ、機能説明、画面候補、図解、グラフを、お客様向けの資料として整理しています。DB設計やBackend実装を確定する場所ではありません。

### MOCK

現在の主な導線は次のとおりです。

```text
TOP
  ↓ Start
選択
  ├ 案件 → 案件TOP
  │          ├ 登録 → 案件TOP
  │          └ 一覧 → 案件詳細 → 一覧
  └ TOPへ戻る → TOP
```

現在確認できる内容:

- 登録画面: 会社名、担当者名、住所、メモ
- 一覧画面: 固定データの案件カードから詳細へ進む導線
- 詳細画面: 編集、擬似保存完了表示、Google Maps検索、保存済み写真・ファイルの表示削除、案件削除確認
- モバイル縦、スマートフォン横を含むレスポンシブ表示
- 戻る先と削除後の戻り先を、MOCK内部のUI stateで管理

現在のMOCKは固定データとReact内stateだけを使います。DB、Migration、API通信、Inertia送信、本番CRUD、S3保存・削除、カメラ本実装、Google Maps APIはまだ実装していません。

詳細は [LumiLabo docs](docs/lumilabo/index.md) と [案件システム MOCK](docs/lumilabo/project-mock.md) を参照してください。

## IDEA BOARD / MOCK Projects

### 工事発注管理

案件、作業カード、見積、請求、領収の流れを、現場向けの入力体験として整理するProjectです。

現在はIDEA BOARD / MOCK段階です。固定データでCSV投入、案件詳細、帳票プレビューなどを確認しており、PRODUCT完成済みの業務システムとしては扱っていません。

### イベント・カードカレンダー

イベントを背景・生成元として扱い、入金、出金、請求カードをカレンダー、表、可視化へ広げる構想Projectです。

現在はIDEA BOARD段階です。DB保存、通知、本番集計、実グラフを持つPRODUCT実装ではありません。

## Cross-cutting Foundations

### S3-compatible Storage

Feature側が`Storage::disk('s3')`へ直接依存しないよう、アプリ共通のStorage境界を実装しています。

```text
Feature
  ↓
ApplicationFileStorageService
  ↓
FileStorageRepositoryInterface
  ↓
LaravelFileStorageRepository
  ↓
Laravel Storage / S3-compatible storage
```

主な内容:

- 保存結果を`StoredFileDTO`で受け渡す
- disk、prefix、visibility、path正規化をServiceへ集約
- visibilityは原則`private`
- ローカルMinIOとAWS S3向け環境を、同じLaravel disk名`s3`で切り替える
- 自動テストは`Storage::fake('s3')`を使い、実S3、実MinIO、外部ネットワークへ依存しない
- 保存、取得、存在確認、削除を確認するStorage smoke test Commandを用意

手動の疎通確認には、次のArtisan Commandを使います。

```bash
php artisan storage:smoke-test --disk=s3
```

この共通境界は実装済みですが、LumiLaboの写真・案件ファイル、DB紐付け、アップロードCRUDへはまだ接続していません。

詳細は [Storage](docs/storage.md) を参照してください。

### Operations / Notification

- Laravel Reverb / Broadcastingの設定とDocker service
- Daily Server Health Reportのメール通知
- Scheduler、Artisan Command、Command Action、Notification、Queueの責務分離
- API連携ログ、エラーログ、処理状態の確認

個別Broadcast EventやReactのリアルタイム通知UIが完成済みであるとは扱っていません。

### AI-assisted Development

AIは単発のコード生成ツールではなく、人間が目的、境界、合格条件を定義した後の調査、実装補助、差分修正、レビュー補助に使います。

```text
AGENTS.md
  ↓
作業種別に対応するMDルータープロファイル
  ↓
必要な共通docs / feature・project docs / 対象コード
  ↓
実装 → test / build / PR / Sensors → 修正 → 再確認
```

- `AGENTS.md`は短い作業入口と安全境界
- MDルーターは作業種別ごとに「読む / 条件付きで読む / 読まない」を固定
- IDEA BOARD / MOCK / PROTOTYPE / PRODUCTを分け、段階外の実装を持ち込まない
- 目的別branch、レビュー可能なcommit、PRレビュー強度、Sensorsで差分を確認
- コード、テスト、docs、指示が矛盾する場合は推測で実装しない
- 仕様、責務境界、完成判定、merge判断は人間が持つ

詳しい考え方は [設計思想ページ](https://ada-works.dev/design-philosophy)、[AGENTS.md](AGENTS.md)、[MD Router](docs/ai/workflows/md-router.md) を参照してください。

## Tech Stack

### Backend

- PHP 8.3
- Laravel 11
- Inertia Laravel
- MySQL 8
- Redis 7
- Laravel Queue / Scheduler / Notification
- Laravel Reverb
- Flysystem AWS S3 Adapter

### Frontend

- React 19
- TypeScript
- Inertia.js
- Vite
- Tailwind CSS
- ECharts
- Mermaid
- Vitest
- Motion
- lucide-react

### Infrastructure / CI

- Docker Compose
- nginx
- php-fpm
- queue / scheduler / Reverb services
- MinIO、Mailpit、Adminer（ローカル開発用）
- AWS Lightsail
- Cloudflare
- GitHub Actions

ローカル用のMinIO、Mailpit、Adminerは開発確認用であり、本番公開対象ではありません。

## Architecture / Design Policy

このプロジェクトでいうADR Patternは **Action - Domain - Responder** を意味します。Architecture Decision Recordと混同しないため、設計判断の記録はDecision Recordまたは設計判断記録と呼びます。

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

主な整理:

- ControllerはHTTP入口、Requestは入力形式のValidation
- Actionは1ユースケースの手順
- Serviceは業務判断とドメインルール
- RepositoryはDBや外部データソースとの境界
- DTO / ListDTOはレイヤー間のデータキャリア
- ResponderはInertia propsやJSONなどの出力整形
- Eventは発生した事実、Listenerは通知、ログ、外部連携などの副作用
- Job / Artisan Command / Schedulerは実行入口で、業務ロジック本体を持たない
- React Page / Hook / Componentは画面入口、UI状態、表示、操作を分担し、Backendの業務判断を再構築しない
- 単純な処理へ不要なService、Factory、Strategyを機械的に増やさない

詳細は [Architecture](docs/architecture.md)、[Responsibility Boundaries](docs/ai/rules/responsibility-boundaries.md)、[Frontend](docs/frontend.md)、[UI](docs/ui.md) を参照してください。

## Testing / CI / Review

テストは、壊してはいけない仕様と責務境界を固定する実行可能な資料として扱います。

- Laravel Feature / Unit test
- React utility / component test
- Request Validation、Action / Service / Repository / DTO / Responderの境界確認
- Inertia props / API JSON contractの確認
- Job / Artisan Command / Schedulerの実行境界
- `Storage::fake('s3')`によるStorage境界の確認
- TypeScript typecheckとfrontend build
- 差分に応じたPRレビュー強度とSensors確認

GitHub Actionsでは、PHP 8.3 / Node 22環境で、変更PHPファイルのPint check、frontend build、Laravel tests、Vitestを実行します。docs-only変更ではアプリテストを機械的に必須にせず、`git diff --check`、リンク、Markdown差分を中心に確認します。

詳細は [Testing](docs/testing.md)、[PR Review Strength](docs/operations/pr-review-strength.md)、[Sensors](docs/operations/sensors.md) を参照してください。

## Documentation

READMEは外部閲覧者向けの概要です。内部の作業ルール、機能固有仕様、確認コマンドは用途ごとの正本へ分離しています。

- [AGENTS.md](AGENTS.md): 全作業の短い入口と安全境界
- [MD Router](docs/ai/workflows/md-router.md): 作業種別ごとの参照範囲、停止条件、確認候補
- [Documentation Index](docs/index.md): docs全体の総合索引、用途別の正本、配置基準
- [Architecture](docs/architecture.md): ADR Patternとレイヤー責務
- [Testing](docs/testing.md): テスト方針
- [Development Flow](docs/development-flow.md): IDEA BOARD / MOCK / PROTOTYPE / PRODUCT
- [Product Design Guide](docs/product-design/index.md): IDEA BOARD / MOCK / Coding前の境界
- [Feature Docs](docs/features/): 機能固有仕様、UI契約、テスト固定内容
- [LumiLabo docs](docs/lumilabo/index.md): LumiLabo固有のIDEA BOARD / MOCK
- [Storage](docs/storage.md): S3互換Storageの共通境界
- [Feature Module Portability](docs/feature-module-portability.md): 別Laravelプロジェクトへの移植観点
- [Command Registry](docs/operations/command-registry.md): Docker経由の実行コマンドとrepo境界

同じ詳細をREADMEへ複製せず、現在挙動はコード、Migration、設定、成功しているテストで確認します。

## Local Development / Notes

Laravel / React / app docs / testsはこのリポジトリで管理し、Docker / nginx / php-fpm / MySQL / Redis / MinIO / queue / schedulerなどの外側構成は [laravel11-docker](https://github.com/Ryosuke-Shigi/laravel11-docker) で管理しています。

ローカル実行はDocker Composeを前提とし、具体的なコマンドとservice名は [Command Registry](docs/operations/command-registry.md) を参照してください。

README、docs、PR、ログには、本番`.env`、APIキー、DBパスワード、AWS credentials、token、cookie、session、個人情報を載せません。
