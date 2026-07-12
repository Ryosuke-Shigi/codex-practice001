# MDルーター

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-10

## 目的

このMDは、作業種別から必要なdocsと対象コードへ進むためのルーターです。
全量精読する資料ではありません。該当する作業プロファイルだけを使い、必要な情報を削らずに無関係な文脈を読みません。

## 基本導線

1. [AGENTS.md](../../../AGENTS.md) でrepo境界と共通安全ルールを確認する
2. このMDで該当する作業プロファイルを選ぶ
3. プロファイルの「読む」から共通docs、feature / project docs、対象コードへ進む
4. 依存が判明した場合だけ「条件付きで読む」を追加する
5. 作業後は [work-result-feedback-loop.md](work-result-feedback-loop.md) で戻し先を確認する

[docs/index.md](../../index.md) は通常作業で毎回読むものではありません。正本確認、docs配置判断、docs体系変更、ルーターで参照先を確定できない場合、docsの役割・Status・正本が衝突する場合に使います。

具体例が必要な場合だけ [md-router-cases.md](md-router-cases.md) を読みます。ケース集はこのMDの正本ルートを上書きしません。

## 正本

| 観点 | 正本 |
|---|---|
| Git / branch / commit / PR | [agent-working-policy.md](../rules/agent-working-policy.md) |
| ADR Pattern、責務境界 | [responsibility-boundaries.md](../rules/responsibility-boundaries.md)、[architecture.md](../../architecture.md) |
| コマンドとroot / `src/` Git境界 | [command-registry.md](../../operations/command-registry.md) |
| PRレビュー強度 | [pr-review-strength.md](../../operations/pr-review-strength.md) |
| 検出項目 | [sensors.md](../../operations/sensors.md) |
| 作業後の戻し先 | [work-result-feedback-loop.md](work-result-feedback-loop.md) |
| 文脈読込と理解再起動 | [context-management.md](../../context-management.md) |
| 機能固有仕様 | 該当する `docs/features/` または既存project docs |
| ローカル環境固有情報 | Git管理外の `.local/`。共有docsの正本にはしない |

## 作業開始時に固定すること

- 作業種別、対象repo、対象階層
- 変更対象、編集しない対象
- 読む、条件付きで読む、読まないdocs
- 確認コマンド、PRレビュー強度
- 停止条件

作業種別または対象repoを判定できない場合は、探索を広げず停止します。

## 共通停止条件

次の場合は推測で進めません。

- 指示、docs、コード、テストが矛盾する
- PDF、画像、画面キャプチャなどの視覚資料に数値や配置があっても、承認済みの別情報源で仕様と確認できない
- 対象repo、branch、既存差分を確認できない
- `main` へ直接差分を出そうとしている
- 対象外ファイルまたは別repoの変更が必要になる
- 仕様、責務配置、確認コマンドを確定できない
- secrets、個人情報、本番接続、破壊的操作に触れる
- 存在しないdocsやコマンドを前提にする
- Git管理docsとローカル補助ハーネスが矛盾する

## 作業プロファイル

### 小さいReact / 既存MOCK修正

- 読む: 対象feature / project docsの該当箇所、対象Page / Component / Hook / Type / Test、対象画面の現在導線と固定仕様
- 条件付きで読む: React責務やComponent構造を変える場合だけ `docs/frontend.md`、UI共通方針やCommon / Effectsを変える場合だけ `docs/ui.md`、UI責務を変える場合だけ `docs/guides/ui-component-responsibility-rules.md`、画面種別を変える場合だけ `docs/guides/frontend-screen-types.md`、props契約を変える場合だけ `docs/architecture.md` と `docs/testing.md`、新しい画面導線やProduct Design判断が必要な場合だけ `docs/product-design/index.md`
- 読まない: 無関係feature docs、Backend共通docs、Repository、Migration、Docker / 本番運用docs、Storage、Queue、Scheduler
- 編集しない: DB、Backend責務、PRODUCT / MOCKのうち今回と異なる段階
- 停止条件: 対象画面の固定仕様を確認できない、props、Route、API、DB条件の変更が必要になる、MOCK未確認範囲を補完する必要がある
- 確認コマンド: [command-registry.md](../../operations/command-registry.md) のReact / TypeScript変更時のコマンド
- PRレビュー強度: 原則Level 2。propsや画面導線、複数レイヤーへ広がる場合はLevel 3

### 新しいMOCK画面 / 画面導線

- 読む: `docs/product-design/index.md`、対象feature / project docs、`docs/templates/mock-template.md`、対象となる既存画面・Route・Page / Component
- 条件付きで読む: 段階境界を判断する場合は `docs/development-flow.md`、UI契約を接続する場合は `docs/ui-development-flow.md`、MOCK / Prototype配置を判断する場合は `docs/prototype-policy.md`、画面種別を判断する場合は `docs/guides/frontend-screen-types.md`、React / UI責務を変える場合は `docs/frontend.md`、`docs/ui.md`、`docs/guides/ui-component-responsibility-rules.md`、IDEA BOARD / MOCK共通構造を変える場合は `docs/templates/idea-board-and-mock-template-policy.md`
- 読まない: Backend、DB、Storage、Migration、Queue、Scheduler、本番運用docs
- 編集しない: Controller、Request、Action、Service、Repository、DTO、Responder、Migration
- 停止条件: MOCK確認なしにPRODUCT仕様を確定する、Backendや永続化が必要になる、画面範囲を判断できない
- 確認コマンド: [command-registry.md](../../operations/command-registry.md) のReact / TypeScript変更時のコマンド
- PRレビュー強度: UIのみはLevel 2。Routeや画面導線変更を含む場合はLevel 3

### IDEA BOARD

- 読む: `docs/product-design/index.md`、対象feature / project docs、`docs/templates/idea-board-template.md`
- 条件付きで読む: 共通構造が必要な場合は `docs/templates/idea-board-and-mock-template-policy.md`、画面種別を選ぶ場合は `docs/guides/frontend-screen-types.md`、UI契約や段階間の引き継ぎを判断する場合は `docs/development-flow.md` または `docs/ui-development-flow.md`、既存画面を変える場合だけ対象Page / Component
- 読まない: 無関係feature docs、Repository、Service、Migration、API、DB保存、PRODUCT実装
- 編集しない: Backend、DB、API、PRODUCTコード
- 停止条件: IDEA BOARDの目的と範囲を確定できない、MOCKやPRODUCTの仕様を先取りする必要がある
- 確認コマンド: docsのみは `git diff --check`。既存画面を変えた場合はReact / TypeScript変更時のコマンド
- PRレビュー強度: docsのみはLevel 1。既存画面変更を含む場合はLevel 2

### PROTOTYPE

- 読む: `docs/prototype-policy.md`、`docs/development-flow.md`、対象feature / project docs、対象Prototype Page / Component / fixture
- 条件付きで読む: UI契約の接続は `docs/ui-development-flow.md`、React責務変更は `docs/frontend.md` と `docs/ui.md`、画面種別判断は `docs/guides/frontend-screen-types.md`
- 読まない: 本番用DB保存、正式なRepository、本番Scheduler、本番権限判断、無関係feature docs
- 編集しない: PRODUCT実装、Migration、本番設定
- 停止条件: PROTOTYPEの検証目的を確定できない、PrototypeコードをそのままPRODUCTへ昇格する必要がある
- 確認コマンド: [command-registry.md](../../operations/command-registry.md) のReact / TypeScript変更時のコマンド
- PRレビュー強度: 原則Level 2。画面導線や複数レイヤーへ広がる場合はLevel 3

### LumiLabo既存MOCKの小修正

- 読む: `docs/lumilabo/project-mock.md` の対象画面・導線・対象外、対象Page / Component / Test
- 条件付きで読む: LumiLabo全体UI方針を変える場合だけ `docs/lumilabo/ui-design-guideline.md` の該当見出し、IDEA BOARD上の説明へ影響する場合だけ `docs/lumilabo/project-idea-board.md` の該当箇所、React / UI責務を変える場合だけ関連共通docs
- 読まない: LumiLabo以外のfeature docs、Backend、DB、API、S3、Queue、Scheduler、無関係なLumiLabo文書の全文
- 編集しない: LumiLaboの固定仕様と異なる段階、Backend、DB、API
- 停止条件: 案件内ファイルタグ、戻る導線、保存済み写真・ファイル0件時の非表示等の対象MOCK固定仕様を確認できない、共通UI docsで機能固有仕様を上書きする必要がある
- 確認コマンド: [command-registry.md](../../operations/command-registry.md) のReact / TypeScript変更時のコマンド
- PRレビュー強度: 原則Level 2。Routeや画面導線変更を含む場合はLevel 3

### Backend PRODUCT実装 / 修正

- 読む: [responsibility-boundaries.md](../rules/responsibility-boundaries.md)、`docs/architecture.md`、`docs/testing.md`、対象feature docs、対象Routeと変更レイヤー
- 条件付きで読む: 新規PRODUCT実装・PRODUCT化・段階移行は `docs/development-flow.md`、MOCK / PROTOTYPEのUI契約を引き継ぐ場合は `docs/ui-development-flow.md`、新規PRODUCT実装または実装作法・型・コメント条件へ影響する場合は `docs/coding-standards.md` と `docs/commenting.md`、Inertia propsは `docs/frontend.md`、外部APIは `docs/security.md` と `docs/logging.md`、Job / Schedulerはcommand registryと対象運用docs
- 軽量化: 既存PRODUCTの小修正で段階移行、UI契約、実装作法、型、コメント条件へ影響しない場合は、上記の条件付きdocsを追加しない
- 読まない: 無関係feature docs、無関係UI、Docker / 本番docs
- 編集しない: 責務配置と関係しないレイヤー、確認済み範囲外のUI仕様
- 停止条件: Action / Service / Repository / DTO / Responderの責務を固定できない、feature docsと現在コードが矛盾する
- 確認コマンド: [command-registry.md](../../operations/command-registry.md) のLaravel変更時のコマンド。React / TypeScript / Inertia Page / Componentに差分がある場合は、対象テスト、typecheck、buildも追加する。未実行の確認がある場合は理由をPR本文へ記載する
- PRレビュー強度: 原則Level 3。DB、認証認可、外部API更新、Queue / Schedulerへ触れる場合はLevel 4

### Feature移植

- 移植モード: `full` / `product-only` / `mock-only` / `prototype-only` / `idea-board-only` のいずれかを最初に固定する
- 読む: `docs/feature-module-portability.md`、対象feature docs、移植元・移植先の対象段階に必要なdocs、移植先repoのAGENTS / MDルーター / architecture / testing等の必要範囲
- 条件付きで読む: 選択した移植モードと移植先構成に必要なroute / config / provider / DB / queue / scheduler / UI docs
- 守ること: 移植元repoは参照専用とし、差分は移植先repoだけへ出す。`product-only` 以外をBackend PRODUCT作業へ寄せず、存在未確認のファイルや構成をマニフェストへ書かない
- 読まない: 無関係Feature、選択した移植モードで移植しない段階、未確認のファイルや構成
- 編集しない: 移植元repo、移植対象外ファイル、差し替え条件を確認できない設定
- 停止条件: 移植モード、移植元・移植先、移植対象・除外対象・差し替え対象を固定できない、移植元へ差分が必要になる、env / route / config / provider / DB / queue / scheduler等の差し替え条件を確認できない
- 確認コマンド: 移植先repoのcommand registryと選択した移植モードに従う
- PRレビュー強度: docs / マニフェストのみはLevel 1。PRODUCTや複数レイヤーはLevel 3、DB・認証認可・Queue / Scheduler等はLevel 4

### docsのみの修正

- 読む: 対象docs、そのdocsが直接参照する正本
- 条件付きで読む: docs体系・配置・正本を変える場合は [docs/index.md](../../index.md)、文脈運用を変える場合は [context-management.md](../../context-management.md)、入口を変える場合はこのMDと [work-result-feedback-loop.md](work-result-feedback-loop.md)
- 読まない: 無関係feature docs、アプリコード、Docker / 本番docs
- 編集しない: PHP、TypeScript、テスト、設定、`.local/`（ローカル環境固有作業として明示された場合を除く）
- 停止条件: 新規MDの目的・配置先・正本・Status・索引更新先を確定できない、既存MDとの重複可能性を解消できない、機能仕様やコード変更が必要になる
- 確認コマンド: `git diff --check`。必要に応じて既存のdocs確認コマンド
- PRレビュー強度: 原則Level 1。AGENTS、索引、ルーター、Sensors、operations docsの導線変更はLevel 2以上

目的、配置先、正本、必要な索引更新が確定しているfeature docs、運用正本、テンプレート等は新規作成できます。新規MDを作る場合も、重複文書を増やさず、必要な索引とルーターだけを更新します。

### PRレビュー Level 1〜4

- 読む: [pr-review-strength.md](../../operations/pr-review-strength.md)、PR本文、changed files、diff、実行済み確認、CI結果
- 条件付きで読む: レベルと差分に応じた共通docs、feature docs、対象コード、[sensors.md](../../operations/sensors.md)
- 読まない: レベル外の全量docs、無関係feature、無関係コード
- 編集しない: レビューのみの依頼ではファイルを変更しない
- 停止条件: PR本文と差分が一致しない、影響範囲やレベルを判定できない、CI失敗の原因を判定できない
- 確認コマンド: レベルと差分に応じて [command-registry.md](../../operations/command-registry.md) から選ぶ
- PRレビュー強度: docs・typoはLevel 1、小規模UI等はLevel 2、複数レイヤーはLevel 3、DB・認証認可・本番・Docker・Security等はLevel 4。詳細定義は正本を参照する

### Migration / 認証 / 認可 / Security

- 読む: `docs/architecture.md`、`docs/testing.md`、`docs/security.md`、対象feature docs、対象Migration / Model / Request / Policy / Middleware / Test
- 条件付きで読む: 本番影響がある場合は確認済み運用docs、コマンドは [command-registry.md](../../operations/command-registry.md)
- 読まない: 無関係UI、無関係feature docs、確認されていない本番手順
- 編集しない: 無関係schema、secrets、外側repoのDocker構成
- 停止条件: rollback、権限境界、既存データ影響、秘密情報の扱いを確認できない
- 確認コマンド: command registryに登録されたLaravel、Migration、Security関連の確認
- PRレビュー強度: Level 4

### GitHub Actions / CI

- 読む: `docs/testing.md`、[command-registry.md](../../operations/command-registry.md)、対象workflow、対象composer / package scripts、存在確認できたCI関連docs
- 条件付きで読む: secretsや権限を扱う場合は `docs/security.md`、Docker構成へ影響する場合は外側repoの正本、MigrationやDBへ影響する場合だけMigration関連範囲
- 読まない: 無関係feature docs、無関係なMigration / 認証 / 認可コード、LumiLaboやUI固有仕様
- 編集しない: 無関係workflow、未確認script、目的外のアプリ・DB・Docker構成
- 停止条件: workflow、実行script、権限、secrets、対象runnerを確認できない、外側repoやDB変更が必要になる
- 確認コマンド: command registryと対象workflowに存在するコマンド
- PRレビュー強度: Level 4

### Docker / nginx / Lightsail / 本番運用

- 読む: 外側repoの `AGENTS.md` とroot側AI docs、確認済み運用docs
- 条件付きで読む: アプリ側コマンド境界が必要な場合だけ [command-registry.md](../../operations/command-registry.md)
- 読まない: 無関係feature docs、React UI、LumiLabo仕様
- 編集しない: アプリrepoのLaravel / React / app docs / tests
- 停止条件: 外側repoを確認できない、本番コマンド・rollback・権限・対象環境が未確認
- 確認コマンド: 外側repoの正本に登録されたコマンドのみ
- PRレビュー強度: Level 4

### Git / branch / commit / PR作業

- 読む: [agent-working-policy.md](../rules/agent-working-policy.md)、[command-registry.md](../../operations/command-registry.md)
- 条件付きで読む: PRレビュー時は [pr-review-strength.md](../../operations/pr-review-strength.md)、PR本文作成時は `docs/templates/pr-summary.md`
- 読まない: Git作業と関係しないfeature docs、アプリ全体、Docker構成
- 編集しない: 対象外repo、既存未コミット差分、Git管理外ローカルファイル
- 停止条件: remote / branch / status / diffを確認できない、main直接作業、履歴変更やforce pushが必要になる
- 確認コマンド: command registryのGit確認コマンド
- PRレビュー強度: 作成する差分の内容に合わせる。Git操作だけでレベルを下げない

### `.local` を確認するローカル環境固有作業

- 読む: Git管理docsの該当プロファイル、存在する場合だけ `.local/index.md` の該当箇所
- 条件付きで読む: Git / gh / WSL / ローカル実行差分に直接関係するlocalファイル
- 読まない: 関係しないlocalメモ、個人情報、secrets、無関係feature docs
- 編集しない: local情報を根拠にした製品仕様、共通責務、PR本文。Git管理外ファイルをstageしない
- 停止条件: Git管理docs・コード・テストとlocal情報が矛盾する、秘密情報を引用する必要がある
- 確認コマンド: Git管理対象かを確認し、対象作業プロファイルのコマンドを使う
- PRレビュー強度: 実際のGit管理差分に合わせる

## その他の作業の割り当て

| 作業 | 基本プロファイル | 追加で読む正本 |
|---|---|---|
| Queue / Job / Scheduler | Backend PRODUCT実装 / 修正 | `docs/architecture.md`、`docs/testing.md`、command registry |
| コメント / PHPDoc / JSDoc | 差分元の作業プロファイル | `docs/commenting.md` |

既存プロファイルで読む範囲を固定できない新しい作業種別が出た場合は、推測で近いルートへ押し込まず停止します。背景や具体例はこのMDへ増やしすぎず、必要なら既存の [md-router-cases.md](md-router-cases.md) へ追加します。

## 読まないdocsの扱い

「読まない」は無視してよいという意味ではなく、今回の作業に不要な文脈を先に除外する指定です。
作業中に直接依存が判明した場合だけ、理由を明示して「条件付きで読む」へ追加します。

## 保守

- 新しい作業種別、docs、失敗例が出たときだけルート変更の要否を確認する
- 同じ詳細ルールを複製せず、正本へのリンクを置く
- feature固有仕様を共通ルートへ移さない
- 廃止・移動したdocs、`archived` / `superseded` の参照を残さない
- ルーターを毎回更新せず、実際の読込過多・不足・矛盾があった場合だけ直す

## 作業後

[work-result-feedback-loop.md](work-result-feedback-loop.md) で、今回の結果を正本docs、feature docs、型、コメント、テスト、PR Summary、Sensorsのどこへ戻すか確認します。
ローカル環境固有情報はGit管理docsやPR本文へ戻しません。
