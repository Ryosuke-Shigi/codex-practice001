# Work Result Feedback Loop

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-14

## このドキュメントの目的

このドキュメントは、作業完了前に今回の結果をどのdocs、型、コメント、テストへ戻すべきかを判定するためのルールです。

docs更新を目的化せず、次回の理解再起動に役立つ検証済み事実だけを戻します。

戻さない場合は、Pull Request Summary の README / docs 欄または未完了・対象外欄へ「戻さなくてよい理由」を残します。

## 位置付け

- `../../context-management.md`: 文脈読込、探索範囲制限、理解再起動の方針
- `../logs/index.md`: 失敗改善ログ、再発防止ログ、理解再起動ログの索引
- `loop-engineering.md`: 実行、確認、修正、再確認、記録、次回改善までを反復可能にする作業ループ
- このMD: 作業後にどこへ戻すかの反映先判定ルール

このMDは `context-management.md` や `logs/index.md` の全文焼き直しではありません。作業後の反映先を選ぶための分岐表として扱います。

## 作業完了前の必須確認

作業完了前に、次を確認します。

- Feature仕様が変わったか
- 責務境界の判断が増えたか
- UI / Frontend判断が増えたか
- コメント、PHPDoc、JSDoc、型アノテーション、props契約説明が実装と矛盾していないか
- 新しいコマンドを使ったか
- 失敗、誤読、再発防止、未確認事項があったか
- 検出可能な漏れや再発しやすい確認漏れがあったか
- テスト観点が増えたか
- agentの役割、model / reasoning、権限、単一writer、TDD / harness / loop契約が変わったか
- 設定値を根拠にruntime実測済みとせず、runtime確認を行った場合はfresh sessionのresolved値と分けて記録したか
- Codex App内蔵ブラウザ、Developer Mode、CDPを実際に確認したか、または利用不能地点と未確認範囲を残したか
- secrets / env / 本番接続 / 破壊的操作に触れたか
- AGENTS.md、docs/index.md、MDルーター、operations docs、feature docs、Sensors、PR Summary のどこへ戻すべきか
- ローカル環境固有で、Git管理docsへ混ぜてはいけない情報ではないか

どれにも該当しない場合は、恒久docsへ戻す新事実がない可能性があります。その場合も、PR Summary には理由を短く残します。

## 作業後のMD最適化ループ

作業後は、PRレビュー、Sensors、PR Summary、docs更新要否の結果から、必要なMDだけを最小更新します。

1. PR Summaryには、実行結果、未実行理由、docs更新要否、該当Sensorsを事実として残す
2. 繰り返し漏れや検出可能なズレは、必要に応じて ../../operations/sensors.md へ戻す
3. 読む場所や作業分岐がズレた場合は、必要な範囲だけ md-router.md または md-router-cases.md を更新する
4. AGENTS.mdへ入れるのは、全作業で守らないと事故につながる短い入口ルールだけにする
5. ローカル環境固有の情報は、Git管理docsやPR本文へ混ぜない

## 反映先の判定表

| 今回増えた事実 | 主な反映先 |
|---|---|
| 全作業で必要な短い入口ルール | ../../../AGENTS.md |
| docsの案内先や正本の役割分担 | ../../index.md |
| Feature仕様変更 | `../../features/*` |
| 共通責務境界 | `../../architecture.md` または `../rules/responsibility-boundaries.md` |
| React / Inertia / TypeScript責務 | `../../frontend.md` / `../../ui.md` |
| コメント、PHPDoc、JSDoc、型アノテーション、props契約説明の整合 | ../../commenting.md / 対象コード / ../../operations/sensors.md |
| UI工程や MOCK / PROTOTYPE / PRODUCT 契約 | `../../ui-development-flow.md` / `../../prototype-policy.md` / 対象feature docs |
| テスト観点 | `../../testing.md` または対象feature docs |
| Subagent利用、親の統合、作業段階、単一writer | `../rules/model-routing-policy.md` |
| 個別custom agentのresolved runtime、比較結果、ブラウザ検証可否 | Git管理外のLocal記録または作業報告。再利用可能な恒久ルールだけを該当するrules / workflows / Sensorsへ反映 |
| コマンド実行場所 | `../../operations/command-registry.md` |
| PR確認観点 | `../../operations/pr-review-strength.md` |
| 検出可能な漏れ、再発しやすい確認漏れ | `../../operations/sensors.md` |
| 失敗改善・再発防止 | `../logs/*` |
| 文脈読込・理解再起動方針 | `../../context-management.md` |
| 作業種別ごとの参照先 | `md-router.md` |
| 実装後の確認結果、未実行理由、docs更新要否 | ../../templates/pr-summary.md に従いPR本文へ記載 |

複数に該当する場合でも、同じ詳細ルールを複数docsへ全文複製しません。各docsの責務に必要な要約と、正本への参照だけを置きます。
作業中または作業後に検出可能な漏れが見つかった場合は、詳細ルールを重複させず、検出項目として `../../operations/sensors.md` へ戻すかを確認します。

## Loop Engineeringへの戻し先

作業後に問題や不足が見つかった場合は、単発の修正で終えず、どのLoop Engineeringへ戻すかを判定します。

| 作業後に見つかったこと | 戻すループ | 主な確認 |
|---|---|---|
| 指示が曖昧で、読むMD、変更対象、停止条件、確認コマンドが固定できていなかった | 指示作成ループ | 人間が目的、境界、合格条件を設計できているか |
| 実装差分に責務混在、目的外変更、不要な代替実装がある | 実装ループ | 差分、責務境界、確認コマンド、修正後の再確認 |
| PR本文、確認結果、未実行理由、レビュー強度、該当Sensorsが不足している | PR確認ループ | PR本文と差分、未実行理由、docs更新要否、停止条件 |
| 実装、テスト、docsの間にズレがある | docs更新ループ | 正本docs、対象feature docs、コメント、型、テストのどこへ戻すか |
| 同じミスが再発しそう、または検出可能な漏れが見つかった | 失敗再発防止ループ | logs候補、Sensors候補、MD Router候補、pr-review-strength候補 |
| 次回作業の現在地、未完了、注意点が分からなくなる | 理解再起動ループ | context-management、次スレッド引き継ぎまとめ、feature docsへ残すべきか |
| 利用可能な実行設定とruntime実測が一致しない、複数writer、TDDやbrowser検証の証跡が不足する | model routing / harness改善 / 検証・レビュー / escalation・停止ループ | model-routing-policy、Git管理外のLocal記録または作業報告、SENS-019、未確認範囲 |

Loop Engineeringの詳細をこのMDへ複製しません。ここでは作業後の戻し先だけを判断します。

## 昇格候補の判定

第3段階の下地として、Sensors / logs 本文を変更せず、失敗再発防止ループからどこへ昇格候補を出すかだけを判定します。

| 扱い | 判断基準 | 例 |
|---|---|---|
| 一時メモで終わるもの | その場限りの確認結果で、次回も使う判断基準ではない | 個別PRの確認時刻、今回だけの調査メモ |
| PR本文 / pr-summaryに残すもの | レビュー時に実装後の事実として必要だが、恒久docsへ戻すほどではない | 確認コマンド結果、未実行理由、docs更新不要の理由 |
| logsへ残す候補 | 誤読、失敗、再発防止として次回参照する価値がある | 同じ誤読が複数回起きた、同じ停止条件の見落としが再発した |
| Sensorsへ昇格する候補 | 作業中または作業後に検出したい漏れとして整理できる | PR確認で毎回同じ未実行理由が出る、検出したいがまだSensor本文へ追加するほど固まっていない |
| MD Router / pr-review-strength / agent-working-policyへ昇格する候補 | 作業前の読む範囲、PR確認観点、停止条件として何度も効く | docs更新要否の判断が曖昧で作業が止まった、レビュー強度の判断が毎回揺れる |
| context-management / 次スレッド引き継ぎまとめへ残す候補 | 次回の理解再起動で同じ説明が必要になる | 次回作業の現在地、未完了、注意点、読ませるdocsと読ませないdocs |

新しいSensor IDの追加、logs本文追加、context-management本文の大改修は、実際に再発した問題が出た時に別PRで扱います。

## 戻さない場合の扱い

恒久docsへ戻さない場合は、PR Summary の README / docs 欄または未完了・対象外欄へ理由を残します。

例:

- `今回の差分では恒久docsへ戻す新事実なし`
- `既存feature docsの仕様変更なし。docs更新は索引追加のみ`
- `確認コマンドは既存の command-registry.md で扱えるため追加なし`

「docsのみ変更なし」のように、理由が分からない表現だけで済ませません。

## 一時メモと恒久docsの分離

Git管理docsへ戻すのは、cloneした第三者がプロダクトを理解、変更、テスト、運用するための情報です。

次は恒久docsへ混ぜません。

- 会話ログ
- 作業前の長い条件文
- ローカル地雷地図
- 個人メモ
- ChatGPT / CodexApp / 指示用まとめ / 圧縮ルールなどのメタ運用

## 禁止事項

- docs更新を目的化しない
- 同じ詳細ルールを複数docsへ全文複製しない
- 未確認の運用手順を正本として書かない
- `.local` / `.local-rules` をGit管理docsへ転記しない
- ChatGPT側情報源のメタ運用をGit管理docsの正本へ戻さない
