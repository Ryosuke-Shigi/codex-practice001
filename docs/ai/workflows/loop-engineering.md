# Loop Engineering

- Status: active
- Scope: AI work loop / docs operations

## 1. 目的

AI作業を単発プロンプトではなく、反復可能な開発ループとして扱います。

目的、文脈、作業範囲、検証、停止条件、記録を固定し、作業後の確認と修正を次回の理解再起動へつなげます。

育てる対象はAIそのものではありません。AIが読むdocs、Sensors、logs、確認条件、停止条件、レビュー観点を整備することで、次回の文脈ロードと作業品質を安定させます。

## 2. 用語の位置づけ

| 用語 | 位置づけ |
|---|---|
| Prompt Engineering | 一回の指示文を整える。 |
| Context Engineering | AIに何を読ませ、何を読ませないかを設計する。 |
| Harness Engineering | AIが安全に作業できる環境、権限、ログ、検証手段を設計する。 |
| Loop Engineering | 実行、確認、修正、再確認、記録、次回改善までを反復可能な仕組みにする。 |

## 3. このプロジェクトでの位置づけ

| Docs | 役割 |
|---|---|
| [AGENTS.md](../../../AGENTS.md) | AI / Codex の作業入口。 |
| [docs/index.md](../../index.md) | docs全体の索引。 |
| [docs/ai/index.md](../index.md) | AI作業用docsの入口。 |
| [MD Router](md-router.md) | 作業種別ごとに読むdocs、読まないdocs、停止条件を決める。 |
| [agent-working-policy](../rules/agent-working-policy.md) | 目的、変更対象、確認コマンド、停止条件を固定する。 |
| [model-routing-policy](../rules/model-routing-policy.md) | Subagent、単一writer、TDD / Harness / Loop上の担当、昇格、runtime境界を決める。 |
| [responsibility-boundaries](../rules/responsibility-boundaries.md) | ADR Pattern / レイヤード責務を確認する。 |
| [testing](../../testing.md) | Red、Green、Refactorと回帰確認を実行可能な仕様として固定する。 |
| [pr-review-strength](../../operations/pr-review-strength.md) | PR種別に応じてレビュー強度を変える。 |
| [context-management](../../context-management.md) | 必要文脈だけを読み、理解再起動しやすくする。 |
| [logs](../logs/index.md) / [Sensors](../../operations/sensors.md) | 失敗、確認結果、再発防止を蓄積する。 |

このdocsは各docsの詳細を複製せず、作業ループ上の接続だけを示します。詳細は各リンク先を正本とします。

## 4. 対象ループ

### 指示作成ループ

作業目的、対象、読むdocs、読まないdocs、変更範囲、停止条件、確認コマンドを固定します。

Git管理docsでは、ChatGPT側の出力形式や圧縮ルールまでは正本化しません。

### 仕様ループ

対象探索、正本確認、仕様整理、矛盾検出、仕様修正、再確認を繰り返します。

親が監査対象を固定し、`specification_reviewer`は成立性を確認します。仕様の採否は人間が判断し、未成立のまま実装へ進みません。

### TDDループ

仕様と責務をテストへ固定し、意図した理由のRed、最小実装のGreen、責務を壊さないRefactor、対象テスト、回帰確認までを1ループとします。

テスト先行が不適切または不可能な場合は、理由と代替Sensor、型、契約、browser手順、レビューを記録します。

### 実装ループ

目的と責務境界に沿って、親を含むrepo全体で1体だけの単一writerが差分を作ります。

実装後に差分、責務混在、目的外変更、確認コマンド結果を見ます。問題があれば修正して再確認します。

### Browser検証ループ

UI変更では、固定したURL、viewport、操作、期待結果で問題を再現し、Console、Network、DOM、CSS等の証跡を分けます。

writer修正後に`browser_verifier`が同一条件で再実行し、mobile、tablet、PCと既存導線を回帰確認します。browserが利用不能な場合は未確認範囲を分け、代替確認を実画面確認済みとしません。

### レビューループ

実装と検証後に`sol_reviewer`が指示、正本、差分、TDD、Sensors、browser結果を独立確認します。

解消可能な指摘は元writerへ戻し、verifier、必要なbrowser確認、同じreview観点を再実行します。

### PR確認ループ

PRの目的、変更ファイル、影響範囲、レビュー強度、該当Sensors、未実行確認を固定します。

PR本文は指示全文ではなく、実装後の事実、確認結果、未実行理由を書きます。

### docs更新ループ

実装差分とdocsがズレた場合に、docsを更新します。

一時的なメモを正本docsへ混ぜず、正本化するもの、logsへ残すもの、その場で終わるものを分けます。

### 失敗再発防止ループ

同じミスが再発しそうな場合、logs / Sensors / agent-working-policy / MD Router / pr-review-strength のどこへ還元するか判断します。

ただし、このdocs内にSensors詳細を複製しません。

### Harness改善ループ

同じ失敗を検出した場合、原因を分類し、コード、型、テスト、Sensor、MDルーター、agent設定のうち、最も早く安定して検出できる場所へ戻します。

プロンプトだけを長くせず、再発ケースで検出できることと他作業への誤検出がないことを再確認します。

### Model routingループ

同一task、入力、成功条件でmodelを比較し、品質、見落とし、scope、停止条件、tool利用、速度、利用量、親の修正量を評価します。

品質条件を満たしたroleだけ設定へ反映し、read-heavyの結果をwriter、DB、運用、browser tool利用へ自動展開しません。

### 昇格・停止ループ

軽量agentで解決できなければ専門agent、複雑・高リスク・複数レイヤーならSolへ返します。

仕様矛盾、権限不足、破壊的操作、同じ原因の反復、人間判断が必要な場合はagent間を無限に往復せず停止します。

### 理解再起動ループ

次回作業者やAIが現在地を掴めるよう、目的、変更済み内容、未完了、注意点を整理します。

次スレッド引き継ぎまとめ、feature docs、context-managementと接続します。

## 5. 各ループの共通構造

| 区分 | 内容 |
|---|---|
| 入口条件 | 何が固定されたら開始できるか。例: repo、branch、仕様、対象、権限、成功・停止条件。 |
| 1回の成果物 | 1回ごとに何を返すか。例: 仕様差分、Red結果、実装差分、検証結果、review指摘。 |
| 実行担当 | 親、read-only agent、単一writer、verifier、browser、reviewerの誰か。 |
| 検証担当 | 実行者と分離できるagentまたは人間。自己確認だけで完了しない。 |
| 検証方法 | git diff、登録コマンド、テスト、browser、Sensors、責務境界、runtime metadata。 |
| 完了条件 | 成功条件、回帰、未確認事項、停止条件が判定済みであること。 |
| 修正 | 問題がある場合、どこまで直すか。例: 目的外変更の撤回、docsリンク修正、責務混在の解消、未実行理由の明記。 |
| 再実行 | 入力、差分、環境のいずれかが変わった場合だけ同じ条件で行う。flake分類目的の無変更再実行は最大1回。 |
| 昇格 | 軽量role、専門role、Solのどこへ戻すか。 |
| 停止 | 矛盾、情報不足、危険操作、同じ失敗、人間判断が必要な場合は止める。 |
| 人間判断 | 仕様、重要設計、DB、権限、Security、本番、完成、mergeを人間へ戻す。 |
| 記録 | 結果をどこへ残すか。例: PR本文、pr-summary、logs、Sensors、feature docs、次スレッド引き継ぎまとめ。 |

## 6. 昇格基準

| 区分 | 扱い |
|---|---|
| 一時メモ | その場限りの確認結果。正本docsへ混ぜない。 |
| 再発防止ログ | 同じミスを防ぐために残す記録。logs配下や該当する運用docsへ記録する候補。 |
| 正本ルール | 何度も効く判断基準。MD Router、agent-working-policy、responsibility-boundaries、pr-review-strength、Sensorsなどへの昇格候補。 |
| 理解再起動メモ | 次回作業が現在地をすぐ掴むための要約。次スレッド引き継ぎまとめやfeature docsに残す候補。 |

## 7. 停止条件

- docs、コード、テストが矛盾する。
- 変更対象外の差分が必要になる。
- 本番、DB破壊、secrets、外部公開、削除、mergeなど人間判断が必要になる。
- 確認コマンドが実行不能。
- 仕様が不明確で推測実装になりそう。
- AGENTS.md、MD Router、Sensors、agent-working-policyの責務が衝突する。
- agent TOMLの設定値とruntime実測を分離できない。
- 単一writer lease、TDDのRed / Green / Refactor、browser未確認範囲を判定できない。
- 同じ原因で改善せず再実行している。
- Sensors詳細を複製しそうになる。
- ChatGPT側情報源の運用ルールをGit管理docsへ正本化しそうになる。

## 8. 記録先

| 記録するもの | 主な記録先 |
|---|---|
| 作業結果 | PR本文 / pr-summary |
| 失敗改善 | docs/ai/logs/* |
| 再発防止 | Sensors / agent-working-policy / MD Router / pr-review-strength |
| 理解再起動 | 次スレッド引き継ぎまとめ / feature docs / context-management |

## 9. 表現ルール

使う表現:

- AIが読む開発文脈が育つ。
- 失敗、確認結果、レビュー観点をdocs / Sensors / logsへ還元し、次回の理解再起動と作業精度を上げる。
- 使うほどに、読むべき文脈、止まるべき条件、確認すべき観点が整理され、AI作業の品質が安定していく。
- 人間が目的、境界、合格条件を設計し、AIがその内側で反復する。

使わない表現:

- AI自身やモデルが自動的に賢くなると読める表現。
- 完全な自律開発だと断定する表現。
- 人間の判断が不要だと読める表現。
- プロンプトだけで安全になるという表現。
