# MDルーター

## 目的

MDルーターは、このプロジェクトのdocs運用において、作業開始時に読む入口、読む順番、読むdocs、読まないdocsを固定するためのGuideである。

全docsを読ませる一覧ではない。作業者が全docsを読む前提にせず、作業種別ごとに必要なdocsと見出しを絞る。

目的は以下。

* 自己判断による過剰探索を防ぐ
* 無関係docsの読み込みを防ぐ
* 古いdocsと現在コードの矛盾を検知しやすくする
* 作業種別ごとに必要な文脈だけを読む
* 長文docsは全文精読を前提にせず、対象見出し単位で読む
* PRレビュー強度と読む範囲を接続する
* docsが形骸化している場合に停止条件を発動する
* 作業後にMDルーター自体を追加・削除・修正できる状態にする

MDルーターは、docsを軽く扱うためのものではない。

必要なdocsを、必要な順番で、必要な範囲だけ読むための入口である。

コスト削減のために必要情報を削らない。固定するのは最大ファイル数や最大行数などの数値上限ではなく、作業種別、正本docs、対象見出し、読まない範囲である。

## 基本原則

作業開始時は、最初に作業種別を判定する。

作業種別が不明な場合は、推測で読み進めない。

作業種別を確定できない場合は停止して報告する。

全作業で最初に確認するもの。

* AGENTS.md
* docs/index.md の必要箇所
* docs/ai/workflows/md-router.md の基本原則、読む順番、対象作業種別、関連停止条件

作業種別が決まった後、対応表に従って読むdocsを固定する。

docs/index.md は索引であり、毎回全文理解を前提にしない。MDルーターも、毎回全文精読する読み物ではなく、作業開始時に参照範囲を固定するための入口として扱う。

「念のため全文確認」「関係しそうなdocsをまとめて確認」「repo全体探索から開始」「無関係feature docsを広く確認」は行わない。不明点が作業継続に必要な場合は、無関係docsやrepo全体探索で補完せず停止条件として報告する。

関連workflow docs。

* `docs/ai/workflows/work-result-feedback-loop.md`: 作業後にどのdocs / 型 / コメント / テストへ戻すかの判定ルール
* `docs/ai/workflows/md-router-cases.md`: MDルーターの実戦ケース集。正本ではなく補助として読む
* `docs/ai/workflows/loop-engineering.md`: 実行、確認、修正、再確認、記録、次回改善までを反復可能にする作業ループ。全作業で必読にせず、下記の参照条件に該当する場合に読む

コード変更を含む作業では、関連するコメント、PHPDoc、JSDoc、型アノテーション、props契約説明が実装と矛盾していないか確認する。

これはコメントを増やすための確認ではない。責務、入力、出力、DTO形、状態遷移、例外条件、外部API境界、props契約が変わったときに、既存の説明が古いまま残らないようにするための確認である。

## Loop Engineeringを読む条件

Loop Engineeringは、AIが読む開発文脈が育つように、実行、確認、修正、再確認、記録、次回改善までを接続するための補助docsである。

全作業で必ず読むdocsにはしない。次に該当する場合だけ、読むMDへ `docs/ai/workflows/loop-engineering.md` を含める。

* 指示用まとめ / PR用まとめ / スレッド引き継ぎまとめなど、作業ループを固定する場合
* docs運用変更、MD Router変更、work-result-feedback-loop変更、pr-review-strength変更
* Sensors / logs / 再発防止運用を変更する場合
* 長い作業後に、確認・修正・再確認・記録の流れを整理する場合
* 失敗、確認結果、レビュー観点をdocs / Sensors / logsへ還元するか判断する場合

読む条件に該当しない作業では、既存の作業種別別ルーティングを優先し、無関係なdocsを増やしすぎない。

## 作業開始宣言テンプレート

作業開始時は、実装・修正・PR確認へ進む前に、以下を宣言する。

* 作業種別:
* 対象repo:
* 対象階層:
* 作業段階:
* 変更対象:
* 変更しない対象:
* 責務配置:
* 読むMD:
* 読まないMD:
* 編集禁止:
* 確認コマンド:
* PRレビュー強度:
* 停止条件:

この宣言を作れない場合は、推測で作業を始めず停止して報告する。

## 読む順番

原則として以下の順番で読む。

1. AGENTS.md
2. docs/index.md の必要箇所
3. docs/ai/workflows/md-router.md の基本原則、読む順番、対象作業種別、関連停止条件
4. 作業種別ごとの共通docs
5. 対象feature docs
6. 対象Route / Controller / Request / Action / Service / Repository / DTO / Responder / Component / Test
7. 依存が判明した場合のみ追加ファイル

最初からリポジトリ全体を探索しない。

長文docsは、対象作業に関係する見出し単位で読む。見出し単位で読んでも判断できない場合だけ、理由を明示して追加範囲を読む。

## Git作業 / ローカルGit状態確認

次はGit作業 / ローカルGit状態確認に含める。

* branch確認
* working tree確認
* 差分確認
* commit前確認
* commit粒度確認
* push前確認
* PR前確認
* PR確認
* merge前確認
* 本番反映前のpull対象確認
* 親Git / src Git の切り分け確認

Git作業を含む場合は、通常の共通docs確認に加えて以下の順で読む範囲を固定する。

1. AGENTS.md を読む
2. docs/index.md を読む
3. MDルーターで対象repo / 対象階層 / 作業種別を固定する
4. コマンド台帳が存在する場合は読む
5. 対象repoの remote / branch / status / diff を確認する
6. commit / push / PR の前後で差分と作業対象repoを再確認する

ローカル環境固有の再発防止メモや確認メモは、共有docsの正本ではない。Git操作、ブランチ操作、PR作成、main直作業回避、ローカル固有の地雷確認が絡む場合だけ、Git管理外の .local/ や .local-rules/ などを補助ハーネスとして確認する。

この補助ハーネスは正本docsではない。中身をGit管理docs、PR本文、レビューコメントへ転記せず、Git管理docsへ混ぜない。Git管理docsとローカル補助ハーネスが矛盾する場合は、勝手に統合せず停止して報告する。

## 外側環境repoと内側アプリrepoの境界

このプロジェクトでは、外側の Docker / compose / nginx / deploy 用repoと、内側の Laravel / React / docs / tests / app 用repoが分かれている場合がある。

この構成は異常ではない。

ただし、Laravel / React / app docs / tests / feature docs の作業では、外側repoを作業対象repoとして扱ってはいけない。

外側repo `Ryosuke-Shigi/laravel11-docker` で作業してよいのは、以下に限定する。

* Docker
* docker-compose
* nginx
* PHP-FPM
* build / deploy
* Lightsail運用
* 外側環境repo固有の README / docs
* 環境起動・停止・公開ポート・volume・network に関する設定

以下は内側アプリrepo `Ryosuke-Shigi/codex-practice001` 側で作業する。

* Laravel app
* React / Inertia
* routes
* app/
* resources/
* tests/
* docs/architecture.md
* docs/testing.md
* docs/frontend.md
* docs/ui-development-flow.md
* docs/features/
* DanceShorts系docs
* MDルーター
* PRレビュー強度ルール
* UI開発フロー
* MOCK / PROTOTYPE / PRODUCT 方針

Laravel / React / app docs / tests / feature docs の作業なのに、外側repo `laravel11-docker` に差分が出た場合は、repo境界ミスとして停止する。

Docker / compose / nginx / deploy / Lightsail運用作業でない限り、外側repoにPRを作成してはいけない。

外側repoから作業を開始した場合でも、アプリ作業では必ず内側アプリrepoの remote / branch / status を確認する。

内側アプリrepoを確認できない場合は、推測で作業を続けず停止する。

作業開始時に以下を確認する。

* 今回の作業は外側環境repoの作業か
* 今回の作業は内側アプリrepoの作業か
* 現在見ている remote はどちらか
* 現在見ている branch はどちらか
* 差分を出すべきrepoはどちらか
* PRを作成すべきrepoはどちらか

判断できない場合は、作業を開始しない。

最重要ルール:

Laravel / React / app docs / tests / feature docs の作業では、`laravel11-docker` にPRを作らない。

`laravel11-docker` にPRを作ってよいのは、Docker / compose / nginx / deploy / Lightsail運用など、外側環境repoそのものを変更する作業だけである。

## 作業種別別ルーティング表

| 作業種別 | 最初に読むdocs | 追加で読むdocs | 主に読むコード | 読まないもの |
| --- | --- | --- | --- | --- |
| README軽微修正 | docs/index.md / docs/context-management.md | 対象README | README周辺のみ | app全体 / resources全体 |
| docs軽微修正 | docs/index.md / docs/context-management.md | 対象docs | 原則コードは読まない | 無関係feature docs / app全体 |
| docs運用最適化 / 補助追加 | docs/index.md / docs/context-management.md / docs/ai/index.md / docs/ai/workflows/index.md / docs/ai/workflows/md-router.md / docs/ai/workflows/md-router-cases.md / docs/ai/workflows/work-result-feedback-loop.md / docs/ai/workflows/loop-engineering.md / docs/templates/pr-summary.md / docs/operations/sensors.md / docs/operations/pr-review-strength.md | docs/operations/command-registry.md / docs/ai/rules/agent-working-policy.md / docs/ai/rules/responsibility-boundaries.md / 必要に応じて docs/commenting.md / LumiLaboに関係する場合だけ docs/lumilabo/index.md | 原則コードは読まない | 無関係feature docs / 無関係Lab docs / アプリコード / Docker構成 / CI設定 / ローカル環境固有情報の内容 |
| 開発フロー修正 | docs/development-flow.md / docs/context-management.md / docs/ai/workflows/md-router.md | docs/testing.md / docs/architecture.md | 原則コードは読まない | featureコード全体 |
| 作業方針修正 | docs/context-management.md / docs/development-flow.md / docs/ai/workflows/md-router.md | AGENTS.md / docs/testing.md | 原則コードは読まない | 無関係feature docs |
| Feature移植準備 | docs/feature-module-portability.md / docs/architecture.md / docs/development-flow.md | docs/prototype-policy.md / docs/ui-development-flow.md / 対象feature docs | 対象Feature配下 / route / console / config / provider / migration / seeder / tests | 無関係Feature / 移植対象外のLab・MOCK・PROTOTYPE・IDEA BOARDコード |
| Feature移植マニフェスト作成 | docs/feature-module-portability.md / 対象feature docs / docs/index.md / docs/architecture.md | 必要に応じて docs/testing.md / docs/frontend.md | 対象Feature配下 / routes/web.php / routes/console.php / config / providers / migrations / seeders / tests / frontend Pages・Components | 無関係Feature / 移植しない段階のコード |
| Feature docs新規作成 | docs/templates/feature-doc-template.md / docs/index.md / docs/architecture.md / docs/testing.md | 対象featureに関係する既存docs / 必要に応じて docs/frontend.md / docs/ui.md | 対象Featureの入口と確認済みコード / 成功テスト | 無関係feature docs / 無関係コード全体 |
| Feature移植先実装 | docs/feature-module-portability.md / 移植元feature docs / 移植先repoのAGENTS・INDEX・ROUTER | 移植先repoの architecture / testing docs | 移植元Featureの移植対象 / 移植先Laravel構成 / 移植先route・config・provider・migration・seeder・tests | 移植対象外Feature / 移植モード外のLab・MOCK・PROTOTYPE・IDEA BOARD |
| PRODUCTのみ移植 | docs/feature-module-portability.md / 対象feature docs / docs/architecture.md / docs/testing.md | docs/frontend.md / docs/ui-development-flow.md | PRODUCT Controller / Request / Action / Service / Repository / DTO / Responder / Strategy / Factory / Job / Enum / Model / Migration / Seeder / Config / Product routes / Console・Scheduler / Product Page・Component / Product tests | IDEA BOARD / MOCK固定データ / MOCK専用Page・Component / PROTOTYPE仮通信 / PROTOTYPE検証Route・Controller / Lab配下の紹介ページ / モック用画像 / 一時的な調査ログ |
| IDEA BOARD作成・修正 | docs/development-flow.md / docs/ui-development-flow.md / docs/guides/frontend-screen-types.md / docs/templates/idea-board-and-mock-template-policy.md / docs/templates/idea-board-template.md | 対象feature docs / 対象Lab docs | 原則コードは読まない。既存IDEA BOARD画面を修正する場合のみ対象Page / Component | Repository / Service / Migration / API / PRODUCT実装 |
| LumiLabo IDEA BOARD / MOCK / UI方針確認 | docs/lumilabo/index.md / docs/development-flow.md / docs/ui-development-flow.md / docs/guides/frontend-screen-types.md | docs/lumilabo/ui-design-guideline.md の対象見出し / docs/lumilabo/project-idea-board.md の対象タブ・対象外・確認観点 / MOCKを扱う場合は docs/lumilabo/project-mock.md | 既存IDEA BOARD / MOCK画面を修正する場合のみ対象Page / Component | LumiLabo以外のfeature docs / 無関係Lab docs / Repository / Service / Migration / API / PRODUCT実装 |
| MOCK作成・修正 | docs/guides/frontend-screen-types.md / docs/frontend.md / docs/ui.md / docs/prototype-policy.md / docs/ui-development-flow.md / docs/templates/idea-board-and-mock-template-policy.md / docs/templates/mock-template.md | 対象feature docs | 対象MOCK Page / Component | Repository / Service / Migration / PRODUCT実装 / 共通Component化判断 |
| PROTOTYPE作成・修正 | docs/guides/frontend-screen-types.md / docs/frontend.md / docs/ui.md / docs/prototype-policy.md / docs/development-flow.md | 対象feature docs | 対象Prototype Page / Component / fixture | 本番用Repository全体 / Migration |
| PRODUCT新規実装 | docs/architecture.md / docs/testing.md / docs/frontend.md / docs/ui.md | 対象feature docs / MOCK / PROTOTYPE由来docs / UI画面種別を選ぶ場合は docs/guides/frontend-screen-types.md | Route / Controller / Request / Action / Service / Repository / DTO / Responder / Component / Test（実装前に責務配置を固定） | 無関係feature docs |
| PRODUCT修正 | docs/architecture.md / docs/testing.md | 対象feature docs / 対象PRの差分 | 変更対象レイヤーと直接依存先（変更対象レイヤーと影響する責務を先に宣言） | リポジトリ全体の無差別探索 |
| コード変更後のコメント・アノテーション追従確認 | docs/commenting.md / docs/operations/sensors.md / docs/operations/pr-review-strength.md | 対象feature docs / 対象言語・レイヤーのdocs | 変更ファイルと関連するコメント / PHPDoc / JSDoc / 型 / props契約説明 | 無関係feature docs / 仕様変更につながる周辺修正 |
| Service修正 | docs/architecture.md / docs/testing.md | 対象feature docs | Service / DTO / Action / Test | UI全体 |
| Repository修正 | docs/architecture.md / docs/testing.md | 対象feature docsが存在する場合は読む | Repository / Model / Migration / Test | 無関係Component |
| DTO修正 | docs/architecture.md / docs/testing.md | 対象feature docs | DTO / ListDTO / Action / Responder / Test | 無関係Repository全体 |
| Request / Validation修正 | docs/architecture.md / docs/testing.md | バリデーション方針docsが存在する場合は読む / 対象feature docs | Request / Controller / Feature Test | 無関係UI全体 |
| React UI修正 | docs/guides/frontend-screen-types.md / docs/frontend.md / docs/ui.md | 対象feature docs | Page / Component / hooks / type | Repository全体 |
| Inertia props修正 | docs/frontend.md / docs/architecture.md / docs/testing.md | 対象feature docs | Controller / Action / Responder / Page / Test | 無関係Service |
| 画面導線修正 | docs/guides/frontend-screen-types.md / docs/frontend.md / docs/ui.md / docs/development-flow.md | 対象feature docs / MOCK / PROTOTYPE docs | Route / Page / Component / Test | 無関係Repository |
| Job修正 | docs/architecture.md / docs/testing.md / コマンド台帳が存在する場合は読む | 対象feature docs | Job / Action / Service / Repository / Test | UI全体 |
| Artisan Command修正 | docs/architecture.md / docs/testing.md / コマンド台帳が存在する場合は読む | 対象feature docs | Command / Action / Service / Test | UI全体 |
| Scheduler修正 | docs/architecture.md / docs/testing.md / コマンド台帳が存在する場合は読む | 存在する運用docs | routes/console.php / Console関連ファイル / Schedule / Command / Job / logs | UI全体 |
| Docker修正 | コマンド台帳が存在する場合は読む / 存在する運用docs | Lightsail / Docker運用docsが存在する場合は読む | docker-compose.yml / docker / nginx / queue / scheduler | Laravel feature全体 |
| 本番反映手順修正 | コマンド台帳が存在する場合は読む / 存在する運用docs | Lightsail / Docker / Git運用docsが存在する場合は読む | docker-compose.yml / deploy手順 / build手順 | 無関係featureコード |
| GitHub Actions / CI修正 | コマンド台帳が存在する場合は読む / docs/testing.md | CI関連docsが存在する場合は読む | .github/workflows / composer / package scripts | 無関係featureコード |
| Git作業 / ローカルGit状態確認 | AGENTS.md / docs/index.md / docs/ai/workflows/md-router.md / コマンド台帳が存在する場合は読む | なし | branch / working tree / diff / commit・push・PR前後のGit状態 | Git作業に関係しないfeature docs / Laravel app全体 / Docker構成 |
| PRレビュー | docs/ai/workflows/md-router.md / PRレビュー強度ルールdocsがrepo内に存在する場合は読む / コマンド台帳が存在する場合は読む | PR種別に応じたdocs | changed files / 直接依存先 / 対応Test | レベル外の全量探索 |
| コメント / PHPDoc / JSDoc整備 | docs/architecture.md / 対象言語docsが存在する場合は読む | 対象feature docs | 対象ファイルのみ | 仕様変更につながる周辺修正 |
| 失敗改善ログ作成 | docs/context-management.md / docs/development-flow.md | 対象PR / 対象docs | 必要な差分のみ | 無関係コード全体 |

## LumiLabo作業の読込最適化

LumiLabo作業では、最初に docs/lumilabo/index.md を入口にする。LumiLabo全体UI方針の正本は docs/lumilabo/ui-design-guideline.md だが、毎回全文読込を前提にしない。

案件作成を扱う場合は、docs/lumilabo/ui-design-guideline.md の「モバイルファースト方針」「ボタン / 操作方針」「画面別ルールの案件作成」「禁止事項」と、フォーム方針に関係する記述を優先する。docs/lumilabo/project-idea-board.md は「案件作成」「作らないもの」「確認観点」を優先する。

案件一覧を扱う場合は、docs/lumilabo/ui-design-guideline.md の「表 / グラフ / カレンダー方針」「画面別ルールの案件一覧」「禁止事項」と、カード型リストやモバイル表示に関係する記述を優先する。docs/lumilabo/project-idea-board.md は「案件一覧」「作らないもの」「確認観点」を優先する。

LumiLabo MOCKを扱う場合は、docs/lumilabo/project-mock.md の「現在の導線」「画面構成」「作らないもの」「確認観点」を優先して読む。

docs/lumilabo/project-idea-board.md は、現在の作業段階に関係するタブ、対象外、確認観点を優先して読む。LumiLabo以外のfeature docsやLab docsは読まない。LumiLabo作業でも、Git操作やPR作成が絡む場合だけ、Git管理外のローカル補助ハーネスを関係箇所に限って確認する。

## Feature移植系作業の詳細

### Feature移植準備

読むMD:

- `docs/feature-module-portability.md`
- `docs/architecture.md`
- `docs/development-flow.md`
- `docs/prototype-policy.md`
- `docs/ui-development-flow.md`
- 対象feature docs

主に読むコード:

- 対象Feature配下
- route
- console
- config
- provider
- migration
- seeder
- tests

読まないもの:

- 無関係Feature
- 移植対象外のLab / MOCK / PROTOTYPE / IDEA BOARDコード

停止条件:

- 移植モードを確定できない
- 移植対象ファイル一覧を固定できない
- Feature docs と現在コードが矛盾している

### Feature移植マニフェスト作成

読むMD:

- `docs/feature-module-portability.md`
- 対象feature docs
- `docs/index.md`
- `docs/architecture.md`

主に読むコード:

- 対象Feature配下
- `routes/web.php`
- `routes/console.php`
- config
- providers
- migrations
- seeders
- tests
- frontend Pages / Components

読まないもの:

- 無関係Feature
- 移植しない段階のコード

停止条件:

- 移植モードを確定できない
- 移植対象と移植しない対象を分けられない
- 存在しないファイルを存在する前提でマニフェストへ書こうとしている

### Feature移植先実装

読むMD:

- `docs/feature-module-portability.md`
- 移植元feature docs
- 移植先repoのAGENTS / INDEX / ROUTER / architecture / testing docs

主に読むコード:

- 移植元Featureの移植対象
- 移植先Laravel構成
- 移植先route / config / provider / migration / seeder / tests

停止条件:

- 移植元repoに差分を出そうとしている
- 複数repoを同一sandboxで同時編集できる前提にしている
- 移植元repoをGitHub参照ではなく作業対象repoとして扱っている
- 移植モードを確定できない
- 移植対象ファイルを固定できない
- 移植先で差し替えるenv / config / route / provider / DB / queue / schedulerを確認できない
- 移植先repoのLaravel構成を確認できない
- 移植元と移植先の責務境界が矛盾している
- Feature docs と現在コードが矛盾している

### PRODUCTのみ移植

読むMD:

- `docs/feature-module-portability.md`
- 対象feature docs
- `docs/architecture.md`
- `docs/testing.md`
- `docs/frontend.md`
- `docs/ui-development-flow.md`

主に読むコード:

- PRODUCT Controller
- Request
- Action
- Service
- Repository
- DTO
- Responder
- Strategy
- Factory
- Job
- Enum
- Model
- Migration
- Seeder
- Config
- Product routes
- Console / Scheduler
- Product Page / Component
- Product tests

読まないもの:

- IDEA BOARD
- MOCK固定データ
- MOCK専用Page / Component
- PROTOTYPE仮通信
- PROTOTYPE検証Route / Controller
- Lab配下の紹介ページ
- モック用画像
- 一時的な調査ログ

停止条件:

- PRODUCTのみ移植なのに Lab / MOCK / PROTOTYPE / IDEA BOARD を混ぜようとしている
- PRODUCT実装に必要なroute / config / provider / migration / seeder / testを確認できない
- 移植対象と移植しない対象を分けられない

## PRODUCT作業の責務配置

PRODUCT新規実装では、作業開始宣言で Route / Controller / Request / Action / Service / Repository / DTO / Responder / Component / Test の責務配置を先に宣言し、固定してから実装します。

PRODUCT修正では、変更対象レイヤーと影響する責務を先に宣言してから修正します。

コード変更後は、変更した責務、入力、出力、DTO形、状態遷移、例外条件、外部API境界、props契約に対して、関連コメント、PHPDoc、JSDoc、型アノテーション、props契約説明が古くなっていないか確認します。

責務配置を作れない場合は、推測で実装せず停止して報告します。

## レビュー強度との対応

PRレビュー時は、MDルーターで読むdocsを固定した後、PRレビュー強度を判定する。

Level 1:
Markdown、コメント、typo、Pintなど。
読む範囲はPR差分と対象docsに限定する。

Level 2:
小規模UI、props、DTO、Serviceの軽微修正。
対象ファイル周辺と最小docsだけ読む。

Level 3:
Action、Service、Repository、DTO、Responder、画面導線、バリデーション、PRODUCT化。
対象feature docs、対象Route、対象レイヤー、対応Testを読む。

Level 4:
Migration、DB、認証認可、Docker、本番反映、Queue、Scheduler、CI、削除処理、外部API更新。
関連docs、運用docs、rollback方針、secrets混入、CIを確認する。

レビュー強度が上がるほど読む範囲は増える。

ただし、Level 4でも無関係コードの全量探索はしない。

## docsとコードが矛盾した場合

コード、テスト、共通docs、feature docsが矛盾している場合、作業者は推測で統合しない。

以下を報告して停止する。

* 矛盾しているdocs
* 矛盾しているコード
* 矛盾しているテスト
* どちらが古い可能性があるか
* 判断に必要な人間の確認事項
* 変更してはいけないファイル
* 次に確認すべき最小範囲

古いdocsを信じて実装を続けない。

現在コードだけを理由に、共通方針違反を正当化しない。

feature docsは共通方針を上書きできない。

## 停止条件

以下の場合、実装や修正へ進まず停止する。

* 作業種別を判定できない
* 読むdocsを固定できない
* docs同士が矛盾している
* docsとコードが矛盾している
* docsとテストが矛盾している
* PR本文と差分が一致していない
* 指示された作業範囲外の変更が必要に見える
* 既存仕様を削る必要がある
* 本番影響があるのに運用docsを確認できない
* MigrationやDB変更があるのにrollback方針がない
* secrets / env / token / 個人情報が含まれる可能性がある
* mainへ直接書き込みそうになっている
* 対象ブランチが確認できない
* 作業対象repo、差分を出すrepo、PRを作成するrepoを確認できない
* Laravel / React / app docs / tests / feature docs の作業なのに、外側repo `laravel11-docker` に差分が出ている
* Docker / compose / nginx / deploy / Lightsail運用作業ではないのに、外側repo `laravel11-docker` にPRを作成しようとしている
* 外側repoから開始したアプリ作業で、内側アプリrepo `codex-practice001` の remote / branch / status を確認できない
* PRODUCT実装なのに責務配置を固定できない
* IDEA BOARD / MOCK / PROTOTYPE段階なのに Repository / Service / DTO / Responder を作り込もうとしている
* ディレクトリ作成が責務設計より先行している
* 確認コマンドが未定義で、代替実行すると危険がある
* 存在しないdocsを前提にしている
* docsパスを確認せずに新規参照として追加しようとしている

停止時は、勝手に代替実装しない。

## docsが古い可能性がある場合

docsが古い可能性がある場合でも、自己判断でdocsを書き換えてから実装しない。

先に以下を報告する。

* 古い可能性があるdocs
* 現在コードとの差分
* 影響する作業種別
* 更新が必要なdocs
* 実装を進めてよいか判断が必要な点

人間が判断した後に、docs更新または実装修正へ進む。

## 読まないdocsの扱い

「読まないdocs」は無視してよいという意味ではない。

今回の作業に不要な文脈を読み込まないという意味である。

作業中に依存が判明した場合のみ、読む範囲を追加する。

追加する場合は、なぜ追加で読む必要があるかを明示する。

## MDルーターの保守ルール

MDルーターは一度作って終わりではない。

新しい作業種別、新しいdocs、新しいfeature docs、新しい運用手順、新しい失敗例が出た場合は、作業後にMDルーターを見直す。

見直しでは、以下を判定する。

* 追加する作業種別があるか
* 削除する作業種別があるか
* 読むdocsが増えたか
* 読むdocsが減ったか
* 読まないdocsを明記すべきか
* 停止条件を追加すべきか
* PRレビュー強度との対応を修正すべきか
* 実際の作業で過剰探索が発生したか
* 実際の作業で必要docsを読み漏らしたか
* docsとコードの矛盾が発生したか
* 存在しないdocs参照が混ざっていないか

## 追加・削除・修正の基準

### 追加する場合

以下の場合は、MDルーターへ作業種別または参照docsを追加する。

* 新しい作業種別が発生した
* 新しいdocsを作成した
* 新しいfeature docsを作成した
* 本番運用、Docker、Queue、Scheduler、CIなどの新しい運用手順を追加した
* 既存の対応表では読むdocsを固定できなかった
* 作業中に過剰探索した
* 作業中に必要docsを読み漏らした

### 修正する場合

以下の場合は、既存のルーティングを修正する。

* 読むdocsが多すぎた
* 読むdocsが少なすぎた
* 読まないdocsの指定が曖昧だった
* 作業種別とPRレビュー強度が合っていなかった
* 実際の作業順とルーティング表がずれていた
* feature docsと共通docsの関係が曖昧だった
* 停止条件が不足していた
* 存在しないdocsを参照していた
* Laravelやライブラリの実構成と合わないファイル名を前提にしていた

### 削除する場合

以下の場合は、MDルーターから削除する。

* 存在しないdocsを参照している
* 廃止した作業種別が残っている
* 古い運用手順を参照している
* 現在の開発フローと合わない参照が残っている
* 別docsへ統合済みの内容を重複して参照している

古いルーティングを残すと、古いdocsを信じて迷走するため、不要な参照は削除する。

## 作業後チェック

各PRまたは作業完了時に、以下を確認する。

* 今回の作業種別はMDルーターに存在するか
* 実際に読んだdocsはMDルーターと一致していたか
* 読まなくてよいdocsを読んでいないか
* 読むべきdocsを読み漏らしていないか
* 新しく追加したdocsをMDルーターへ反映したか
* `docs/ai/workflows/work-result-feedback-loop.md` で今回の結果の反映先を確認したか
* PR Summaryに実行結果として残す内容と、docs更新要否を分けて確認したか
* branch運用とcommit粒度をPR前に確認したか
* ソースコード変更時に、関連コメント、PHPDoc、JSDoc、型アノテーション、props契約説明の追従漏れがないか確認したか
* ローカル環境固有の情報をGit管理docsやPR本文へ混ぜていないか
* 廃止・統合したdocsをMDルーターから外したか
* 停止条件に追加すべき失敗があったか
* PRレビュー強度との対応にズレがないか
* 存在しないdocs参照を追加していないか
* 作業対象repoとPR作成先repoが一致していたか
* アプリ作業で外側repo `laravel11-docker` に差分やPRを作っていないか

「毎回必ずMDルーターを更新する」ではない。

毎回チェックし、必要がある場合だけ追加・削除・修正する。

不要な更新を繰り返すと、MDルーター自体が肥大化し、逆に迷走原因になる。

## 最終原則

MDルーターは、作業者の探索範囲を固定するための運用docsである。

開発フロー、docs構成、feature docs、運用手順が変わった場合、MDルーターも更新する。

MDルーターが古くなった場合、作業者は古いルーティングを信じて作業してしまう。

そのため、作業ごとにMDルーターの追加・削除・修正の必要性を確認する。

MDルーターは、作業の自由度を奪うためのものではない。

迷わず力を使えるように、読む入口と読む範囲を固定するためのもの。

人間が作業種別と責務境界を握る。

作業者は固定された範囲の中で調査、実装、テスト、レビューを行う。
