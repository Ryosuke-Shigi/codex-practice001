# Laravel Portfolio - codex-practice001

Laravel 11 + Docker + Inertia + React + TypeScript で構築しているポートフォリオアプリです。

公開URL: https://ada-works.dev

このリポジトリでは、AIに実装を丸投げせず、人間が仕様・責務・境界・テスト観点を決めたうえで、ChatGPT と CodexApp を使い分けながら開発しています。

## Projects

新しく作ったものを上に並べています。  
モック段階・構想段階のものは、この一覧には含めていません。

### DanceShortsRadar

YouTube Shorts のダンス動画を対象に、地域・比較日数・並び順を切り替えながら、伸びている動画を確認する機能です。

主な要素:

- YouTube Data API 連携
- 動画データ同期
- snapshot 保存
- ranking Query
- comparisonDays / sort
- selectedVideoId 基準の5枚 window
- Strategy / Factory によるランキング表示制御
- Repository / Service / Action / Strategy / Responder の責務分離
- Feature / Unit Test による仕様固定

この機能では、動画データの取得・保存・比較・ランキング表示を分離し、表示条件やランキング条件を後から変更しやすい構成にしています。

### Japan Quake Wave Map

気象庁の地震火山情報 Atom feed と個別XMLを取得し、地震情報を保存・解析・地図表示する機能です。

主な要素:

- 気象庁 Atom feed の取得
- feed entry 保存
- entry_id を基準にした insert / update / skip
- 個別XMLから震源座標・最大震度・マグニチュード・深さを抽出
- 緯度・経度・最大震度を持つデータのみ map pin 化
- 震度なしデータ・座標なしデータを map pin 化しない制御
- Job による同期処理
- status API
- Feature / Unit Test による仕様固定

### API Discovery Hub

APIs.guru の `list.json` を取得し、公開APIカタログを検索・保存・調査できる機能です。

主な要素:

- APIs.guru `list.json` の取得
- `api_catalog_cache` への同期キャッシュ保存
- insert / update / skip の差分同期
- `payload_hash` による変更検知
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

Laravel 側の保存処理は `Storage::disk('s3')` に統一し、接続先の違いは `.env` と Docker Compose で切り替えます。

ローカル用の設定例:

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

MinIO Console は以下で確認します。

```text
http://localhost:9001
```

`.env` 変更後は、Laravel の設定キャッシュをクリアします。

```bash
make app-clear
```

## AI Driven Development

このプロジェクトでは、AIを開発の主体にせず、人間が目的・入力・出力・制約・責務境界・テスト観点・完成判定を決めます。

- ChatGPT: 仕様整理、設計の壁打ち、責務分離、テスト観点、CodexApp向け指示整理
- CodexApp: 対象コードの調査、実装・修正、差分適用、テスト追加・実行
- 人間: 仕様確定、差分確認、完成判定、merge、本番反映判断

AIの出力は、テスト、Pull Request、CI、責務レビューを通して確認します。

## Architecture

Action - Domain - Responder のADR Patternと、Laravelのレイヤードアーキテクチャを基準にしています。

```text
Controller / Request
        ↓
Command Action / Query Action
        ↓
Service / Repository / DTO / Strategy
        ↓
Responder
        ↓
React / Inertia
```

Controllerへ業務判断、Repositoryへ表示判断、ServiceへHTTP都合を混ぜず、必要な責務だけを使用します。

詳細は [Architecture](docs/architecture.md) を参照してください。

## Testing

テストは、AIや人間が壊してはいけない仕様と責務境界を固定する実行可能な仕様として扱います。

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
docker compose run --rm artisan test
docker compose run --rm npm run test:run
docker compose run --rm npm run build
```

詳細は [Testing](docs/testing.md) を参照してください。

## CI/CD

Pull Requestとmainへのpushで、Laravel test、Vitest、frontend buildを実行します。

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

## Documentation / Skills

READMEは外部向けの概要です。内部の設計・テスト・AI運用ルールは、用途別のMarkdownへ分離しています。

- [AGENTS.md](AGENTS.md): 作業時に守る入口ルール
- [Documentation Index](docs/index.md): 用途別の正本と参照先
- [Development Flow](docs/development-flow.md): IDEA BOARDからPRODUCTまでの開発手順
- [Architecture](docs/architecture.md): ADR Patternとレイヤード責務
- [Testing](docs/testing.md): テスト方針と仕様固定
- [Frontend](docs/frontend.md): React / Inertia / TypeScriptの実装責務
- [UI](docs/ui.md): UI、Common、モバイル、Effects
- [Security](docs/security.md): 秘密情報、本番接続、破壊的操作
- [Context Management](docs/context-management.md): 文脈読込と理解再起動
- [docs/commenting.md](docs/commenting.md): 通常コメント・PHPDoc・JSDocの運用方針
- [Prototype Policy](docs/prototype-policy.md): MOCK / Prototypeの分離とProduct化
- [No Alternative Implementation](skills/no-alternative-implementation/SKILL.md): 要件未達時の停止条件
- [Coding Standards](docs/coding-standards.md): PHP / TypeScript / JavaScript / React / CSSの実装作法
