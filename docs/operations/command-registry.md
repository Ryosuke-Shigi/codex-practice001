# Docker経由コマンド台帳

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-07

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
- `composer` service の存在を確認済み
- `docker compose run --rm composer --version` で `composer` service 経由の Composer 起動を確認済み
- `docker compose exec php-fpm composer --version` で `php-fpm` 内の Composer 起動を確認済み
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

ここでの「確認済み」は、service、ファイル、script、または実行経路の確認を指します。個別の確認コマンドが成功するかは、実際に実行した結果を報告します。実行していないコマンドは成功扱いしません。

## root / `/src` のGit境界

このローカル構成では、root側のDocker / 環境repoと、`/src` 側のLaravel / React / docs / tests / アプリrepoは別Git管理です。

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

作業対象に応じて確認するGit境界を切り替えます。

- Docker / compose / 環境作業: root側repoを確認する
- Laravel / React / docs / tests / appコード作業: `/src` 側repoを確認する

アプリ/docs作業をroot側から開始する場合は、外側repoのremoteだけで判断せず、次を確認します。

```bash
git -C src remote -v
git -C src branch --show-current
git -C src status --short
```

root側repoのremoteが `Ryosuke-Shigi/laravel11-docker.git` でも、`/src` 側repoが対象アプリrepoを向いている場合は異常扱いしません。

Git境界が不明な場合は、remote変更、clone、restoreへ進まず停止して報告します。

禁止する復旧操作:

- 外側repoのremoteを書き換えない
- cloneしない
- `src/` を削除しない
- `artisan` をrestoreしない
- Git境界が不明なままブランチ切替や編集へ進まない

Git操作の原則:

- 変更対象のリポジトリだけでブランチを作る
- root と `/src` の両方で無条件にブランチを作らない
- 対象外リポジトリでブランチを作らない
- `/src` の変更なのに root側だけ `pull` して完了扱いしない
- root側は Docker 構成確認だけが目的なら、ブランチを作らず `status` と `docker compose config --services` の確認に留める

## local系MDの扱い

local系MDは、このPC固有の環境差分、gh / Git / WSL / ローカル実行手順を確認するための補助資料です。存在する場合だけ参照し、存在しない場合でも作業を止めません。

local系MDを更新またはstageする前に、必ずGit管理対象かGit外かを確認します。Git外のlocalファイルはPRへ含めません。

local系MDは、Product Design、ADR Pattern、レイヤード責務、UI責務、LumiLaboのプロダクト方針、全体開発ルールを上書きしません。中身を汎用docsやPR本文へ無断で転記しません。

## 作業開始前のリポジトリ確認

実装、docs更新、テスト追加、PR作成の前に、作業対象リポジトリを確認します。

最低限、次を確認します。

```bash
pwd
git remote -v
git branch --show-current
git status --short
```

確認すること:

- 作業ディレクトリが指示されたリポジトリである
- `origin` の fetch / push が指示された GitHub repository を向いている
- 作業ブランチが指示されたブランチ、または作成前の `main` である
- 未コミット差分に今回作業と無関係な変更がない

対象repo、remote、branchが指示と一致しない場合は、作業を続けず停止して報告します。

人間が別の作業場所を明示した場合は、元workspaceと指定された作業場所の `pwd` / `git remote -v` / `git branch --show-current` / `git status --short` を区別し、どちらで作業したかを完了報告に明記します。

## PR前Git確認

PR作成前、commit前、push前は、作業対象repoで次を確認します。

```bash
git status
git branch --show-current
git diff --stat
git diff --check
git log --oneline -5
```

確認すること:

- 作業branchが確認でき、`main` 直接作業ではない
- 対象repo、対象階層、対象branchが作業指示と一致している
- 差分が今回の作業範囲に収まっている
- `git diff --check` で空白・改行崩れがない
- commitする場合は、commitがレビュー可能、巻き戻し可能、原因特定可能な単位になっている
- PR本文へ、実行した確認結果、未実行理由、docs更新要否、該当Sensors、branch運用、commit粒度を必要に応じて残せる

main直作業、branch不明、対象repo不明、目的外差分、secrets混入が見つかった場合は、PR作成へ進まず停止します。

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

DanceShortsRadar の ranking read model 初期生成Jobをdispatchする場合:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan dance-shorts-radar:dispatch-ranking-read-model-patterns
# 旧command名を使う場合も、同期全件生成ではなく enabled pattern Job のdispatchになります。
docker compose exec php-fpm php artisan dance-shorts-radar:build-ranking-read-models
```

1つの normal pattern だけ同期生成する場合:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan dance-shorts-radar:build-ranking-read-model-pattern --type=normal --scope=JP --comparison-days=1 --sort-key=views_per_hour
```

summary / rising の read model を同期生成する場合:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan dance-shorts-radar:build-summary-ranking-read-models
docker compose exec php-fpm php artisan dance-shorts-radar:build-rising-ranking-read-models
```

local / production とも、migration 適用後は normal / summary / rising pattern build Job をdispatchし、必要に応じて対象 pattern の `pattern_build_id` が active として参照できることを確認してから `/dance-shorts-radar` を確認します。pattern build schema への移行では、既存 create migration を直接書き換えず、新規 migration で `dance_short_radar_ranking_read_model_builds` と `dance_short_radar_ranking_read_models` だけを作り直します。ReadModel は派生データのため、deploy後は空になり、raw data / snapshots から `dance-shorts-radar:dispatch-ranking-read-model-patterns` で再生成します。raw data / snapshots / sync 系テーブルは drop / truncate / delete しません。normal pattern は `sort -> limit(config値) -> save` で生成し、config未定義時に全件生成へフォールバックしません。summary / rising は `max_rows = 0` を row cap なしとして扱います。active region が JP / US / KR の3件なら normal は60 pattern、summary は20 pattern、rising は5 patternです。

本番デプロイ後の想定コマンド:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan migrate --force
docker compose exec php-fpm php artisan optimize:clear
docker compose exec php-fpm php artisan config:cache
docker compose restart php-fpm queue scheduler
docker compose exec php-fpm php artisan dance-shorts-radar:dispatch-ranking-read-model-patterns
```

確認観点:

- `php artisan migrate:status` で新規 migration が実行済みになっていること
- `dance_short_radar_ranking_read_model_builds` が pattern build schema になっていること
- `dance_short_radar_ranking_read_models` が pattern row schema になっていること
- normal / summary / rising pattern build が dispatch されること
- raw data / snapshots が保持されていること

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
- ホストOSの `npm` / `node` / `vite` / `vitest` でReact / TypeScript確認を続けること

理由:

- npm は `php-fpm` ではなく `npm` service で実行する
- artisan は `npm` service ではなく `php-fpm` で実行する
- ホストOS側のNodeや `node_modules` はDocker内の実行環境と一致しないため、確認結果として扱わない

ホストOS側で `UNC paths are not supported`、`vitest is not recognized`、`Cannot find module @rollup/rollup-...`、Nodeバージョン不一致などが出た場合は、ホスト側のNode / npm調査を続けず、root側から `docker compose run --rm npm ...` で確認をやり直す。

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

`composer` service 経由の Composer 起動は確認済みのため、標準の実行経路は次です。

```bash
cd /var/www/api-discovery-hub
docker compose run --rm composer format-check
```

`php-fpm` 内の Composer 起動も確認済みですが、標準経路は `composer` service とします。`composer` service が使えない場合だけ、理由と確認結果を明記して別経路を検討します。

route / migration / config の確認が必要な場合:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan route:list
docker compose exec php-fpm php artisan migrate:status
docker compose exec php-fpm php artisan optimize:clear
```

Japan Quake Wave Map の地震情報取得Command / Scheduler確認:

```bash
cd /var/www/api-discovery-hub
docker compose exec php-fpm php artisan list | grep -Ei 'earthquake|quake|jma'
docker compose exec php-fpm php artisan schedule:list | grep -Ei 'earthquake|quake|jma|map'
docker compose exec php-fpm php artisan earthquake:refresh-map
```

Composer scripts は `/src/composer.json` 上で存在を確認済みです。ただし、`format` / `format-check` の成否はその時点のPHPコード状態に依存するため、未実行の Composer コマンドを成功扱いしません。

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
- Docker Compose service 名だけ確認し、実際の起動または利用可否を確認していない実行経路
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
