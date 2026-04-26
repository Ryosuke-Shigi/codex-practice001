# codex-practice001

このリポジトリは、Laravel + Docker を前提に、CodexApp・ChatGPT・VS Code を使った AI 駆動／仕様駆動開発を練習・検証するためのポートフォリオ用プロジェクトです。

現時点では Laravel 11 の初期構成をベースにした学習用アプリケーションです。独自の業務機能、ADR パターンの具体実装、レイヤードアーキテクチャ用のディレクトリ構成はまだ実装していません。

## 1. プロジェクト概要

Laravel アプリケーション本体はこの `src` ディレクトリで Git 管理しています。

Docker 関連ファイルは、ローカル開発環境として一階層上のプロジェクトルートに配置しています。現在確認できている Docker 構成は `docker-compose.yml`、`docker/nginx/default.conf`、`docker/php/Dockerfile`、`docker/php/php.ini`、`docker/mysql/my.cnf`、`docker/node/Dockerfile` です。

現在のアプリケーションは Laravel の初期ルート `GET /` が `welcome` ビューを返す状態です。独自の画面、API、CRUD、認証機能は未実装です。

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
- Tailwind CSS: `^3.4.13`
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

## 5. ディレクトリ構成

現在確認できている主な Laravel 側の構成です。

```text
src/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Controller.php
│   ├── Models/
│   │   └── User.php
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
├── config/
├── database/
│   └── migrations/
├── public/
├── resources/
├── routes/
│   ├── console.php
│   └── web.php
├── storage/
├── tests/
│   ├── Feature/
│   │   └── ExampleTest.php
│   ├── Unit/
│   │   └── ExampleTest.php
│   └── TestCase.php
├── composer.json
├── package.json
├── phpunit.xml
└── vite.config.js
```

現時点では `app/Actions`、`app/Services`、`app/Repositories`、`app/DTOs`、`app/Http/Responders`、`app/Factories`、`app/Strategies` は未作成です。

## 6. 設計方針

設計方針は、ADR パターンとレイヤードアーキテクチャを組み合わせ、責務を小さく分けて実装することです。ここでの ADR は Action-Domain-Responder の考え方を指します。

ただし、現時点では方針段階であり、具体的な独自実装はまだありません。

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

## 7. AI の使用方針

このプロジェクトでは AI に丸投げしません。

仕様・責務・制約・テスト観点は人間が先に決めます。そのうえで、AI ツールを補助的に使います。

- CodexApp は実装補助、差分作成、既存コード確認に使う
- ChatGPT は仕様整理、設計整理、レビュー観点整理に使う
- VS Code は人間がコードを読み、判断し、レビューする場として使う
- 最終判断とレビュー責任は人間が持つ

AI が生成したコードは、そのまま正しいものとして扱わず、責務・命名・テスト・既存構成との整合性を確認します。

## 8. 人間が判断する範囲

人間が判断する範囲は次のとおりです。

- 何を実装するか
- なぜ実装するか
- どこまでを今回のスコープにするか
- 責務分離の境界
- テストすべき観点
- AI が提案した実装を採用するかどうか
- GitHub に push / merge するかどうか
- ポートフォリオとして公開してよい品質かどうか

## 9. CodexApp に任せる範囲

CodexApp には、主に次の作業を任せます。

- 既存ファイル構成の確認
- 既存コードの読み取り
- 指定された範囲内のコード変更
- README や設定ファイルなどの差分作成
- テストや静的解析コマンドの実行補助
- 実装後の変更内容の要約

CodexApp に任せる場合でも、作業範囲、制約、変更してよいファイルは人間が指定します。

## 10. 開発フロー

想定している開発フローは次のとおりです。

1. 人間が仕様、責務、制約、テスト観点を整理する
2. ChatGPT で仕様や設計の抜け漏れを確認する
3. CodexApp で既存コードとファイル構成を確認する
4. 小さな単位で実装する
5. テストまたは動作確認を行う
6. 人間が差分をレビューする
7. 問題がなければ Git にコミットし、GitHub に push する

現在の具体的なブランチ運用、Issue 運用、Pull Request 運用は未定です。

## 11. テスト方針

現在は Laravel 初期状態の Example テストのみ確認できています。独自機能に対するテストはまだありません。

今後の方針は次のとおりです。

- HTTP の振る舞いは Feature テストで確認する
- Service や Action の業務ルールは Unit テストで確認する
- Repository は必要に応じて DB を使ったテストを行う
- DTO は変換や受け渡しのルールが複雑になった場合にテストする
- 仕様変更時は、先にテスト観点を整理してから実装する

テスト実行コマンドは今後運用しながら追記します。現時点では Laravel 標準の `php artisan test` を使用する想定です。

## 12. 今後実装予定

今後実装する内容は未定です。現時点の候補は次のとおりです。

- 小さな CRUD 機能
- ADR パターンを意識した Action / Responder の導入
- Service / Repository / DTO の責務分離
- Factory / Strategy の使いどころの検証
- Feature テストと Unit テストの追加
- GitHub 上での開発フロー整理
- README への設計判断や実装履歴の追記

実装済みではないため、詳細は今後追記します。

## 13. 注意事項

- この README は現在確認できる構成に基づいています。
- 独自機能はまだ実装していません。
- ADR パターン、レイヤードアーキテクチャ、各種責務分離は現時点では設計方針です。
- `.env` や `vendor/`、`node_modules/` は Git 管理対象外です。
- Docker 関連ファイルはローカルのプロジェクトルートにあります。GitHub 上でこの `src` ディレクトリのみを確認する場合、Docker ファイルは含まれない可能性があります。
- 不明な点や未決定の運用ルールは、今後追記します。
