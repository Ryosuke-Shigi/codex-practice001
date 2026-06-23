# Workflow Docs

- Status: active
- Scope: workflow docs index

## 役割

このファイルは、`docs/ai/workflows/` 配下の作業フロー別ルールを示す小さな索引です。

`docs/ai/workflows/` は既存配置名です。作業フローと停止条件のdocsとして扱い、配置名を `docs/workflows/` または `docs/process/` へ寄せるかは別PRで判断します。

詳細本文は各ワークフローMD、または移動保留中の既存docsに置きます。

| Path | 役割 |
|---|---|
| [md-router.md](md-router.md) | 作業種別ごとの読むdocs、読まないdocs、停止条件 |
| [../../development-flow.md](../../development-flow.md) | IDEA BOARD / MOCK / PROTOTYPE / PRODUCT、Product化 |
| [../../ui-development-flow.md](../../ui-development-flow.md) | MOCK / PROTOTYPE / PRODUCT UI作成工程 |
| [../../prototype-policy.md](../../prototype-policy.md) | MOCK / Prototypeの配置、削除、Productとの分離 |
| [../../testing.md](../../testing.md) | テスト追加、仕様固定、CI確認 |
| [../../operations/pr-review-strength.md](../../operations/pr-review-strength.md) | PRレビュー強度 |
| [../../operations/command-registry.md](../../operations/command-registry.md) | コマンド実行、Git境界 |

既存docsは意味変更リスクを避けるため、今回まとめて移動しません。
