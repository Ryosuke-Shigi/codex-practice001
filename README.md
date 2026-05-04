# codex-practice001

このリポジトリは、Laravel + Docker を前提に、CodexApp・ChatGPT・VS Code を使った AI 駆動／仕様駆動開発を練習・検証するためのポートフォリオ用プロジェクトです。

現時点では Laravel 11 の初期構成をベースに、Inertia / React の公開画面、API Preview、API Discovery Hub のモック画面、APIs.guru 連携確認、API カタログ同期キャッシュの検証実装を段階的に追加しています。

## 1. プロジェクト概要

Laravel アプリケーション本体はこの `src` ディレクトリで Git 管理しています。

Docker 関連ファイルは、ローカル開発環境として一階層上のプロジェクトルートに配置しています。現在確認できている Docker 構成は `docker-compose.yml`、`docker/nginx/default.conf`、`docker/php/Dockerfile`、`docker/php/php.ini`、`docker/mysql/my.cnf`、`docker/node/Dockerfile` です。

現在のアプリケーションは Inertia / React を使った公開画面を持ちます。`GET /` はポートフォリオ入口、`GET /lab` は実験画面一覧、`GET /api-preview` は外部 API 確認用の入口、`GET /api-catalog/mock` は API Discovery Hub 本体一覧のモック画面です。

本番用の API Discovery Hub 一覧はまだ未実装です。現在の一覧画面は DB 接続前に UI と操作感を確認するためのモックであり、Repository / Query Action / Responder には接続していません。

## 2. このプロジェクトの目的

このプロジェクトの目的は、AI に実装を丸投げするのではなく、人間が仕様・責務・制約・テスト観点を整理したうえで、AI ツールを開発補助として使う流れを練習することです。

主な検証対象は次のとおりです。

- Laravel 11 と Docker を使ったローカル開発環境
- CodexApp を使った既存コード確認、差分作成、実装補助
- ChatGPT を使った仕様整理、設計整理、レビュー観点整理
- VS Code を使ったコード確認と人間による最終判断
- ADR パターンとレイヤードアーキテクチャの段階的な導入
- Git / GitHub を使った変更管理

## 3. 使用技術

現在確認できている使用技術は次のとおりです。

- PHP: Docker イメージは PHP 8.3 系
- Laravel: `laravel/framework` `^11.31`
- Composer
- MySQL: 8.0 系
- Redis: 7 系 Alpine イメージ
- nginx: stable Alpine イメージ
- Node.js: LTS 系 Docker イメージ
- Vite: `^6.0.11`
- Inertia React: `^2.0.0`
- React: `^19.0.0`
- Tailwind CSS: `^3.4.13`
- motion: `^12.0.0`
- Axios: `^1.7.4`
- PHPUnit: `^11.0.1`
- Laravel Pint
- Mailpit
- Adminer
- Docker Compose

## 4. Docker 構成

Docker 構成はアプリケーション本体の一階層上にあります。Laravel アプリケーションは Docker Compose から `./src` としてマウントされ、コンテナ内では `/var/www/html` として扱われます。

現在確認できているサービスは次のとおりです。

- `nginx`: Web サーバー。ホスト側 `8080` で公開
- `php-fpm`: nginx から受ける Web 実行用 PHP
- `php-cli`: PHP CLI 実行用
- `artisan`: `php artisan` 実行用
- `composer`: Composer 実行用
- `npm`: npm / Vite 実行用。Vite はホスト側 `5173` を使用
- `mysql`: Laravel 用 DB。コンテナ内は `mysql:3306`、ホスト側は `127.0.0.1:3307`
- `redis`: cache / queue 用
- `mailpit`: SMTP は `mailpit:1025`、Web UI は `http://localhost:8025`
- `adminer`: DB 確認用。Web UI は `http://localhost:8081`
- `queue-worker`: Queue 練習用。`worker` profile で起動
- `scheduler`: Scheduler 練習用。`scheduler` profile で起動

基本コマンドはプロジェクトルートで実行します。

```bash
docker compose up -d nginx php-fpm mysql redis mailpit adminer
docker compose run --rm artisan migrate
docker compose run --rm composer install
docker compose run --rm npm install
```

## 5. 現在の画面とルート

現在確認用に用意している主な画面は次のとおりです。

- `GET /`: ポートフォリオ入口。水面などの背景エフェクトを切り替えられる公開画面
- `GET /lab`: 実験画面一覧。API Preview などの検証画面への入口
- `GET /api-preview`: 外部 API の疎通確認画面。API Discovery Hub 本体画面モックの入口枠も配置
- `GET /api-preview/apis-guru`: APIs.guru `list.json` の実取得確認画面
- `GET /api-preview/apis-guru/mock`: APIs.guru 成功レスポンスの固定データ確認画面
- `GET /api-preview/apis-guru/mock-error`: APIs.guru エラーレスポンスの固定データ確認画面
- `GET /api-catalog/mock`: API Discovery Hub 本体の API 一覧モック画面

`/api-catalog/mock` では、固定配列のモックデータを使い、次の操作を確認できます。

- キーワード検索
- `providerKey` 絞り込み
- `domain` 絞り込み
- 条件クリア
- 1ページ6件のカード表示
- 左右ボタンと `ArrowLeft` / `ArrowRight` によるページ送り
- `Search` クリックによる Google 検索
- `/api-preview` へ戻るボタン

各 API カードでは、一覧確認に必要な情報だけを表示します。`apiKey`、`openapiVersion`、`sourceLatestUpdatedAt` はモックデータ内には持ちますが、カード上には表示しません。Google 検索 URL は DB 保存前提ではなく、React 側で `title` または `apiKey` から生成します。

## 6. ディレクトリ構成

現在確認できている主な Laravel 側の構成です。

```text
src/
├── app/
│   ├── Actions/
│   │   ├── ApiCatalog/
│   │   └── ApiPreview/
│   ├── Console/
│   │   └── Commands/
│   ├── DTO/
│   │   ├── ApiCatalog/
│   │   └── ApiPreview/
│   ├── Factories/
│   ├── Http/
│   │   └── Controllers/
│   ├── Jobs/
│   ├── Models/
│   ├── Repositories/
│   ├── Responders/
│   ├── Services/
│   └── Providers/
├── bootstrap/
├── config/
├── database/
│   └── migrations/
├── public/
├── resources/
│   ├── css/
│   └── js/
│       ├── Components/
│       ├── Layouts/
│       └── Pages/
│           ├── ApiCatalog/
│           ├── ApiPreview/
│           ├── Lab/
│           └── Welcome.tsx
├── routes/
│   ├── console.php
│   └── web.php
├── storage/
├── tests/
│   ├── Feature/
│   │   ├── ApiPreview/
│   │   │   └── ApiPreviewTest.php
│   │   └── ExampleTest.php
│   ├── Unit/
│   │   └── ExampleTest.php
│   └── TestCase.php
├── composer.json
├── package.json
├── phpunit.xml
└── vite.config.js
```

API Preview と API カタログ同期検証では、Action / Service / Repository / DTO / Responder / Factory / Job / Command を一部作成済みです。一方で、API Discovery Hub 本体一覧の `/api-catalog/mock` は UI モック確認用のため、Controller / Query Action / Repository / DTO / Responder にはまだ接続していません。

## 7. 設計方針

設計方針は、ADR パターンとレイヤードアーキテクチャを組み合わせ、責務を小さく分けて実装することです。ここでの ADR は Action-Domain-Responder の考え方を指します。

現時点では API Preview と API カタログ同期検証から、Action / Service / Repository / DTO / Responder などを段階的に導入しています。API Discovery Hub 本体一覧は、まず Inertia / React のモック画面で UI と props 分割方針を確認してから本実装へ進める方針です。

今後の責務分離方針は次のとおりです。

- Controller は HTTP リクエストを受ける窓口に限定する
- Request はバリデーションに限定する
- Action は入力を受け取り、ユースケースの流れを組み立てる
- Service は業務ルールやユースケース処理を担当する
- Repository は DB アクセスの抽象化に限定する
- DTO はレイヤー間のデータ受け渡しに使う
- Responder は HTTP レスポンスの整形を担当する
- Factory はオブジェクト生成や初期化の責務を持つ
- Strategy は条件により切り替わる処理方針を分離する

設計の詳細なルール、命名規則、ディレクトリ構成は今後追記します。

## 8. AI の使用方針

このプロジェクトでは AI に丸投げしません。

仕様・責務・制約・テスト観点は人間が先に決めます。そのうえで、AI ツールを補助的に使います。

- CodexApp は実装補助、差分作成、既存コード確認に使う
- ChatGPT は仕様整理、設計整理、レビュー観点整理に使う
- VS Code は人間がコードを読み、判断し、レビューする場として使う
- 最終判断とレビュー責任は人間が持つ

AI が生成したコードは、そのまま正しいものとして扱わず、責務・命名・テスト・既存構成との整合性を確認します。

## 9. 人間が判断する範囲

人間が判断する範囲は次のとおりです。

- 何を実装するか
- なぜ実装するか
- どこまでを今回のスコープにするか
- 責務分離の境界
- テストすべき観点
- AI が提案した実装を採用するかどうか
- GitHub に push / merge するかどうか
- ポートフォリオとして公開してよい品質かどうか

## 10. CodexApp に任せる範囲

CodexApp には、主に次の作業を任せます。

- 既存ファイル構成の確認
- 既存コードの読み取り
- 指定された範囲内のコード変更
- README や設定ファイルなどの差分作成
- テストや静的解析コマンドの実行補助
- 実装後の変更内容の要約

CodexApp に任せる場合でも、作業範囲、制約、変更してよいファイルは人間が指定します。

## 11. 開発フロー

想定している開発フローは次のとおりです。

1. 人間が仕様、責務、制約、テスト観点を整理する
2. ChatGPT で仕様や設計の抜け漏れを確認する
3. CodexApp で既存コードとファイル構成を確認する
4. 小さな単位で実装する
5. テストまたは動作確認を行う
6. 人間が差分をレビューする
7. 問題がなければ Git にコミットし、GitHub に push する

現在の具体的なブランチ運用、Issue 運用、Pull Request 運用は未定です。

## 12. テスト方針

現在は Laravel 初期状態の Example テストに加えて、API Preview の Feature テストを追加しています。API Discovery Hub 本体一覧モックに対する専用テストはまだありません。

今後の方針は次のとおりです。

- HTTP の振る舞いは Feature テストで確認する
- Service や Action の業務ルールは Unit テストで確認する
- Repository は必要に応じて DB を使ったテストを行う
- DTO は変換や受け渡しのルールが複雑になった場合にテストする
- 仕様変更時は、先にテスト観点を整理してから実装する

テスト実行コマンドは今後運用しながら追記します。現時点では Laravel 標準の `php artisan test` を使用する想定です。

## 13. 今後実装予定

今後実装する内容の候補は次のとおりです。

- API Discovery Hub 本体一覧の Controller / Query Action / Repository / DTO / Responder 接続
- Inertia props を `filters`、`providers`、`apiCatalogItems`、`pagination` に分けた本実装
- Inertia 部分更新を使った検索・ページ送り
- API Discovery Hub 編集画面モック
- API Discovery Hub 詳細画面
- 保存済み API やメモ機能の検討
- Factory / Strategy の使いどころの検証
- Feature テストと Unit テストの追加
- GitHub 上での開発フロー整理
- README への設計判断や実装履歴の追記

API Discovery Hub 本体一覧では、APIs.guru の `list.json` を公開 API カタログデータソースとして扱います。`api_catalog_cache` は同期キャッシュ用テーブルとし、Google 検索リンクは DB に保存せず表示時に生成します。

## 14. 注意事項

- この README は現在確認できる構成に基づいています。
- API Discovery Hub 本体一覧は現時点ではモック画面です。
- API Preview 側の Repository / DTO / Responder は本体側に流用しない前提です。
- ADR パターン、レイヤードアーキテクチャ、各種責務分離は段階的に導入しています。
- `.env` や `vendor/`、`node_modules/` は Git 管理対象外です。
- Docker 関連ファイルはローカルのプロジェクトルートにあります。GitHub 上でこの `src` ディレクトリのみを確認する場合、Docker ファイルは含まれない可能性があります。
- 不明な点や未決定の運用ルールは、今後追記します。
