# Workflow Docs

- Status: active
- Scope: workflow docs index

## 役割

このファイルは、`docs/ai/workflows/` 配下の作業フロー別ルールを示す小さな索引です。

`docs/ai/workflows/` は既存配置名です。作業フローと停止条件のdocsとして扱い、配置名を `docs/workflows/` または `docs/process/` へ寄せるかは別PRで判断します。

詳細本文は各ワークフローMD、または移動保留中の既存docsに置きます。

| Path | 役割 |
|---|---|
| [md-router.md](md-router.md) | 作業種別ごとの読むdocs、読まないdocs、停止条件の正本 |
| [md-router-cases.md](md-router-cases.md) | `md-router.md` を補助する実戦ケース集 |
| [loop-engineering.md](loop-engineering.md) | AI作業を単発出力で終わらせず、実行、確認、修正、再確認、記録、次回改善までを反復可能にするための作業フロー |
| [work-result-feedback-loop.md](work-result-feedback-loop.md) | 作業後にどのdocs / 型 / コメント / テストへ戻すかの判定ルール |
| [../../development-flow.md](../../development-flow.md) | IDEA BOARD / MOCK / PROTOTYPE / PRODUCT、Product化 |
| [../../ui-development-flow.md](../../ui-development-flow.md) | MOCK / PROTOTYPE / PRODUCT UI作成工程 |
| [../../prototype-policy.md](../../prototype-policy.md) | MOCK / Prototypeの配置、削除、Productとの分離 |
| [../../testing.md](../../testing.md) | テスト追加、仕様固定、CI確認 |
| [../../operations/pr-review-strength.md](../../operations/pr-review-strength.md) | PRレビュー強度 |
| [../../operations/sensors.md](../../operations/sensors.md) | PR前確認、AIレビュー、作業中・作業後のズレ検出、SENS-016を含むSensors台帳 |
| [../../operations/command-registry.md](../../operations/command-registry.md) | コマンド実行、Git境界 |

`md-router.md` はルーティングの正本です。`md-router-cases.md` は補助実例集として扱い、迷った場合は `md-router.md` を正とします。

work-result-feedback-loop.md は作業後の戻し先判定、../../operations/sensors.md は作業中・作業後の漏れやズレの検出台帳として使い分けます。

詳細なSensor定義は docs/operations/sensors.md を正本とし、この索引へ全文複製しません。

既存docsは意味変更リスクを避けるため、今回まとめて移動しません。
