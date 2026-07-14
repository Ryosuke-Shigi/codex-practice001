# Subagent Model Routing Policy

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-14
- Canonical source: subagentの選択、役割、非責務、単一writer、昇格、停止、安全境界

## 目的と正本の分離

この文書は、project-scoped custom subagentを、作業の曖昧さ、複雑さ、影響範囲、失敗リスクに応じて選ぶための正本です。

Subagent数を増やすことではなく、誤ったrepo、仕様の推測、責務逸脱、複数writer、未検証完了、破壊的操作を早い段階で検出し、修正または停止へ戻せる開発ハーネスを作ることを目的とします。

正本を次のように分離します。

| 観点 | 正本 |
|---|---|
| agent選択、責務、非責務、単一writer、昇格、停止、安全境界 | この文書 |
| agentごとのmodel、reasoning、project sandbox既定、実行指示 | [agent設定](../../../.codex/agents/) |
| thread数とnesting depth | [project設定](../../../.codex/config.toml) |
| 作業種別から読む導線 | [MDルーター](../workflows/md-router.md) |
| TDD | [testing.md](../../testing.md) |
| Harness / Loop Engineering | [loop-engineering.md](../workflows/loop-engineering.md) |
| 実行コマンド | [command registry](../../operations/command-registry.md) |
| 検出項目 | [Sensors](../../operations/sensors.md) |
| 個別runtime実測 | [runtime検証履歴](../logs/2026-07-14-custom-subagent-runtime-verification.md) |
| PC固有のGit、gh、WSL、実行経路 | Git管理外のLocal MD |

同じ詳細を複数docsへ全文複製しません。agent TOMLは、Codexがそのroleを実行するために必要な個別指示だけを持ちます。

## MDルーターとの順序

1. AGENTS.mdでrepo境界と安全条件を確認する
2. MDルーターで作業プロファイルを選ぶ
3. 必要なdocs、対象コード、仕様、責務、成功条件、停止条件、確認コマンド、レビュー強度を固定する
4. 独立した探索、監査、実装、検証、レビューへ分ける効果がある場合だけagentを選ぶ
5. 親エージェントが結果を現在の差分と照合し、最終統合と停止判断を行う

作業範囲を固定する前にmodelだけを選びません。すべての作業で17役を機械的に起動しません。

## 親エージェントの責務

親エージェントは次を担当します。

- 対象repo、project root、branch、HEAD、working treeを確認する
- 作業段階、対象、非対象、仕様、責務、成功・失敗・停止条件を固定する
- 必要なroleだけを選び、read-heavy作業だけを並列化する
- repo全体の単一writer leaseを管理する
- 子agentへ必要な文脈を明示し、結果を正本、差分、検証結果と照合する
- 仕様確定、重要設計、完成判定、Git / Pull Request操作、人間判断への返却を担う

model選択専用agentは起動しません。子agentの説明や自己申告を、そのまま最終回答、PR本文、runtime実測に使いません。

## Subagentへ渡す必須入力

すべてのmessageへ最低限、次を含めます。

- 対象repo、project root、対象branch
- 作業段階
- 対象ファイルまたは調査範囲
- 編集可否
- 変更してよい範囲、変更してはいけない範囲
- 正本docs
- 現在確認済みの事実
- 推測禁止
- 成功条件、失敗条件、停止条件
- 検証方法
- 親へ返す結果形式

不足する場合、子agentは推測で開始せず親へ返します。

## 全17役

projectには次の17種類のagentを登録します。Model、Reasoning、SandboxはTOML上の期待値であり、runtime実測ではありません。

| Agent | Model / Reasoning | Project sandbox既定 | 編集 | 主な位置 |
|---|---|---|---|---|
| `luna_explorer` | Luna / low | read-only | 不可 | 対象・参照・変更候補の特定 |
| `terra_implementer` | Terra / medium | 親継承 | 単一writer候補 | 仕様確定済みの通常実装 |
| `terra_docs_maintainer` | Terra / medium | 親継承 | 単一writer候補 | docsのみの実装 |
| `terra_verifier` | Terra / medium | read-only | 不可 | 登録済みコマンド検証 |
| `sol_specialist` | Sol / xhigh | 親継承 | 単一writer候補 | 複雑・曖昧・高リスク・複数レイヤー |
| `sol_reviewer` | Sol / high | read-only | 不可 | 独立最終レビュー |
| `specification_reviewer` | Terra / high | read-only | 不可 | 実装前の仕様成立性監査 |
| `architecture_specialist` | Sol / xhigh | read-only | 不可 | ADR Pattern・依存・責務監査 |
| `design_specialist` | Terra / high | read-only | 不可 | UI / UX・画面幅・アクセシビリティ設計 |
| `frontend_specialist` | Terra / high | 親継承 | 単一writer候補 | React / Inertia / TypeScript実装 |
| `backend_specialist` | Terra / high | 親継承 | 単一writer候補 | Laravelユースケース実装 |
| `database_specialist` | Sol / high | 親継承 | 単一writerまたは監査候補 | DB / Migration / rollback |
| `test_specialist` | Terra / high | 親継承 | 単一writerまたは設計候補 | テスト設計・先行テスト実装 |
| `context_recovery` | Terra / high | 親継承 | 単一writerまたは監査候補 | 型・コメント・テストから理解再起動 |
| `operations_specialist` | Sol / high | 親継承 | 単一writerまたは監査候補 | Docker / CI / deploy / rollback |
| `browser_verifier` | Terra / high | read-only | 不可 | 実画面・Console・Network・DOM・CSS |
| `environment_specialist` | Terra / high | read-only | 不可 | repo / OS / sandbox / tool / Local導線 |

`.codex/config.toml`の`max_threads = 3`は登録数ではなく同時open thread数です。17役登録を理由に増やしません。`max_depth = 1`はproject設定上の期待値として維持します。再委譲は各agentのdeveloper instructionsでも独立して禁止し、runtimeでnested spawnが拒否されたことを設定値だけから確認済みとは扱いません。

## 役割境界

### 探索・仕様・設計

- `luna_explorer`: 対象、参照、根拠を収集する。仕様成立性や設計を判断しない
- `specification_reviewer`: 固定された資料群から仕様矛盾、不足、受入条件、テスト固定事項を抽出する。仕様を決定しない
- `architecture_specialist`: 仕様確定後に責務配置、依存方向、過剰抽象化、テスト可能性を監査する。実装しない
- `design_specialist`: UI構成、状態、導線、画面幅、アクセシビリティを確定資料と照合する。実装しない
- `environment_specialist`: repo、branch、OS、runtime、tool、Local導線を確認する。Git操作や設定変更をしない

仕様が成立していない状態でwriterへ進みません。仕様の採否は人間が判断します。

### 実装writer

- `terra_implementer`: 技術領域を限定しない通常の小・中規模実装
- `frontend_specialist`: UI契約が確定したFrontend専門実装
- `backend_specialist`: 責務配置が確定したBackend専門実装
- `database_specialist`: DB変更が存在し、人間がschema、rollback、既存データ影響を判断した作業
- `test_specialist`: テスト設計を行い、必要時は先行テストだけをwriterとして実装
- `context_recovery`: 局所的な型、PHPDoc、JSDoc、コメント、古い説明の修正
- `operations_specialist`: 対象repo、運用経路、権限、rollbackが確認済みの運用変更
- `terra_docs_maintainer`: 目的、配置、正本、記載事実、索引更新先が確定したdocsのみ
- `sol_specialist`: 通常agentで成立しない複雑、高リスク、複数レイヤー、docs体系再設計

専門writerは、領域名だけで自動選択しません。親が仕様、リスク、必要な判断、編集範囲を比較し、1体だけを選びます。

### テスト・検証・レビュー

- `test_specialist`: 何をテストすべきか、どの層で固定するか、Redの期待理由を設計する
- `terra_verifier`: 登録済みコマンドを実行し、成功、失敗、未実行、working tree変化を返す。修正しない
- `browser_verifier`: 実ブラウザで同じURL、viewport、操作を再実行する。sourceを修正しない
- `sol_reviewer`: 指示、正本、差分、TDD、コマンド、browser、Sensorsを独立照合する。修正しない

test成功だけでbrowser確認済み、browser確認だけでtest成功、verifier成功だけで最終review完了とは扱いません。

### 理解再起動とdocs

- `context_recovery`: コード、型、コメント、テスト、局所契約から次回読む最小文脈を作る
- `terra_docs_maintainer`: 正本docs、Status、索引、配置、リンク、重複を管理する

会話ログ、個人メモ、未確認事項を恒久docsへ移しません。

### OperationsとEnvironment

- `environment_specialist`: 現在の環境前提を読み取りで確認する
- `operations_specialist`: 確定した運用構成の設計・変更・rollbackを扱う

アプリrepoと外側Docker repoを混同せず、Local MDのPC固有情報を共通docsへコピーしません。

## 単一writer lease

同時にrepoを編集できるのは、親エージェント自身を含めて最大1体です。

- 親がwriter名、対象ファイル、lease開始、終了条件を明示する
- read-only agent、verifier、reviewer実行中はwriterを停止する
- writer切替前に、前writerの停止、`git status`、diff、変更済み範囲、未完了、停止理由を親が確認する
- writer候補を同時に起動して編集させない
- 親が編集している間にwriter subagentを編集させない
- browser操作で外部状態を変える権限はrepo writer leaseに含めない

検証コマンドが生成差分を出した場合、verifierはcleanupせず親へ返します。

## TDD

コードまたは実行可能な仕様を変更する作業は、原則として次のTDDループへ接続します。

1. 仕様と責務を固定する
2. 既存テストを確認する
3. 不具合は現在の失敗を再現し、仕様変更は期待動作を先にテストへ書く
4. 意図した理由でRedになることを確認する
5. 選択中の単一writerが最小実装でGreenにする
6. 責務と成功テストを壊さない範囲でRefactorする
7. 対象テスト、回帰テスト、登録済みコマンド、必要なbrowser確認、独立reviewを行う

Redを確認せず、完成実装後に通るテストだけを追加してTDD完了としません。テスト先行が不適切または不可能な場合は、理由と代替Sensor、型、契約、browser手順、レビューを明示します。

## Harness Engineering

| ハーネス | 検出対象 | 主担当 | 失敗時の戻し先 |
|---|---|---|---|
| AGENTS / MDルーター | repo・段階・読込範囲誤り | 親 / environment | 親のscope固定 |
| agent TOML / static checker | role欠落、model、sandbox、共通契約drift | 親 / verifier | agent設定writer |
| specification review | 推測仕様、矛盾、対象外再設計 | specification reviewer | 人間 / 正本 |
| architecture / design | 責務逸脱、過剰設計、UI契約漏れ | 各specialist | 仕様またはwriter |
| TDD / 型 / DTO / Validation | 実行可能な仕様と境界の破壊 | test specialist / writer | Redまたは仕様 |
| command registry / verifier | 未実行、失敗、生成差分 | verifier | 親の原因分類 |
| browser | 実画面未確認、layout、Console、Network | browser verifier | writerまたは環境 |
| Sensors / reviewer | 目的外変更、検出漏れ、未解消指摘 | reviewer | writer / harness改善 |
| feedback loop | 再発防止先、理解再起動漏れ | 親 / docs maintainer | 適切な正本 |

確認だけのNOOP変更、ダミーagent、ダミー製品ファイル、不要commitを作りません。

## Loop Engineering

各ループは入口、1回の成果物、実行担当、検証担当、完了、再実行、昇格、停止、人間判断を持ちます。詳細はloop-engineering.mdを正本とします。

- 仕様ループ: 探索 → 正本確認 → 仕様整理 → 矛盾検出 → 修正 → 再確認
- TDDループ: 仕様固定 → Red → Green → Refactor → 対象 / 回帰確認
- 実装ループ: 調査 → 最小差分 → 単一writer → 差分 / 責務 / test → 修正
- browserループ: 再現 → 証跡 → writer修正 → 同一条件再実行 → viewport回帰
- reviewループ: 独立review → writer修正 → verifier / browser → 再review
- harness改善ループ: 再発分類 → 最も早い検出場所へ戻す → 再発ケース確認
- model routingループ: 同一条件比較 → 品質 / 速度 / 利用量 / 修正量 → 基準を満たすroleだけ反映
- 昇格・停止ループ: 軽量role → 専門role → Sol → 人間判断

同じ原因で改善せず再実行を繰り返しません。flake分類目的の無変更再実行は最大1回とし、同じ失敗なら停止します。

## 選択基準

| 状態 | 主な選択 |
|---|---|
| boundedな検索、分類、抽出 | `luna_explorer` |
| 実装前の仕様矛盾・受入条件 | `specification_reviewer` |
| 複数レイヤー責務 | `architecture_specialist` |
| UI / UX・画面幅・アクセシビリティ設計 | `design_specialist` |
| 明確な通常実装 | `terra_implementer` |
| Frontend専門実装 | `frontend_specialist` |
| Backend専門実装 | `backend_specialist` |
| DB / Migration | `database_specialist` |
| テスト設計・先行テスト | `test_specialist` |
| 局所的な理解再起動 | `context_recovery` |
| Docker / CI / deploy / rollback | `operations_specialist` |
| repo / OS / runtime / tool診断 | `environment_specialist` |
| docsのみ | `terra_docs_maintainer` |
| 登録済みコマンド確認 | `terra_verifier` |
| 実画面確認 | `browser_verifier` |
| 複雑・曖昧・高リスク・原因不明 | `sol_specialist` |
| 独立最終差分レビュー | `sol_reviewer` |

小さい単一作業で品質・速度上の利点がなければ親だけで処理します。SecurityとAccessibilityは常時独立roleを追加せず、該当する設計、実装、DB、運用、browser、reviewへ組み込みます。

## Model routingと同条件比較

恒久ルールは特定modelの宣伝値ではなく、役割、リスク、実測結果で選びます。

- Sol: 複雑、曖昧、高価値、高リスク、複数レイヤー、最終レビュー
- Terra: 日常的な実装、tool利用、専門作業
- Luna: 成功条件が明確な検索、分類、抽出、構造化されたread-heavy作業

Luna Extra HighとTerra High等を比較する場合は、同一task、同一入力、同一成功条件、`fork_turns = "none"`、相互の出力を見せない条件を使います。

評価項目:

- 完了品質、根拠の正確性、見落とし、誤検出
- 指示・scope・停止条件の遵守
- 不要変更、tool利用、親の修正量
- 所要時間、利用量、出力安定性

安全境界違反、根拠のない断定、必要な停止漏れ、不要変更があれば速度や利用量に関係なく不採用です。read-heavy比較結果をwriter、DB、運用、browser tool利用へ自動展開しません。個別結果はruntime logへ記録します。

## forkとruntime確認

親と異なるrole、model、reasoning effortを指定する場合は原則`fork_turns = "none"`を使い、必要な文脈をmessageへ明記します。

custom agentを成功扱いするには、trusted projectとfresh sessionまたはreload後に、親側runtime metadata / session traceで次を確認します。

- agent role
- resolved model、resolved reasoning effort
- effective sandbox、permission profile
- project root、branch、HEAD、working tree
- ファイル変更、Git / PR操作、再委譲、停止条件、結果形式

TOMLは設定値、roleごとのmodel / reasoning / sandboxは期待値です。子の自己申告、TOML、UIの`inherited`表示、ファイルを変えなかった事実だけをruntime実測の根拠にしません。

現在sessionが新設定を再読込しない場合は、17役の認識と起動を未確認として残し、新しいsessionまたはproject reload後に確認します。model利用不可時は別modelへ黙って置換しません。

## permissionとsandbox

- permission、approval、runtime overrideは親taskの境界を越えない
- `sandbox_mode = "read-only"`はproject設定上の既定値であり、絶対的権限制御とは断定しない
- sandbox省略agentは親から継承する
- read-onlyのeffective確認は、親task自体がread-onlyであることを親側traceで確認してから行う
- workspace-write親task下でchildもworkspace-writeになった事実だけでTOML不良と断定しない
- danger-full-access、approval回避、project全体のnetwork / MCP / sandbox拡張を追加しない

developer instructionsの禁止事項は維持しますが、sandboxによる権限制御の代替にはしません。

## Browser verifier

`browser_verifier`は、次が固定された場合だけ起動します。

- localまたは明示許可されたURL
- 認証方法、fixture / seed / cleanup
- 許可操作と禁止操作
- viewport、Route、期待結果
- screenshot、Console、Network、DOM、CSS等の証跡

Codex App組み込みbrowser、Developer Mode、CDPが利用可能なら使用します。利用不能な場合は理由、未確認範囲、代替確認を分け、代替を実画面確認済みとしません。未許可の登録、送信、削除、権限変更、本番更新を行いません。

## 昇格・停止・人間判断

- 軽量agentが設計、編集、矛盾解消を必要としたら親へ返す
- 通常writerが複数レイヤー、高リスク、原因不明、仕様矛盾を検出したら専門agentまたはSolへ昇格する
- verifier / browser / reviewerは修正せず、親がwriter leaseを再割当する
- runtime mismatchがあれば、そのagent結果を正式成果に数えない
- modelが利用できない場合、黙ってfallbackしない
- 仕様、責務、rollback、権限、既存データ、認証認可、Security、本番、破壊的操作、外部状態変更は必要に応じて人間判断へ戻す

## 共通禁止

すべてのsubagentで禁止します。

- branch作成・変更、commit、push、Pull Request作成・更新・review投稿・merge
- force push、rebase、履歴修正、本番反映
- 他のsubagentを起動すること
- 指示範囲の拡張、仕様の推測補完、既存差分の無断変更・cleanup
- secrets、個人情報、本番接続情報の記録

Git / Pull Request操作は、共通Git policyとユーザーの明示指示を確認した親エージェントだけが行います。

## 共通結果形式

すべてのsubagentは次を区別して返します。

1. 担当範囲とruntime確認可否
2. 確認根拠
3. 判明事実または変更内容
4. TDD / Harness / Loop上の結果
5. 成功、失敗、未実行
6. 未確認事項
7. 停止理由、再実行条件、昇格要否、人間判断

## 設定読込と検証

静的整合はcommand registryに登録された`scripts/verify_codex_agents.py`で確認します。これはTOML構文、17役、model / reasoning / sandbox期待値、共通契約、project設定、policy登録を検証します。

静的成功はruntime成功の代替ではありません。個別taskの日時、session、resolved値、sandbox、A/B結果、browser利用可否はruntime logへ集約します。
