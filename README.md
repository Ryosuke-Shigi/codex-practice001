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

このプロジェクトでは、AIを開発の主体にはしません。

人間が先に決めるもの:

- 何を作るか
- 入力
- 出力
- 成功条件
- 失敗条件
- 責務境界
- テスト観点
- 実装しないこと
- 完成判定
- 本番反映判断

ChatGPT は、仕様整理・設計整理・責務分離・テスト観点・CodexApp向け指示文作成・レビュー観点整理に使います。

CodexApp は、既存コード確認・差分作成・実装補助・テスト追加・README整理に使います。

AIの出力はそのまま採用せず、テスト・Pull Request・差分確認・責務レビューで人間が確認します。

AIを信用することと、任せて放置することは別です。  
このプロジェクトでは、テスト・CI・差分確認・責務レビューによって、AIの作業範囲を人間が制御します。

## Architecture

このポートフォリオは、ADR パターンとレイヤードアーキテクチャを基準にしています。

ここでの ADR は、Action-Domain-Responder の考え方を指します。

主な責務分離:

- Controller: HTTP入口
- Request: 入力バリデーション
- Action: 1ユースケースの手順
- Command Action: 登録・更新・削除・同期開始などの状態変更
- Query Action: 一覧・詳細・検索などの参照処理
- Service: 業務判断、同期方針、状態判断
- Repository: DB取得・保存、Eloquentクエリ、外部API通信の境界
- DTO / ListDTO: レイヤー間のデータ受け渡し
- Responder: Inertia props などの出力整形
- Factory: DTO生成、Strategy / Responder 選択
- Strategy: 処理差分、アルゴリズム差分
- Event / Listener: 発生した事実と副作用処理
- Component: 画面表示、UI状態、ユーザー操作

Controller に業務判断を書かず、Repository に出力整形を書かず、Service に HTTP 都合を混ぜない構成を基本にしています。

## Directory Structure

主な配置は次のとおりです。

```text
app/
├── Actions/
│   └── <Domain>/
│       ├── Commands/
│       └── Queries/
├── Services/
│   └── <Domain>/
├── Repositories/
│   └── <Domain>/
├── DTO/
│   └── <Domain>/
├── Responders/
│   └── <Domain>/
├── Factories/
│   └── <Domain>/
├── Strategies/
│   └── <Domain>/
├── Events/
├── Listeners/
└── Jobs/
```

Laravel標準領域:

```text
app/
└── Http/
    ├── Controllers/
    └── Requests/
```

フロントエンド側:

```text
resources/js/
├── Components/
├── Layouts/
├── Pages/
└── theme/
```

テスト:

```text
tests/
├── Feature/
└── Unit/
```

Docker構成側では、このリポジトリは `./src` としてマウントされ、コンテナ内では `/var/www/html` として扱われます。

## Testing

このプロジェクトでは、テストを単なる確認ではなく、AIが壊してはいけない仕様を固定するための安全柵として扱っています。

主に以下をテストで確認します。

- DTO / ListDTO の形
- Repository の取得条件・保存条件
- Service の判定
- Action の処理順序
- Job の実行結果
- Responder が渡す Inertia props
- 保存APIやメモ機能
- 地震データ取得・保存・ピン再生成
- 同期処理の結果集計
- ランキング表示条件
- display-card-window の表示仕様

テストはコードレビューの代替ではありません。

テストで確認できるのは主に「期待する仕様が壊れていないか」です。  
「責務分離が崩れていないか」「設計が汚れていないか」は、別途レビューで確認します。

基本コマンド:

```bash
docker compose run --rm artisan test
docker compose run --rm npm run test:run
docker compose run --rm npm run build
```

## CI/CD

このリポジトリでは、GitHub Actions で CI と Deploy を分けています。

CI workflow:

- Pull Request 時に実行
- main push 時に実行
- PHP 8.3 をセットアップ
- Node 22 をセットアップ
- `composer install`
- `npm ci`
- `npm run build`
- `.env.example` から `.env` を作成
- `php artisan key:generate`
- `php artisan test`
- `npm run test:run`

Deploy workflow:

- CI workflow 成功後のみ実行
- GitHub runner 上で Vite build を作成
- build済み assets を Lightsail へ転送
- Lightsail 上で `git pull --ff-only origin main`
- `php artisan optimize:clear`
- `queue` / `scheduler` / `php-fpm` を再起動

CIが失敗した場合、Deploy job は実行されません。

## Git / Review Flow

main への直接 push は行いません。

基本フロー:

1. main を最新化する
2. featureブランチを作成する
3. 実装する
4. テストを実行する
5. Pull Request を作成する
6. 差分を確認する
7. CI / status check を確認する
8. 問題がなければ main へ merge する

Pull Request では、少なくとも以下を確認します。

- 変更内容
- 変更理由
- 影響範囲
- テスト結果
- CI / status check
- docs / README / AGENTS.md 更新有無
- 秘密情報混入がないこと
- 責務境界に違反していないこと

## Documentation / Skills

README は外部向けの概要説明です。  
詳細資料はリポジトリ内の Markdown として管理し、コード変更と同じく Pull Request で差分確認できるようにしています。

- [AGENTS.md](AGENTS.md): CodexApp / AIエージェント向けの固定ルール
- [Architecture](docs/architecture.md): ADR / レイヤード構成と責務境界
- [Testing](docs/testing.md): テスト方針、優先順位、AI駆動開発でのテスト活用
- [Commenting](docs/commenting.md): 通常コメント、PHPDoc、JSDocの運用方針
- [Prototype Policy](docs/prototype-policy.md): プロトタイプの分離、削除、本番化ルール
- [No Alternative Implementation](skills/no-alternative-implementation/SKILL.md): 要件未達時に代替実装へ進まず停止・報告するためのSkill
