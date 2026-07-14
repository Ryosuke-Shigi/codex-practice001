# Documentation Index

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-14

## このドキュメントの目的

この文書は、docs全体の総合索引、用途別の正本、配置基準、文書Statusを確認するための案内板です。
通常作業は `AGENTS.md` から `docs/ai/workflows/md-router.md` の該当プロファイルへ進み、この文書を毎回全文確認しません。

この文書を確認する条件:

- 用途ごとの正本を確認する
- 新しいdocsの配置先や索引更新先を判断する
- docs体系、参照導線、文書Statusを変更する
- MDルーターだけでは参照先を判断できない
- docs同士の役割、正本、`active / archived / superseded` が衝突している

## 用途別の正本

| 用途 | 正本 |
|---|---|
| 全作業の短い入口、安全境界 | `AGENTS.md` |
| 作業種別ごとの参照範囲 | `docs/ai/workflows/md-router.md` |
| docs全体の索引、配置基準、Status | この文書 |
| Git / branch / commit / PR | `docs/ai/rules/agent-working-policy.md` |
| Subagent / model routing / runtime確認 | `docs/ai/rules/model-routing-policy.md` |
| コマンド実行、root / `src/` Git境界 | `docs/operations/command-registry.md` |
| ADR Pattern、用語、責務境界 | `docs/ai/rules/responsibility-boundaries.md`、`docs/architecture.md` |
| Product Design / IDEA BOARD / MOCK / Coding境界 | `docs/product-design/index.md` |
| PRレビュー強度 | `docs/operations/pr-review-strength.md` |
| 検出項目 | `docs/operations/sensors.md` |
| 作業後の反映先 | `docs/ai/workflows/work-result-feedback-loop.md` |
| 文脈読込、探索範囲、理解再起動 | `docs/context-management.md` |
| コメント、PHPDoc、JSDoc | `docs/commenting.md` |
| 機能固有の意図・制約 | 該当する `docs/features/` |
| 実装済みの現在挙動 | 現在のコード、Migration、設定、成功しているテスト |
| 外部向け説明 | `README.md` |
| ローカル環境固有情報 | Git管理外の `.local/` |

feature docsは共通ルールを上書きしません。コード、テスト、共通docs、feature docsが矛盾する場合は自動的に優先せず、差異を報告して停止します。
ローカル専用メモは共有docsの正本にせず、Git管理docsやPR本文へ内容を転記しません。

## 用語の正本

| 用語 | 確認先 |
|---|---|
| ADR Pattern | `docs/ai/rules/responsibility-boundaries.md`、`docs/architecture.md` |
| Decision Record / 設計判断記録 | `docs/ai/rules/responsibility-boundaries.md`、`docs/architecture.md` |
| Command Action / Query Action / Artisan Command | `docs/ai/rules/responsibility-boundaries.md`、`docs/architecture.md` |
| IDEA BOARD / MOCK / PROTOTYPE / PRODUCT | `docs/development-flow.md`、`docs/product-design/index.md` |

この索引では詳細定義を複製せず、用語を変更する場合に更新すべき正本を示します。

## 共通docs

| 文書 | 役割 |
|---|---|
| `docs/ai/index.md` | AI作業用docsの補助索引 |
| `docs/ai/rules/agent-working-policy.md` | 作業条件、Git / PR、停止条件、完了確認 |
| `docs/ai/rules/model-routing-policy.md` | 17役の選択、model / reasoning、権限、単一writer、runtime確認 |
| `docs/ai/rules/responsibility-boundaries.md` | ADR Pattern、用語、責務境界 |
| `docs/ai/workflows/md-router.md` | 作業種別ごとの読む・読まない範囲、停止条件 |
| `docs/ai/workflows/md-router-cases.md` | MDルーターの実戦ケース集 |
| `docs/ai/workflows/loop-engineering.md` | 実行、確認、修正、再確認、記録の作業ループ |
| `docs/ai/workflows/work-result-feedback-loop.md` | 作業後の反映先判定 |
| `docs/context-management.md` | 文脈読込、探索範囲、理解再起動 |
| `docs/development-flow.md` | IDEA BOARD / MOCK / PROTOTYPE / PRODUCT |
| `docs/ui-development-flow.md` | UI工程と段階間の契約 |
| `docs/feature-module-portability.md` | Feature Module移植 |
| `docs/architecture.md` | 実装レイヤー責務の詳細 |
| `docs/coding-standards.md` | PHP / TypeScript / React / CSSの実装作法 |
| `docs/testing.md` | テスト追加、仕様固定、CI確認 |
| `docs/frontend.md` | React / Inertia / TypeScript、props、Component責務 |
| `docs/ui.md` | UI、Common、モバイル、操作、Effects |
| `docs/prototype-policy.md` | MOCK / Prototypeの配置とProductとの分離 |
| `docs/logging.md` | ログ分類、出力責務、保持 |
| `docs/security.md` | 秘密情報、本番接続、破壊的操作 |
| `docs/commenting.md` | コメント、PHPDoc、JSDoc |
| `docs/storage.md` | Storageの共通境界 |
| `docs/guides/frontend-screen-types.md` | Frontend画面種別 |
| `docs/guides/ui-component-responsibility-rules.md` | Page / Layout / Section / Field / Parts / Hook責務 |
| `docs/operations/command-registry.md` | 実行コマンドとGit境界 |
| `docs/operations/pr-review-strength.md` | PRレビュー強度 |
| `docs/operations/sensors.md` | 検出項目の台帳 |
| `docs/operations/code-responsibility-inventory.md` | コード責務棚卸し |
| `docs/templates/pr-summary.md` | PR本文テンプレート |

この一覧は全部読むリストではありません。読む範囲はMDルーターの該当プロファイルで決めます。

## 機能固有文書

機能固有の実行条件、DB条件、API制約、表示条件、テスト固定仕様は、共通docsへ移さず該当文書に置きます。

| 文書 | 対象 |
|---|---|
| `docs/features/api-discovery-hub.md` | API Discovery Hub |
| `docs/features/dance-shorts-analyzer.md` | DanceShortsAnalyzer |
| `docs/features/dance-shorts-radar.md` | DanceShortsRadar |
| `docs/features/japan-quake-wave-map.md` | Japan Quake Wave Map |
| `docs/features/application-logs.md` | Project Hub logs |

新しい機能固有文書を追加した場合は、この一覧と必要なルーターだけを更新します。

## Product Design / LumiLabo

| 文書 | 対象 |
|---|---|
| `docs/product-design/index.md` | IDEA BOARD / MOCK / Coding境界、Coding前ゲート |
| `docs/lumilabo/index.md` | LumiLabo docs入口 |
| `docs/lumilabo/ui-design-guideline.md` | LumiLabo画面設計・表示・操作方針 |
| `docs/lumilabo/project-idea-board.md` | LumiLabo案件システム IDEA BOARD |
| `docs/lumilabo/project-mock.md` | LumiLabo案件システム MOCK |

Product DesignやLumiLaboに関係しない作業では、これらを読みません。

## テンプレート

| 文書 | 用途 |
|---|---|
| `docs/templates/pr-summary.md` | Pull Requestのレビュー用まとめ |
| `docs/templates/feature-doc-template.md` | 新規Feature docs |
| `docs/templates/idea-board-and-mock-template-policy.md` | IDEA BOARD / MOCK共通ルール |
| `docs/templates/idea-board-template.md` | IDEA BOARD |
| `docs/templates/mock-template.md` | MOCK |

## 文書の配置基準

### `AGENTS.md`

全作業で守らないと事故につながる短い入口ルールと、MDルーター・正本へのリンクだけを置きます。

### `docs/ai/rules/`

複数作業に共通する作業条件、停止条件、責務境界を置きます。

### `docs/ai/workflows/`

作業種別の分岐、作業ループ、作業後の戻し先を置きます。背景や実例は正本ルーターへ増やしすぎず、既存ケース集へ分けます。

### 共通方針docs

複数機能に共通する設計、実装、テスト、UI、Security等の判断基準を置きます。

### `docs/features/`

特定機能だけに有効な目的、仕様、入口、処理フロー、テスト固定内容を置きます。

### `docs/product-design/`

IDEA BOARD / MOCK / Coding境界とCoding前ゲートを置きます。実装責務の詳細は責務境界docsを正本とします。

### `docs/operations/`

確認コマンド、レビュー強度、Sensorsなど、反復して使う運用ルールを置きます。

### `README.md`

外部閲覧者向けの概要、技術構成、利用方法を置きます。内部ルールを複製しません。

### ローカル・一時情報

会話ログ、個人メモ、ローカル環境差分、秘密情報はGit管理docs体系へ含めません。

## 文書メタデータ

長期保存する文書には、必要に応じて次を付けます。

```text
Status: active / archived / superseded
Scope: 適用リポジトリ・機能
Last reviewed: YYYY-MM-DD
Canonical source: 用途ごとの正本となる文書・コード・テスト
Supersedes: 置き換えた旧資料
```

`Canonical source` は全用途を1本へ集約する意味ではありません。古い資料を残す場合は `archived` または `superseded` を明記し、通常ルートから外します。

## 更新ルール

- 共通ルール変更時は、正本だけを先に更新する
- 機能仕様変更時は、コード・テストと該当feature docsを更新する
- 新規docs追加時は、配置先、正本、必要な索引・ルートだけを更新する
- 同じ詳細ルールを複数文書へ全文複製しない
- 正本以外には、その文書の責務に必要な短い要約とリンクだけを置く
- 作業完了前に `docs/ai/workflows/work-result-feedback-loop.md` で反映先を確認する
- ローカル環境固有情報をGit管理docsやPR本文へ混ぜない
