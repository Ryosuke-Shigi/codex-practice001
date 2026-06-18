# Feature Module移植ルール

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-18
- Canonical source: 全Feature共通のFeature Module移植ルール

## このドキュメントの目的

このドキュメントは、Featureを別Laravelプロジェクトへ移植可能な単位として扱うための共通ルールです。

対象は、API Discovery Hub、DanceShortsAnalyzer、DanceShortsRadar、Japan Quake Wave Map、工事発注管理など、現在および今後追加されるすべてのFeatureです。特定Feature専用の移植手順はここへ増やしすぎず、必要になったFeatureから順に `docs/features/{feature}.md` へ Feature移植マニフェストを追加します。

ADR Pattern / レイヤードアーキテクチャにより、Controller / Request / Action / Service / Repository / DTO / Responder / Component / Test をFeature名で追える場合、そのFeatureは移植候補として扱えます。

ただし、移植しやすい構成になっていることと、そのままコピーで動くことは別です。移植前には、必ず以下を固定します。

- 移植モード
- 移植対象
- 移植しない対象
- 移植先で差し替える対象
- 移植先で確認する対象
- 停止条件

## 基本原則

- 移植元repoは読むだけにする
- 移植先repoだけに差分を出す
- sandboxで作業対象にするのは移植先repoだけ
- 移植元repoはGitHub上の参照情報として読むだけ
- 複数repoを同一sandboxで同時編集できる前提にしない
- 移植元repoを移植作業中に勝手に修正しない
- 移植元の仮コードをPRODUCTとして扱わない
- 移植前にFeature移植マニフェストを作る
- routes / config / provider / scheduler / migration / seeder / tests / docs を移植対象として確認する
- Lab配下、MOCK固定データ、PROTOTYPE仮通信をPRODUCTとして移植しない
- 移植先Laravelの構成に合わせて、route prefix、layout、認証、queue、scheduler、env、DB接続を確認する
- Feature固有の業務判断をCommonへ逃がさない
- 移植対象外のFeatureを巻き込まない
- 存在しないパスは、存在しないものとして記録する
- 存在しないファイルを、存在する前提で参照しない

## 移植モード

### full

Feature全体移植です。

開発過程ごと持ち込み、移植先でも再検証したい場合に使います。

含めるもの:

- IDEA BOARD
- MOCK
- PROTOTYPE
- PRODUCT
- docs
- tests
- 必要な画像
- 固定データ
- ProjectHub等の入口情報

### product-only

PRODUCTのみ移植です。

別Laravelへ本番機能だけを持っていく場合の標準モードです。

含めるもの:

- 本番Controller
- Request
- Action
- Service
- Repository
- DTO / ListDTO
- Responder / Presenter
- Strategy / Factory
- Job
- Enum
- Model
- Migration
- Seeder
- Config
- Product routes
- Console command / Scheduler
- ServiceProvider binding
- Product Page / Component
- Feature Test / Unit Test
- PRODUCT仕様に必要なfeature docs

含めないもの:

- IDEA BOARD説明ページ
- MOCK固定データ
- MOCK専用Page / Component
- PROTOTYPE仮通信
- PROTOTYPE検証用Route / Controller
- Lab配下の紹介・検証ページ
- モック用画像
- 一時的な調査ログ
- ProjectHubの表示設定

MOCK / PROTOTYPE / IDEA BOARD を、PRODUCT側で同じUI契約を再実装するために参照することはできます。ただし、参照とPRODUCT移植対象としてのコピーは分けます。

### mock-only

MOCKのみ移植です。

画面単体のUI確認だけを移植先で行いたい場合に使います。

含めるもの:

- MOCK Page
- MOCK Component
- 固定データ
- モック用画像
- MOCK route
- MOCK表示テスト

含めないもの:

- 本番Action
- Service
- Repository
- DTO
- Responder
- DB保存
- 外部API通信
- 本番Scheduler

### prototype-only

PROTOTYPEのみ移植です。

画面間導線、簡易通信、仮データの流れを移植先で確認したい場合に使います。

含めるもの:

- PROTOTYPE Page
- PROTOTYPE Component
- 検証用Route
- 検証用Controller
- 仮データ
- 簡易通信
- 画面間導線確認用コード

含めないもの:

- 本番業務ロジック
- 正式DB設計
- 本番データ更新
- 本番API更新
- PRODUCT相当の完成判定

### idea-board-only

IDEA BOARDのみ移植です。

構想整理や仕様相談用の静的UIだけを移植先へ持ち込みたい場合に使います。

含めるもの:

- 説明ページ
- 構想整理ページ
- 仕様相談用の静的UI
- docs上の構想メモ

含めないもの:

- MOCK
- PROTOTYPE
- PRODUCT
- DB
- 外部API
- Scheduler
- Queue

## Feature移植マニフェスト

個別Featureを移植する場合、対象Featureの `docs/features/{feature}.md` にFeature移植マニフェストを追加します。

個別マニフェストは全Featureへ一括で作る必要はありません。移植対象になったFeatureから順に追加します。

個別マニフェストに入れる項目:

- Feature名
- 移植モード
- full 移植対象
- product-only 移植対象
- mock-only 移植対象
- prototype-only 移植対象
- idea-board-only 移植対象
- 移植しない対象
- 移植先で差し替える対象
- 移植先で確認する対象
- 移植時の停止条件

## PRODUCTのみ移植の標準確認対象

`product-only` では、原則として以下を確認します。存在しないパスは、存在しないと記録します。

- `app/Http/Controllers/{Feature}`
- `app/Http/Requests/{Feature}`
- `app/Actions/{Feature}`
- `app/Services/{Feature}`
- `app/Repositories/{Feature}`
- `app/DTO/{Feature}`
- `app/Responders/{Feature}`
- `app/Strategies/{Feature}`
- `app/Factories/{Feature}`
- `app/Jobs/{Feature}`
- `app/Enums/{Feature}`
- `app/Models/{Feature}`
- `database/migrations`
- `database/seeders`
- `config/{feature}.php`
- `routes/{feature}.php` または `routes/web.php` 内の対象route
- `routes/console.php` 内の対象command / scheduler
- `app/Providers/{Feature}ServiceProvider` または `AppServiceProvider` 内の対象bind
- `resources/js/Pages/{Feature}`
- `resources/js/Components/{Feature}`
- `tests/Feature/{Feature}`
- `tests/Unit/{Feature}`
- `docs/features/{feature}.md` のPRODUCT仕様部分

## PRODUCTのみ移植で含めないもの

`product-only` では、原則として以下を含めません。

- `resources/js/Pages/Lab` 配下の紹介ページ
- `resources/js/Pages/Lab` 配下のMOCKページ
- `resources/js/Components/Lab` 配下の固定データComponent
- MOCK固定データ
- PROTOTYPE仮通信
- PROTOTYPE検証用Route
- PROTOTYPE検証用Controller
- `public/images` 配下のモック専用画像
- IDEA BOARD説明ページ
- ProjectHub表示設定
- 一時的な調査ログ

ただし、PRODUCT側で同じUI契約を再実装するために、MOCK / PROTOTYPE / IDEA BOARD を参照することは許可します。参照はよいが、PRODUCT移植対象としてコピーしません。

## 移植先で差し替えるもの

Featureを別Laravelへ移植する場合、以下を移植先に合わせて差し替えます。

- env
- 外部API key
- queue接続
- scheduler有効化条件
- DB接続
- route prefix
- 認証 / 認可
- Inertia layout
- Vite / React / TypeScript構成
- ServiceProvider登録方法
- config参照名
- migration実行順
- seeder投入条件
- CI / test command
- timezone
- storage設定
- cache設定

## 移植先で確認するもの

- Laravel version
- PHP version
- Inertia / React / TypeScript の有無
- queue worker の有無
- scheduler の有無
- DB種類
- timezone
- env管理方法
- 外部API key管理方法
- route prefix
- 認証方式
- 権限方式
- build / typecheck / test command
- CIの有無
- storage / cache / log の扱い

## 移植時の停止条件

以下の場合は移植を止めます。

- 移植モードを確定できない
- 移植元repoに差分を出そうとしている
- 移植先repoを確認できない
- 移植対象ファイル一覧を固定できない
- `product-only` なのに Lab / MOCK / PROTOTYPE / IDEA BOARD を混ぜようとしている
- config / env / route / scheduler / provider の差し替え点を確認できない
- 移植先LaravelにInertia / React構成がないのに、画面をそのまま移そうとしている
- DB schema が移植先と矛盾している
- queue / scheduler が移植先で使えない
- 外部API key の扱いが未定
- tests を移植先で実行できない
- Feature docs と現在コードが矛盾している
- 移植元と移植先の責務境界が矛盾している

## 個別Feature移植マニフェストテンプレート

以下を、移植対象になったFeatureの `docs/features/{feature}.md` へ追加します。全Featureへ一括追加しません。

```md
## Feature移植マニフェスト

### Feature名

例: {FeatureName}

### 移植モード

- full
- product-only
- mock-only
- prototype-only
- idea-board-only

標準モード:

- product-only

### full 移植対象

- IDEA BOARD
- MOCK
- PROTOTYPE
- PRODUCT
- docs
- tests
- 必要な画像
- 固定データ
- ProjectHub入口

### product-only 移植対象

- app/Http/Controllers/{Feature}
- app/Http/Requests/{Feature}
- app/Actions/{Feature}
- app/Services/{Feature}
- app/Repositories/{Feature}
- app/DTO/{Feature}
- app/Responders/{Feature}
- app/Strategies/{Feature}
- app/Factories/{Feature}
- app/Jobs/{Feature}
- app/Enums/{Feature}
- app/Models/{Feature}
- database/migrations
- database/seeders
- config/{feature}.php
- routes
- console / scheduler
- provider / binding
- resources/js/Pages/{Feature}
- resources/js/Components/{Feature}
- tests/Feature/{Feature}
- tests/Unit/{Feature}
- docs/features/{feature}.md のPRODUCT仕様部分

### mock-only 移植対象

- MOCK Page
- MOCK Component
- 固定データ
- モック用画像
- MOCK route
- MOCK表示テスト

### prototype-only 移植対象

- PROTOTYPE Page
- PROTOTYPE Component
- 検証用Route
- 検証用Controller
- 仮データ
- 簡易通信
- 画面間導線確認用コード

### idea-board-only 移植対象

- 説明ページ
- 構想整理ページ
- 仕様相談用の静的UI
- docs上の構想メモ

### 移植しない対象

- Lab配下
- MOCK固定データ
- PROTOTYPE仮通信
- PROTOTYPE検証用Route / Controller
- IDEA BOARD説明ページ
- モック用画像
- 一時的な調査ログ
- ProjectHub表示設定

### 移植先で差し替える対象

- env
- config
- route prefix
- ServiceProvider
- DB
- queue
- scheduler
- storage
- cache
- auth
- layout
- CI / test command

### 移植先で確認する対象

- Laravel version
- PHP version
- Inertia / React / TypeScript
- DB
- queue
- scheduler
- timezone
- env管理
- route構成
- 認証 / 権限
- build / typecheck / test

### 停止条件

- 移植モード未確定
- 移植元repoに差分を出そうとしている
- 移植対象を固定できない
- product-only に Lab / MOCK / PROTOTYPE / IDEA BOARD を混ぜようとしている
- 移植先の構成を確認できない
- config / env / route / provider / DB / queue / scheduler の差し替え点を確認できない
- tests を移植先で実行できない
```
