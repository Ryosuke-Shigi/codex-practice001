# Laravel Portfolio - codex-practice001

Laravel 11 + Docker + Inertia + React + TypeScript で構築しているポートフォリオアプリです。

公開URL: https://ada-works.dev

## このポートフォリオで証明していること

このリポジトリは、単にLaravelアプリを作るだけではなく、設計、テスト、Pull Request、CI、docs運用まで含めて、変更を安全に進める力を示すためのポートフォリオです。

- Laravel 11 / Inertia / React / TypeScript による実装力
- ADR Pattern とレイヤードアーキテクチャによる責務分離
- Feature / Unit Test による仕様固定
- Pull Request / CI / review による変更管理
- docs / tests / Pull Request による変更理由と責務境界の明文化
- 理解再起動性を意識した設計・テスト・ドキュメント運用
- [Feature Module移植ルール](docs/feature-module-portability.md) による別Laravelプロジェクトへの展開可能性

支援ツールの出力は完成品として扱わず、人間が仕様、責務境界、差分確認、完成判定、merge、本番反映判断を握ります。

## 最初に見る場所

| 見る場所 | 何を見るか |
|---|---|
| [公開URL](https://ada-works.dev) | 実際の入口とProject Select |
| [Projects](#projects) | 代表Featureと、それぞれが証明している設計要素 |
| [Development Discipline](#development-discipline) | 仕様、責務、テスト、レビューの進め方 |
| [Architecture](#architecture) | ADR Pattern と各レイヤーの責務 |
| [Testing](#testing) | Feature / Unit / React test で固定する仕様 |
| [Documentation](#documentation) | 作業用docs、文書ルーティング、作業ルール |

代表Featureとして、[DanceShortsRadar](#danceshortsradar)、[Japan Quake Wave Map](#japan-quake-wave-map)、[API Discovery Hub](#api-discovery-hub) を見ると、外部API連携、保存・同期、ランキング、地図表示、Queue / Scheduler、責務分離、テスト固定の見え方を確認できます。

## このリポジトリについて

開発では IDEA BOARD / MOCK / PROTOTYPE / PRODUCT の段階を分け、PRODUCT化ではUI契約・振る舞い・状態・導線を引き継ぎながら、Repository / Service / DTO / Responder / Test へ責務を分離します。

詳細な開発フローは [Development Flow](docs/development-flow.md)、文脈管理と理解再起動性は [Context Management](docs/context-management.md) を参照してください。

## Projects

既存TOPのSTARTから `/projects` の Project Select に入り、各Projectの `/projects/{projectId}` Project Hub で Stage / Module を確認します。Project Select / Project Hub は静的TypeScriptデータで管理し、DB/APIへ接続しません。現時点ではPROTOTYPEは未作成のため表示していません。

新しく作ったものを上に並べています。  
モック段階・構想段階のものは、この一覧には含めていません。

### DanceShortsRadar

YouTube Shorts のダンス動画を対象に、地域・比較日数・並び順を切り替えながら、伸びている動画を確認する機能です。

証明している設計要素:

- YouTube Data API 連携、動画データ同期、snapshot 保存
- ranking Query、comparisonDays / sort、selectedVideoId 基準の5枚 window
- Strategy / Factory によるランキング表示制御
- RISING の責務整理
- Repository / Service / Action / Strategy / Responder の責務分離
- Feature / Unit Test による仕様固定

この機能では、動画データの取得・保存・比較・ランキング表示を分離し、表示条件やランキング条件を後から変更しやすい構成にしています。

### Japan Quake Wave Map

気象庁の地震火山情報 Atom feed と個別XMLを取得し、地震情報を保存・解析・地図表示する機能です。

証明している設計要素:

- 気象庁 Atom feed の取得
- feed entry 保存、entry_id を基準にした insert / update / skip
- 個別XMLから震源座標・最大震度・マグニチュード・深さを抽出
- 緯度・経度・最大震度を持つデータのみ map pin 化
- 震度なしデータ・座標なしデータを map pin 化しない制御
- Job による同期処理
- status API
- Feature / Unit Test による仕様固定

### API Discovery Hub

APIs.guru の `list.json` を取得し、公開APIカタログを検索・保存・調査できる機能です。

証明している設計要素:

- APIs.guru `list.json` の取得
- `api_catalog_cache` への同期キャッシュ保存
- insert / update / skip の差分同期、`payload_hash` による変更検知
- API 一覧検索
- provider / domain 絞り込み
- API詳細表示
- APIごとの調査メモ保存・更新・削除
- Google / GitHub / Docs / Sample 検索リンクの表示時生成
- Queue / Scheduler による同期処理
- Repository / Service / DTO / Action / Responder の責務分離
- Feature / Unit Test による仕様固定

## Tech Stack

### Backend

- PHP 8.3
- Laravel 11
- Inertia Laravel
- MySQL 8.0
- Redis
- Laravel Queue
- Laravel Scheduler
- Flysystem AWS S3 Adapter

### Frontend

- Inertia.js
- React 19
- TypeScript
- Vite
- Tailwind CSS
- motion
- Vitest
- ECharts
- Mermaid

### Infrastructure / CI

- Docker Compose
- nginx
- php-fpm
- GitHub Actions
- AWS Lightsail
- Cloudflare

## Local Development Tools

ローカル開発環境では、開発・確認用に以下のコンテナや補助ツールを含めています。

- nginx
- php-fpm
- php-cli
- artisan
- composer
- npm container
- MySQL
- Redis
- MinIO
- Mailpit
- Adminer
- queue worker
- scheduler

用途:

- MinIO: ローカル開発用の S3 互換ストレージ
- Mailpit: メール送信確認
- Adminer: MySQL確認
- npm container: Vite / Vitest / frontend build
- queue worker: Laravel Job 実行
- scheduler: Laravel Scheduler 実行

MinIO / Mailpit / Adminer はローカル開発用です。  
本番環境では、Adminer / Mailpit / MySQL / Redis / MinIO を外部公開しません。

## Local S3 / MinIO

本番では AWS S3 を使い、ローカル開発では MinIO を S3 互換ストレージとして使います。

Laravel 側の保存処理は `Storage::disk('s3')` に統一し、接続先の違いは環境変数ファイルと Docker Compose で切り替えます。READMEには認証値や本番接続情報を載せません。

MinIO Console は以下で確認します。

```text
http://localhost:9001
```

設定変更後は、Laravel の設定キャッシュをクリアします。

```bash
make app-clear
```

## Development Discipline

このプロジェクトでは、目的・入力・出力・制約・責務境界・テスト観点・完成判定を先に明確にしてから変更します。

- 仕様、責務境界、完成判定、merge、本番反映判断は人間が握る
- 実装差分はテスト、Pull Request、CI、責務レビューを通して確認する
- docs、型、コメント、テストを、後から目的と変更理由を回収するための保守資産として扱う

変更時の文脈管理と理解再起動性は [Context Management](docs/context-management.md) に従います。

## Architecture

Action - Domain - Responder のADR Patternと、Laravelのレイヤードアーキテクチャを基準にしています。

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

各責務を混ぜないことを重視し、必要なレイヤーだけを使います。

| レイヤー | 責務 |
|---|---|
| Controller / Request | HTTP入口と入力形式の検証 |
| Action | 1ユースケースの手順 |
| Service | 業務判断・ドメインルール |
| Repository | DBまたは外部データソースとの境界 |
| DTO / ListDTO | レイヤー間のデータキャリア |
| Strategy / Factory | 処理差分の切り替え、生成、選択 |
| Responder | Inertia props、JSON等の出力整形 |
| React / Inertia | 表示、ユーザー操作、UI状態 |

Controllerへ業務判断、Repositoryへ表示判断、ServiceへHTTP都合、DTOへレスポンス生成を混ぜません。

詳細は [Architecture](docs/architecture.md) を参照してください。

## Feature Module Portability

Featureを別Laravelプロジェクトへ移植可能な単位として扱うため、[Feature Module移植ルール](docs/feature-module-portability.md) を分離しています。

- 移植モードを `full` / `product-only` / `mock-only` / `prototype-only` / `idea-board-only` に分ける
- `product-only` では Lab / MOCK / PROTOTYPE / IDEA BOARD をPRODUCT移植対象へ混ぜない
- route、config、provider、migration、seeder、tests、docs、queue、schedulerの差し替え点を確認する
- 「移植しやすい構成」と「そのままコピーで動く」は別として扱う

## Testing

テストは、開発者が壊してはいけない仕様と責務境界を固定する実行可能な仕様として扱います。

主な対象:

- Request validation
- DTO / ListDTO
- Serviceの業務判断
- Repositoryの取得・保存・外部API境界
- Action、Job、Artisan Command、Scheduler
- Responder / Inertia props
- React Utility / Component

基本コマンド:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan test
docker compose run --rm npm npm run test:run
docker compose run --rm npm npm run build
```

TypeScript / TSXを変更した場合は、必要に応じて手元確認として `docker compose run --rm npm npm run typecheck` を実行します。現時点ではCI必須ゲートではありません。

詳細は [Testing](docs/testing.md) と [Docker経由コマンド台帳](docs/operations/command-registry.md) を参照してください。

## CI/CD

Pull Requestとmainへのpushで、Laravel Pint check、frontend build、Laravel tests、Vitestを実行します。TypeScript typecheckは現時点ではCI必須ゲートではありません。

DeployはCI成功後にだけ実行され、build済みassetsをAWS Lightsailの公開環境へ反映します。CIが失敗した場合はDeployしません。

## Git / Review Flow

mainへ直接作業せず、目的別ブランチからPull Requestを作成します。

```text
目的・成功条件を固定
    ↓
実装・テスト・必要なdocs更新
    ↓
Pull Request
    ↓
差分・CI・責務・秘密情報を確認
    ↓
人間がmergeを判断
```

## Documentation

READMEは外部向けの概要です。内部の設計・テスト・作業ルールは、用途別のMarkdownへ分離しています。

- [AGENTS.md](AGENTS.md): 作業時に守る入口ルール
- [Documentation Index](docs/index.md): 用途別の正本と参照先
- [Workflow Docs](docs/ai/workflows/index.md): 作業種別ごとの参照範囲と停止条件
- [Docker Command Registry](docs/operations/command-registry.md): Docker経由コマンドとGit境界
- [Development Flow](docs/development-flow.md): IDEA BOARDからPRODUCTまでの開発手順
- [UI Development Flow](docs/ui-development-flow.md): MOCK / PROTOTYPE / PRODUCTのUI作成工程
- [Feature Docs](docs/features/): 機能固有仕様、UI契約、テスト固定内容
- [Architecture](docs/architecture.md): ADR Patternとレイヤード責務
- [Testing](docs/testing.md): テスト方針と仕様固定
- [Coding Standards](docs/coding-standards.md): PHP / TypeScript / JavaScript / React / CSSの実装作法
- [Frontend](docs/frontend.md): React / Inertia / TypeScriptの実装責務
- [UI](docs/ui.md): UI、Common、モバイル、Effects
- [Security](docs/security.md): 秘密情報、本番接続、破壊的操作
- [Context Management](docs/context-management.md): 文脈読込と理解再起動
- [Feature Module Portability](docs/feature-module-portability.md): Feature移植モードとPRODUCT移植対象
- [docs/commenting.md](docs/commenting.md): 通常コメント・PHPDoc・JSDocの運用方針
- [Prototype Policy](docs/prototype-policy.md): MOCK / Prototypeの分離とProduct化
- [PR Summary Template](docs/templates/pr-summary.md): Pull Request本文のレビュー用まとめ
