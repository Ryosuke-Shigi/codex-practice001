# Project Model Routing Policy

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-14
- Canonical source: 任意のSubagent利用、作業段階、単一writer、親の統合、停止、安全境界

## 目的

この文書は、projectの作業を探索、仕様・設計、実装、検証、レビューへ分ける判断と、利用可能なSubagentへ委譲するときのproject共通契約を定めます。

Subagentは必須依存ではありません。Subagentが利用できない場合も、親agentが同じ工程を順番に実行すれば通常開発が成立することを前提にします。個人用のrole catalog、model割当、reasoning effort、install手順、runtime生ログはこの公開repoの正本にしません。

## MDルーターとの順序

1. `AGENTS.md`でrepo境界と共通安全ルールを確認する
2. [MDルーター](../workflows/md-router.md)で作業プロファイルを選ぶ
3. 読むdocs、対象コード、仕様、責務、成功条件、停止条件、確認コマンド、レビュー強度を固定する
4. 分割に品質または速度上の効果がある場合だけ、利用可能なSubagentへ独立作業を委譲する
5. 親agentがchildの結果をproject固有docs、現在コード、差分、検証結果と照合して統合する

作業範囲を固定する前にagentやmodelだけを選びません。小さい作業は機械的に分割しません。

## 作業段階

### 探索

対象ファイル、参照、現在挙動、変更候補を根拠付きで特定します。boundedなread-heavy作業だけを安全に並列化し、探索担当が仕様や設計を決定しません。

### 仕様・設計

指示、project docs、コード、テストの矛盾、受入条件、責務配置、依存方向、テスト可能性を確認します。仕様が成立していないまま実装へ進まず、採否が必要な事項は人間判断へ戻します。

### 実装

仕様と責務が固定された後、単一writerが最小差分を作ります。対象projectのTDD、Architecture、Frontend、Security等の正本に従い、指示外の再設計やリファクタリングを加えません。

### 検証

[Command Registry](../../operations/command-registry.md)に登録されたコマンド、差分形式、必要なbrowser条件を確認します。検証担当は失敗を修正せず、成功、失敗、未実行、生成差分、working tree変化を分けて親へ返します。

### レビュー

指示、正本、差分、TDD、検証結果、[Sensors](../../operations/sensors.md)を実装担当から分離して照合します。修正が必要なら親がwriter leaseを再割当し、差分変更後に同じ検証・レビュー観点を再実行します。

## 親agentの責務

親agentは次を担当します。

- 対象repo、project root、remote、branch、HEAD、working treeを確認する
- 作業段階、対象・非対象、仕様、責務、成功・失敗・停止条件を固定する
- 小さい作業を過剰分割せず、read-heavyで独立した作業だけを並列化する
- repo全体の単一writer leaseを管理する
- childへ必要なproject文脈を渡し、結果を正本と現在差分へ照合する
- 仕様採否、重要設計、完成判定、Git / Pull Request操作、人間判断への返却を担う

childの説明や自己申告を、そのまま完成判定、runtime実測、PR本文へ使いません。

## childへ渡す開始契約

委譲時は最低限次をmessageへ含めます。不足する場合、childは推測で開始せず親へ返します。

- 対象repo、project root、remote、対象branch、HEAD、working tree
- 作業段階、対象ファイルまたは調査範囲
- 編集可否、変更してよい範囲、変更してはいけない範囲
- 正本docs、現在確認済みの事実、推測禁止
- 成功条件、失敗条件、停止条件
- 検証方法、親へ返す結果形式

異なるrole、model、reasoning effortを使うため会話履歴を継承しない必要がある場合は、必要文脈をmessageへ明記します。個人環境のfork設定やagent catalogをprojectの必須条件にしません。

## 単一writer

同時にrepoを編集できるのは、親agent自身を含めて最大1体です。

- 親がwriter、対象ファイル、lease開始、終了条件を明示する
- read-onlyの探索・仕様・設計・検証・レビュー担当は編集しない
- 検証・レビュー中はwriterを停止する
- writer切替前に前writer停止、`git status`、diff、変更済み範囲、未完了、停止理由を確認する
- 検証で生成物を検出しても担当者がcleanupせず、親が対象差分と分けて扱う

Subagentが利用できない場合も、親agentは工程間で自分の役割を切り替え、同時writerを増やしません。

## TDD・Harness・Loop

実行可能な仕様を変更する場合は、原則として仕様固定、意図したRed、最小Green、責務を壊さないRefactor、対象・回帰確認へ接続します。テスト先行が不適切または不可能な場合は、理由と代替Sensor、型、契約、browser手順、レビューを明示します。

[Loop Engineering](../workflows/loop-engineering.md)に従い、入力、差分、環境のいずれかが変わった後だけ同じ確認を再実行します。同じ原因の無変更再実行を繰り返しません。

## 設定値とruntime実測

- project設定、agent設定、期待値、runtime実測を分ける
- 静的checker成功をrole認識、resolved model、reasoning effort、effective sandbox、browser成功へ読み替えない
- runtime確認が必要な場合はfresh sessionまたはreload後に、親側metadataでproject root、role、resolved値、effective sandbox、permission profile、working tree変化を確認する
- read-only確認では親taskのeffective sandboxも先に確認し、ダミー、NOOP、確認用ファイルを作らない
- browser担当のrole認識と実画面検証成功を分け、利用不能な経路を別手段で成功扱いしない

個別runtimeのsession識別子、個人絶対パス、ユーザー設定、model比較履歴は公開projectの恒久docsへ記録しません。projectへ残す価値がある再利用可能な知見だけをこのpolicy、Command Registry、Sensors等へ反映します。

## Git / Pull Request境界

childはbranch作成・変更、commit、push、Pull Request作成・更新、review投稿、merge、force push、履歴変更を行いません。

Git / Pull Request操作は、[Agent Working Policy](agent-working-policy.md)とユーザーの明示許可を確認した親agentだけが扱います。既存未コミット差分、Git管理外Local情報、secretsを無断で変更・stage・cleanupしません。

## 昇格・停止

- 探索中に設計、編集、矛盾解消が必要になったら親へ返す
- 通常実装で複数レイヤー、高リスク、原因不明が判明したら専門的な設計確認または人間判断へ昇格する
- verifierとreviewerは修正せず、親がwriter leaseを再割当する
- 仕様、責務、DB、rollback、認証認可、Security、本番、破壊的操作、権限拡張は必要に応じて人間判断へ戻す
- docs、コード、テスト、指示が矛盾する、対象repoやbranchを確認できない、確認コマンドを確定・実行できない場合は停止する

## 共通結果形式

委譲の有無にかかわらず、親は作業結果で次を区別します。

1. 担当範囲とruntime確認可否
2. 確認根拠
3. 判明事実または変更内容
4. TDD / Harness / Loop上の結果
5. 成功、失敗、未実行
6. 未確認事項
7. 停止理由、再実行条件、昇格要否、人間判断

## 公開repo単体の代替導線

利用可能なSubagentがない場合は、親agentが次を順番に行います。

1. `AGENTS.md`とMDルーターでscopeを固定する
2. project docsと対象コードを探索する
3. 仕様・責務・受入条件を確認する
4. 単一writerとして最小差分を実装する
5. Command Registryの確認を実行する
6. 必要なbrowser条件を確認する
7. 差分とSensorsをレビューする
8. [Work Result Feedback Loop](../workflows/work-result-feedback-loop.md)で戻し先を判断する
