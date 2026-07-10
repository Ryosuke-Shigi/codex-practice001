# Work Rules Index

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-10

## 目的

このファイルは、アプリ側のAI作業ルールとworkflow docsの補助索引です。
通常作業の入口は `AGENTS.md` と `docs/ai/workflows/md-router.md` であり、この索引を毎回読む必要はありません。

次の場合に確認します。

- AI作業用docsの配置や役割を確認する
- rules / workflows / projects / logs の参照先を探す
- MDルーターだけでは参照先を判断できない
- AI作業用docsの構成を変更する

`docs/ai/` は既存配置名であり、個別ツールの一時メモやローカル環境情報の格納先ではありません。

## 通常作業の参照順

1. [AGENTS.md](../../AGENTS.md)
2. [MDルーター](workflows/md-router.md) の該当作業プロファイル
3. プロファイルで指定された共通docs、feature docs、対象コード
4. 作業後に [work-result-feedback-loop.md](workflows/work-result-feedback-loop.md)

[docs/index.md](../index.md) は、正本確認、docs配置判断、docs体系変更、役割・Status衝突時に確認する総合索引です。

## 共通ルール

| Path | 役割 |
|---|---|
| [rules/agent-working-policy.md](rules/agent-working-policy.md) | 作業条件、Git / PR、停止条件、完了確認 |
| [rules/responsibility-boundaries.md](rules/responsibility-boundaries.md) | ADR Pattern、用語、責務境界 |
| [../architecture.md](../architecture.md) | 実装レイヤー責務の詳細 |
| [../coding-standards.md](../coding-standards.md) | PHP / TypeScript / React / CSSの実装作法 |
| [../commenting.md](../commenting.md) | コメント、PHPDoc、JSDoc |
| [../security.md](../security.md) | 秘密情報、本番接続、破壊的操作 |

## 作業フロー

| Path | 役割 |
|---|---|
| [workflows/index.md](workflows/index.md) | workflow docsの索引 |
| [workflows/md-router.md](workflows/md-router.md) | 作業プロファイルごとの読む・読まない範囲、停止条件 |
| [workflows/md-router-cases.md](workflows/md-router-cases.md) | MDルーターの実戦ケース集 |
| [workflows/loop-engineering.md](workflows/loop-engineering.md) | 実行、確認、修正、再確認、記録の作業ループ |
| [workflows/work-result-feedback-loop.md](workflows/work-result-feedback-loop.md) | 作業後の反映先判定 |
| [../product-design/index.md](../product-design/index.md) | Product Design、IDEA BOARD / MOCK / Coding境界 |
| [../development-flow.md](../development-flow.md) | IDEA BOARD / MOCK / PROTOTYPE / PRODUCT |
| [../ui-development-flow.md](../ui-development-flow.md) | UI作成工程と段階間の契約 |
| [../prototype-policy.md](../prototype-policy.md) | MOCK / Prototypeの配置とProductとの分離 |
| [../testing.md](../testing.md) | テスト追加、仕様固定、CI確認 |
| [../operations/command-registry.md](../operations/command-registry.md) | コマンド実行、root / `src/` Git境界 |
| [../operations/pr-review-strength.md](../operations/pr-review-strength.md) | PRレビュー強度 |
| [../operations/sensors.md](../operations/sensors.md) | 検出項目の台帳 |
| [../templates/pr-summary.md](../templates/pr-summary.md) | PR本文テンプレート |

## テンプレート

| Path | 役割 |
|---|---|
| [../templates/feature-doc-template.md](../templates/feature-doc-template.md) | 新規Feature docs |
| [../templates/idea-board-and-mock-template-policy.md](../templates/idea-board-and-mock-template-policy.md) | IDEA BOARD / MOCK共通ルール |
| [../templates/idea-board-template.md](../templates/idea-board-template.md) | IDEA BOARD |
| [../templates/mock-template.md](../templates/mock-template.md) | MOCK |

## プロジェクト・ログ

- 機能固有の作業索引は [projects/index.md](projects/index.md) から対象feature docsへ進みます
- 失敗改善、再発防止、理解再起動の索引は [logs/index.md](logs/index.md) を使います
- 一時的なローカル情報はGit管理外の `.local/` に分離し、この索引へ内容を複製しません

## 配置ルール

- 複数作業に共通する作業条件・責務境界は `rules/`
- 作業種別の分岐・作業ループは `workflows/`
- プロジェクト固有の作業索引は `projects/`
- 失敗改善・再発防止・理解再起動の記録は `logs/`
- 既存feature docsを索引整理のためだけに移動しない
- 分類に迷う場合は新規MDを追加せず、[docs/index.md](../index.md) で配置基準を確認する
