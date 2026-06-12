# Docker経由コマンド台帳

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-12

## このドキュメントの目的

このドキュメントは、artisan / npm / docker compose / git の実行場所と確認コマンドを固定し、作業ごとに実行方法を探索し直さないための台帳です。

コマンドの存在を確認できていない場合は断定せず、未確認として扱います。

この文書では、標準の配置例として次を使います。

- root側: `/var/www/api-discovery-hub`
- `/src`側: `/var/www/api-discovery-hub/src`

実際のローカルパスが異なる場合も、Docker Compose は root側、Laravelアプリは `/src` 側という境界を優先します。

## 確認済みの前提

初回作成時点で確認した内容:

- root側で `docker compose config --services` を確認済み
- `php-fpm` service の存在を確認済み
- `npm` service の存在を確認済み
- `queue` service の存在を確認済み
- `scheduler` service の存在を確認済み
- `/src` 側に `artisan` が存在することを確認済み
- `/src/package.json` の scripts を確認済み
- `/src/composer.json` の scripts を確認済み

確認済みの npm scripts:

- `build`
- `dev`
- `test`
- `test:run`
- `typecheck`

確認済みの composer scripts:

- `post-autoload-dump`
- `post-update-cmd`
- `post-root-package-install`
- `post-create-project-cmd`
- `dev`
- `format`
- `format-check`

ここでの「確認済み」は、ファイル上の存在確認です。実行結果を確認していないコマンドは、成功すると断定しません。

## root / `/src` のGit境界

root側は、Docker とローカル実行基盤を扱います。

- `docker-compose.yml`
- `docker/`
- nginx / php-fpm / mysql / redis / queue / scheduler / npm service
- adminer / mailpit / minio
- Docker Compose の確認、起動、再作成、ログ確認

`/src` 側は、Laravelアプリケーション本体とアプリ側の文書を扱います。

- `app/`
- `routes/`
- `resources/js/`
- `resources/views/`
- `config/`
- `public/`
- `artisan`
- React / Inertia / TypeScript
- `tests/`
- `docs/`
- `AGENTS.md`
- `README.md`

Git操作の原則:

- 変更対象のリポジトリだけでブランチを作る
- root と `/src` の両方で無条件にブランチを作らない
- 対象外リポジトリでブランチを作らない
- `/src` の変更なのに root側だけ `pull` して完了扱いしない
- root側は Docker 構成確認だけが目的なら、ブランチを作らず `status` と `docker compose config --services` の確認に留める

## Docker経由コマンド原則

このプロジェクトでは、artisan / npm は原則としてホストOSで直接実行しません。

artisan は `php-fpm` コンテナで実行します。

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan optimize:clear
docker compose exec php-fpm php artisan test
docker compose exec php-fpm php artisan route:list
docker compose exec php-fpm php artisan migrate:status
```

npm は `npm` service で実行します。

```bash
cd /var/www/api-discovery-hub
docker compose run --rm npm npm run build
docker compose run --rm npm npm run test:run
docker compose run --rm npm npm run typecheck
```

禁止:

- `php-fpm` コンテナで npm を実行すること
- `npm` service で artisan を実行すること

理由:

- npm は `php-fpm` ではなく `npm` service で実行する
- artisan は `npm` service ではなく `php-fpm` で実行する

## docker compose の実行場所

`docker compose` は root側で実行します。

```bash
cd /var/www/api-discovery-hub
docker compose config --services
docker compose ps
```

`/src` 側で作業している場合も、Docker Compose の確認・起動・ログ確認は root側へ移動してから実行します。

## queue / scheduler

`queue` と `scheduler` は専用サービスとして扱います。

確認例:

```bash
cd /var/www/api-discovery-hub
docker compose ps queue scheduler
docker compose logs --tail=100 queue
docker compose logs --tail=100 scheduler
```

Job や Scheduler の実装を変更した場合は、Laravelテストだけでなく、必要に応じて対象サービスの起動状態とログを確認します。

## docsのみ変更時の確認

docs / Markdown のみを変更した場合、原則として Laravel test や npm build は必須にしません。

```bash
cd /var/www/api-discovery-hub/src
git diff --check
```

必要なら、未整理語句を確認します。

```bash
cd /var/www/api-discovery-hub/src
rg -n "TODO|TBD|FIXME|未定|あとで" docs README.md AGENTS.md
```

docsのみ変更でアプリテストを実行しない場合は、PR本文や作業報告で「docsのみのため未実行」と明記します。

## PHP / Laravel変更時の確認

対象テストが明確な場合は、先に対象テストを実行し、必要に応じて全体へ広げます。

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan test tests/Feature/ExampleTest.php
docker compose exec php-fpm php artisan test
```

PHP format check が必要な場合は、`/src/composer.json` に存在する script だけを使います。

```bash
cd /var/www/api-discovery-hub
docker compose run --rm composer format-check
```

route / migration / config の確認が必要な場合:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan route:list
docker compose exec php-fpm php artisan migrate:status
docker compose exec php-fpm php artisan optimize:clear
```

Composer scripts は `/src/composer.json` 上で存在を確認済みですが、実行方法や必要性は作業内容ごとに確認します。未実行の Composer コマンドを成功扱いしません。

## React / TypeScript変更時の確認

React / TypeScript 変更では、`/src/package.json` に存在する scripts のみを使います。

画面変更では、最低限 build を確認します。

```bash
cd /var/www/api-discovery-hub
docker compose run --rm npm npm run build
```

純粋関数、React Utility、Component のテスト対象がある場合:

```bash
cd /var/www/api-discovery-hub
docker compose run --rm npm npm run test:run
```

TypeScript / TSX を変更した場合は、必要に応じて typecheck を確認します。現時点では CI 必須ゲートではありません。

```bash
cd /var/www/api-discovery-hub
docker compose run --rm npm npm run typecheck
```

## Docker構成変更時の確認

Docker構成を変更した場合は、root側で Compose 設定を確認します。

```bash
cd /var/www/api-discovery-hub
docker compose config
docker compose ps
```

必要な場合だけ、対象サービスを限定して起動、再作成、ログ確認を行います。

```bash
cd /var/www/api-discovery-hub
docker compose up -d php-fpm
docker compose logs --tail=100 php-fpm
```

全サービスの再作成や build は、Dockerfile、Compose、依存イメージ、環境変数に関わる変更がある場合だけ検討します。

## 本番反映時の確認

本番反映は人間が判断します。AIエージェントは、本番反映コマンドを推測で実行しません。

確認する観点:

- 対象PRと差分
- CI / status check
- Laravel tests
- frontend build
- migration の有無
- queue / scheduler への影響
- `.env` や秘密情報の変更有無
- rollback 方針

本番反映コマンド、サーバーパス、認証方法はこの台帳では未確認です。必要になった時点で、人間が正本を提示してから扱います。

## 未確認コマンドの扱い

次の場合は、確認済みコマンドとして扱いません。

- `package.json` に存在しない npm script
- `composer.json` に存在しない composer script
- この台帳や既存docsに記載がない Docker service
- 本番環境の deploy / restart / migrate コマンド
- Makefile や Compose service に存在していても、今回の作業ルールとして採用する確認が取れていないショートカット

未確認コマンドが必要な場合は、先にファイル上の定義を確認し、実行した場合は結果を報告します。実行していないコマンドは成功扱いしません。

## 禁止事項

- artisan をホストOSで直接実行する前提にする
- npm をホストOSで直接実行する前提にする
- npm を `php-fpm` で実行する
- artisan を `npm` service で実行する
- root と `/src` の両方で無条件にブランチを作る
- 対象外リポジトリでブランチを作る
- `/src` 変更なのに root側だけ `pull` して完了扱いする
- 未確認 npm script / composer script を断定する
- docsのみ変更でも Laravel test / npm build を必須扱いする
- React / TypeScript の画面変更で build 確認を不要扱いする
