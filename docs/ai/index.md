# AI Docs Index

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`

## 目的

このファイルは、アプリ側のAI作業用MD索引です。

詳細ルール本文はここに集約せず、作業種別ごとの参照先だけを示します。

## 参照順

1. [../../AGENTS.md](../../AGENTS.md)
2. [rules/agent-working-policy.md](rules/agent-working-policy.md)
3. [rules/responsibility-boundaries.md](rules/responsibility-boundaries.md)
4. [../index.md](../index.md)
5. 作業種別に応じて [workflows/index.md](workflows/index.md) または既存 `../` 配下docs
6. 機能固有作業では [projects/index.md](projects/index.md) から対象feature docs
7. 失敗改善・理解再起動では [logs/index.md](logs/index.md)

## 共通ルール

| Path | 役割 |
|---|---|
| [rules/agent-working-policy.md](rules/agent-working-policy.md) | AIと人間の役割、Git / PR、作業停止条件、完了確認 |
| [rules/responsibility-boundaries.md](rules/responsibility-boundaries.md) | ADR Pattern、用語、レイヤー責務、DTO禁止事項 |
| [../architecture.md](../architecture.md) | 実装レイヤー責務の詳細 |
| [../coding-standards.md](../coding-standards.md) | PHP / TypeScript / React / CSS の実装作法 |
| [../commenting.md](../commenting.md) | コメント、PHPDoc、JSDoc |
| [../security.md](../security.md) | 秘密情報、本番接続、破壊的操作 |

## 作業フロー

| Path | 役割 |
|---|---|
| [workflows/index.md](workflows/index.md) | 作業フロー別ルールの索引 |
| [workflows/md-router.md](workflows/md-router.md) | 作業種別ごとの読むdocs、読まないdocs、停止条件 |
| [../development-flow.md](../development-flow.md) | IDEA BOARD / MOCK / PROTOTYPE / PRODUCT、Product化 |
| [../ui-development-flow.md](../ui-development-flow.md) | MOCK / PROTOTYPE / PRODUCT UI作成工程 |
| [../prototype-policy.md](../prototype-policy.md) | MOCK / Prototypeの配置、削除、Productとの分離 |
| [../testing.md](../testing.md) | テスト追加、仕様固定、CI確認 |
| [../operations/command-registry.md](../operations/command-registry.md) | Docker経由コマンド、root / `src` のGit境界 |
| [../operations/pr-review-strength.md](../operations/pr-review-strength.md) | PRレビュー強度 |
| [../templates/pr-summary.md](../templates/pr-summary.md) | PR本文テンプレート |

## プロジェクト固有ルール

機能固有docsは、意味変更リスクを避けるため今回移動せず `projects/index.md` から参照します。

## ログ・再発防止

失敗改善ログ、再発防止ログ、理解再起動の参照先は `logs/index.md` にまとめます。

## 配置ルール

- 新しい共通AIルールは `rules/` に置く。
- 新しい作業フロー別ルールは `workflows/` に置く。
- 新しいプロジェクト固有のAI向け索引は `projects/` に置く。既存feature docsを無理に移動しない。
- 新しい失敗改善ログ・再発防止ログは `logs/` に置く。
- 分類に迷うMDは移動せず、この索引から参照するだけにする。
