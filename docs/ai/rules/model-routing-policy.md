# Subagent Model Routing Policy

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-13
- Canonical source: subagentの選択、役割、並列、昇格、停止、安全境界

## 目的と適用範囲

この文書は、親エージェントが作業の複雑さ、曖昧さ、影響範囲、失敗時のリスクに応じて、project-scoped subagentへ処理を委譲するための正本です。

subagentによるmodel routingはMDルーターの代替ではありません。読む範囲、変更対象、停止条件、確認コマンド、PRレビュー強度は、引き続き既存の正本docsを優先します。

この文書では役割、責務、昇格、停止、安全境界を正本とします。model IDは[project設定](../../../.codex/config.toml)と[agent設定](../../../.codex/agents/)に置く現在の運用設定です。将来model名を変更する場合も、役割、停止条件、安全境界を同時に変更しません。

## MDルーターとの順序関係

作業は次の順序で進めます。

1. [AGENTS.md](../../../AGENTS.md) でrepo境界と共通安全ルールを確認する
2. [MDルーター](../workflows/md-router.md) で作業プロファイルを選ぶ
3. プロファイルに従って必要なdocs、feature / project docs、対象コードだけを確認する
4. 仕様、対象、責務、成功条件、停止条件、確認コマンド、レビュー強度を確定する
5. 独立した探索、実装、検証、レビューへ分割する効果がある場合だけ、この文書に従って委譲する
6. 親エージェントが結果を現在の差分と照合して統合し、最終判断とGit / Pull Request操作を行う

作業範囲を確定する前にmodelだけを選び、subagentへ仕様判断を委ねてはいけません。

## 親エージェントの責務

親エージェントは、model選択専用subagentを起動せず、自身で作業を分類します。

分類では作業量だけでなく、次を確認します。

- 仕様の明確さ
- 必要な判断の深さ
- 変更レイヤー数
- 影響範囲
- 失敗時の影響
- rollbackの必要性
- 認証認可、DB、本番、Security、外部API等のリスク
- 読み取り作業か編集作業か
- 独立して並列化できる作業か

親エージェントは、委譲前に対象repo、対象ファイル、編集可否、確認対象、停止条件、期待する結果形式を明示します。subagentの説明をそのまま最終回答やPR本文へ転記せず、現在のdocs、コード、差分、確認結果と照合して統合します。

## 運用設定

[project設定](../../../.codex/config.toml)では次を使います。

| 設定 | 値 | 意味 |
|---|---:|---|
| agents.max_threads | 3 | 登録agent数ではなく、同時にopenにできるagent thread数の上限 |
| agents.max_depth | 1 | root sessionから直接のsubagentだけを許可し、subagentからの再委譲を禁止 |

project全体の既定model、approval、network、MCP、skills、sandboxの全体設定は、このmodel routingのために変更しません。

## 5種類のagent

| Agent | Model | Reasoning | Sandbox | 主な用途 |
|---|---|---|---|---|
| luna-explorer | gpt-5.6-luna | low | read-only | 対象特定、検索、分類、抽出、参照確認 |
| terra-implementer | gpt-5.6-terra | medium | 親セッションから継承 | 仕様と責務が確定した通常実装 |
| sol-specialist | gpt-5.6-sol | xhigh | 親セッションから継承 | 複雑、曖昧、高リスク、複数レイヤー、原因不明 |
| terra-verifier | gpt-5.6-terra | medium | 親セッションから継承 | 実装担当から分離したコマンド確認 |
| sol-reviewer | gpt-5.6-sol | high | read-only | 実装担当から独立した最終差分レビュー |

### luna-explorer

対象ファイル、関連docs、Route、型、テスト、変更候補を特定し、grep、検索、差分分類、ログ整理、参照関係の確認を行います。明確で反復可能な情報抽出に限定し、根拠となるファイルと該当箇所を親エージェントへ返します。

ファイル編集、Git / Pull Request操作、仕様決定、責務変更、代替実装の既定案化は禁止します。手がかりのないrepo全体や全docsの総当たり、曖昧な内容の推測補完も行いません。

編集、設計判断、矛盾解消が必要になった場合は停止し、TerraまたはSolへの昇格要否を親エージェントへ返します。

### terra-implementer

仕様、対象、責務配置、成功条件が確定した通常実装を担当します。小規模から中規模のLaravel、React、TypeScript、docs修正と、既存設計内のテスト追加・修正を、MDルーターで確定した範囲内だけで行います。

高リスク領域の通常修正化、対象外ファイルの編集、他のsubagentとの同時編集、Git / Pull Request操作、正本docsの再設計や独自解釈は禁止します。

次を検出した場合は編集を止め、親エージェントへSolへの昇格を要求します。

- 複数レイヤーの責務判断が必要
- docs、コード、テスト、指示が矛盾
- DB、Migration、認証認可、Security、本番、Docker、外部API更新、Queue / Schedulerへ影響
- 原因不明の不具合
- 既存構造の変更または設計判断が必要
- 仕様を推測しなければ進められない

### sol-specialist

複雑、曖昧、高価値、高リスクな作業、複数レイヤーの責務判断、原因不明障害の根本原因分析、Terraでは成立しない作業を担当します。

Controller、Request、Action、Service、Repository、DTO、Responder、Event、Listener、Job、Strategy、Read Model、Projectionの境界を確認し、DB、Migration、認証認可、Security、外部API、Queue / Scheduler、本番影響を含む作業の設計・実装を支援します。

ユーザー未承認の破壊的操作、secrets変更、本番反映、merge、force push、履歴変更、Git / Pull Request操作は禁止します。仕様矛盾を推測で統合せず、高性能modelであることを理由に作業範囲を広げません。

対象repo、仕様、責務、rollback、権限境界、既存データ影響を確認できない場合は、Solでも停止して親エージェントへ返します。

### terra-verifier

実装担当から分離し、command registryと対象docsに存在するコマンドを実装完了後に実行します。test、typecheck、build、format check、lint、git diff --check、CI、ログ結果を整理し、実行前後のworking treeを確認します。

成功、失敗、未実行を区別し、未実行には理由を付けます。生ログは大量転送せず、判断に必要な箇所だけを要約します。

ソースコード、docs、設定、テストの修正、失敗原因を修正しての再実行、未登録コマンドの標準確認化、生成差分や未追跡ファイルの独断cleanup、Git / Pull Request操作は禁止します。コマンド実行でworking treeが変化した場合は、変更内容を親エージェントへ報告します。

### sol-reviewer

実装担当から独立し、指示、正本docs、changed files、diff、テスト結果、CI結果を直接照合します。仕様漏れ、回帰、責務違反、過剰実装、テスト不足、停止条件違反、ADR Patternとレイヤードアーキテクチャの境界、PRレビュー強度と変更リスクの一致を確認します。

ファイル編集、修正実装、Git / Pull Request操作、Pull Request review投稿は禁止します。実装担当の説明だけを根拠に問題なしと判断せず、根拠のない一般論や好み、軽微な表現差で指摘を水増ししません。

指摘はBlocker、High、Medium、Lowの順とし、対象ファイル、該当箇所、問題、影響、必要な修正を含めます。問題がない場合も、確認範囲と未確認事項を明示します。

## 選択基準

基本ルーティングは次のとおりです。

| 状態 | 選択 |
|---|---|
| 対象が未特定で、検索、分類、抽出が中心 | luna-explorer |
| 仕様と責務が確定した通常実装 | terra-implementer |
| 複雑、曖昧、高リスク、複数レイヤー、原因不明 | sol-specialist |
| 差分作成後のコマンド確認 | terra-verifier |
| Level 3 / Level 4、AI harness、MDルーター、共通責務変更、重要な最終確認 | sol-reviewer |

小さい単一作業で、subagentを使う品質または速度上の利点がない場合は、親エージェントだけで処理します。すべての作業で機械的に5種類を起動しません。

## 並列と単一writer

- 同時に編集するsubagentは最大1体とする
- terra-implementerとsol-specialistを同時に編集させない
- 並列化は探索、ログ整理、検証、レビュー等の独立したread-heavy作業に限定する
- terra-verifierは実装完了後に実行する
- sol-reviewerは実装と検証結果が揃った後に実行する
- 親エージェントは必要なsubagentの完了を待ってから結果を統合する
- subagentからsubagentを起動しない
- subagentの結果は、親エージェントが現在の差分と照合してから使う

## 昇格と停止

- Lunaが編集、設計判断、矛盾解消を必要とした場合は親エージェントへ返す
- Terraが複数レイヤー、高リスク、仕様矛盾、原因不明問題を検出した場合はSolへ昇格する
- Solが必要な作業を節約目的だけでTerraへ降格しない
- Solでも必要な前提、安全境界、rollback、既存データ影響を確認できない場合は停止する
- modelが利用できない場合は、別modelへ黙って置換しない
- runtime permissionがagent設定より厳しい場合は、親セッションのpermissionを優先する
- docs、コード、テスト、指示の矛盾をsubagent内で推測統合しない

## verifierとreviewerの独立性

terra-verifierとsol-reviewerは、実装担当と同一の判断を追認するために使いません。

- verifierは修正せず、コマンドとworking treeの事実を返す
- reviewerは実装担当の説明ではなく、指示、正本docs、差分、確認結果を直接読む
- verifierの失敗をreviewerが成功扱いしない
- reviewerの解消可能な指摘が残る場合は、親エージェントが修正担当を決め、修正後に同じ観点で再確認する

## subagentの結果形式

すべてのsubagentは、担当範囲、確認根拠、判明した事実または実施内容、確認結果、未確認事項、停止理由、昇格要否を区別して返します。

役割固有の結果は次を含めます。

- Luna: 確認対象、根拠、判明事項、未確認事項、Terra / Solへの昇格要否
- Terra implementer: 変更ファイル、変更理由、実行確認、未実行理由、Solへの昇格要否
- Sol specialist: 前提、設計判断、責務境界、rollback、権限、既存データ影響、未確認事項
- Terra verifier: 実行前後のworking tree、コマンド、成功、失敗、未実行、生成差分
- Sol reviewer: 重要度順の指摘、確認範囲、未確認事項

## model利用不可と設定読込

project-scoped agent設定を成功扱いするには、projectがtrustedで、現在のCodex versionとアカウントが設定を読み込み、指定modelを利用できることを実際に確認します。

現在のsessionが新しい設定を再読込しない場合は、新しいCodex sessionまたはproject reload後に確認します。再読込、agent認識、指定modelでの起動を推測で成功扱いしません。

確認可能な環境では、次を事実として確認します。

- 5種類のagentが指定nameで認識される
- 各agentが指定modelとreasoning設定で起動する
- luna-explorerとsol-reviewerがread-onlyで動作する
- terra-implementer、sol-specialist、terra-verifierが親セッションのsandboxを越えない
- 各agentが担当条件、昇格条件、停止条件を返す
- subagentが再委譲しない
- model利用不可時に別modelへ黙って置換しない

Codex version、アカウント、trust、session再読込のいずれかで確認できない場合は、その項目を未確認として報告します。確認だけのためにNOOPファイル、ダミーコード、不要なcommitを作りません。

## permissionとsandbox

- subagentは親セッションのpermission、approval、runtime overrideを越えない
- sandbox_modeを省略したagentは親セッションから継承する
- read-onlyが必要なluna-explorerとsol-reviewerだけをagent設定で固定する
- runtime側がより厳しい場合は、より厳しい制約を優先する
- danger-full-access、approval回避、権限拡張を追加しない
- model routingのためにapproval、network、MCP、skills、sandboxのproject全体設定を追加しない

## 使用しない条件

次の場合はsubagentを起動しません。

- 小さい単一作業で、委譲による品質または速度上の利点がない
- MDルーターで作業プロファイルと対象範囲を確定できていない
- 対象repo、branch、既存差分、仕様、責務、確認コマンドを確認できない
- project設定がtrustedな設定として読み込まれていない
- 指定modelが利用できず、役割を維持したまま実行できない

model-selector、planner、PR本文専用、docs専用、UI専用、security専用のagentは追加しません。独立した責務が実際に発生した場合だけ、別作業として追加を検討します。

## GitとPull Request

branch作成、commit、push、Pull Request作成・更新は親エージェントだけが行います。subagentはGit操作を実装や検証の完了条件にせず、必要な差分、確認結果、未確認事項を親エージェントへ返します。
