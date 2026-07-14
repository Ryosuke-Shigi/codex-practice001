# Custom Subagent Runtime Verification History

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` project-scoped custom subagent
- Last reviewed: 2026-07-14
- Related policy: [Subagent Model Routing Policy](../rules/model-routing-policy.md)
- Related PRs: #149, #151

## 目的

この文書は、custom subagentの個別runtime検証履歴を1か所へ集約します。agentの選択、責務、fork、昇格、停止、安全境界は関連policyを正本とし、この文書では日時、session、実測値、失敗経緯、未確認事項だけを扱います。

会話ログや個人用設定ファイルのコピーは保存しません。再検証時に必要な事実だけを残し、設定値、期待値、runtime実測値、未確認値を区別します。

## 判定方法

- agent TOMLの`model`、`model_reasoning_effort`、`sandbox_mode`はproject設定値として扱う
- roleごとに期待するmodel、reasoning effort、sandboxは期待値として扱う
- resolved modelとreasoning effortは、親側runtime metadataまたはsession traceに記録された値で確認する
- 子agentの自己申告だけ、agent TOMLだけ、`inherited`表示からの推測はresolved値の根拠にしない
- effective sandboxはruntimeのsandbox policyとpermission profileで確認し、project設定値と分ける
- read-only確認のために既存ファイル、NOOPファイル、ダミーファイルを作成・変更しない
- 根拠を取得できない項目は未確認のまま残し、後続の確認結果で過去時点の判定を書き換えない

## 初回検証: custom role未適用

### Desktop新規task

Codex CLI `0.144.2`を使用したDesktopの新規taskで`luna_explorer`を指定した。親側でproject root、trust、branch、HEAD、remoteとの差分、working tree、project設定、6agent TOMLを確認してから起動した。

親側runtime metadataの記録:

| 項目 | 実測値 |
|---|---|
| child session | `019f5af3-cdb4-7f01-840e-9589b59e4701` |
| thread source / depth | `subagent` / `1` |
| task path | `/root/luna_explorer` |
| agent role | `null` |
| model / reasoning effort | `gpt-5.6-sol` / `xhigh` |
| effective sandbox | `workspace-write` |
| approval policy | `on-request` |
| cwd | `/home/shigi/projects/codex-practice001/src` |

子taskは完了したが、期待した`luna_explorer`ではなく、親と同じmodel、reasoning effort、sandboxを持つgeneric childだった。子の調査内容はcustom agentの検証結果に数えなかった。起動時の明示的なrole errorは記録されていない。

### interactive CLI新規session

Desktop taskを再利用せず、project rootから新しいinteractive CLI sessionを起動した。最初の試行は、検証task外側のfilesystem sandboxによりCodexのstate databaseへ書き込めず、`attempt to write a readonly database`でCLI開始前に停止した。これはproject設定またはagent role読込エラーとして扱わず、承認済みの同一コマンドをsandbox外で再実行した。

親CLI session:

- parent session: `019f5b01-23ae-7860-a6fd-f4be9204a11a`
- source / thread source: `cli` / `user`
- Codex version: `0.144.2`
- branch: `chore/codex-subagent-model-routing`
- HEAD: `070c3ae2706ad6d4e582e346b663541b9a0a48cd`
- remoteとの差分: `0 0`
- working tree: clean
- project trust: 確認済み
- project設定: `max_threads = 3`、`max_depth = 1`

この親sessionから起動した子の記録:

| 項目 | 実測値 |
|---|---|
| child session | `019f5b04-41e6-7dc2-b7f2-c8bab9a96be6` |
| task path | `/root/luna_explorer` |
| agent role | `null` |
| model / reasoning effort | `gpt-5.6-sol` / `xhigh` |
| effective sandbox | `workspace-write`、network disabled |
| approval policy | `on-request` |
| cwd | `/home/shigi/projects/codex-practice001/src` |

CLIでもgeneric childが起動した。`agent_role: null`を確認した時点で子taskをinterruptし、子の調査内容をcustom agentの結果に数えなかった。取得したtraceから、role catalog未読込とspawn連携時のrole未伝達を区別できなかったため、原因は未特定とした。

startup時にはagent roleと直接関係しないMCP未ログイン、参照ファイル欠落、PATH alias cache書込み不可のwarningもあった。取得したparent traceにagent role読込失敗warningはなかった。

## Windows側ユーザー設定を使った再検証

2026-07-14、Windows Codex Desktop + WSL環境で、repo外のWindows側ユーザー設定へ次の2項目を同時に設定した状態で再検証した。

```toml
[features.multi_agent_v2]
hide_spawn_agent_metadata = false
tool_namespace = "agents"
```

これは検証環境のユーザー設定であり、個人用設定ファイル自体をrepoへ追加していない。project側`.codex/config.toml`へも追加せず、project側は`max_threads = 3`と`max_depth = 1`だけを維持した。

### 起動前エラー

metadata公開だけを有効にした試行では、child起動前のreserved schemaエラーとして記録された。ただし、今回参照できたsession traceから正確なエラー全文を独立回収できなかったため、custom agentの成否や原因の根拠には使わない。

親と異なるrole、model、reasoning effortをfull-history forkと同時に指定した試行は、2026-07-14 00:54:09 JSTに次のエラーで起動前に停止した。

```text
Full-history forked agents inherit the parent agent type, model, and reasoning effort; omit agent_type, model, and reasoning_effort, or spawn without a full-history fork.
```

- 対象agent: `terra_implementer`
- task名: `verify_terra_implementer`
- 子agent: 未起動
- role、model、reasoning effort、sandbox: 未取得
- branch: `chore/codex-subagent-model-routing`
- HEAD: `070c3ae2706ad6d4e582e346b663541b9a0a48cd`
- working tree: clean
- 設定、docs、commit、push、PR操作: なし

このエラーはagent設定不良やmodel routing失敗として扱わず、以後は`fork_turns = "none"`を使用し、必要な文脈を子agentへのmessageへ明示した。

### `fork_turns = "none"`での6agent実測

親側session traceから取得した値:

| Agent | child session | agent role | resolved model | resolved reasoning effort | effective sandbox |
|---|---|---|---|---|---|
| `luna_explorer` | `019f5c27-3105-7a30-a411-c0a73d6d7f1e` | `luna_explorer` | `gpt-5.6-luna` | `low` | `workspace-write` |
| `terra_implementer` | `019f5c31-2017-7620-9885-d7f767726675` | `terra_implementer` | `gpt-5.6-terra` | `medium` | `workspace-write` |
| `terra_docs_maintainer` | `019f5c32-d733-7ca1-9fa8-c20f02860470` | `terra_docs_maintainer` | `gpt-5.6-terra` | `medium` | `workspace-write` |
| `terra_verifier` | `019f5c34-efcc-7513-bea0-3676320e2cf2` | `terra_verifier` | `gpt-5.6-terra` | `medium` | `workspace-write` |
| `sol_specialist` | `019f5c37-4550-7e31-945b-69784e59de97` | `sol_specialist` | `gpt-5.6-sol` | `xhigh` | `workspace-write` |
| `sol_reviewer` | `019f5c39-7304-7041-9dd0-d07e4df6d28f` | `sol_reviewer` | `gpt-5.6-sol` | `high` | `workspace-write` |

当初の確認時、`terra_verifier`の起動UIはmodelとreasoning effortを`inherited`と表示したため未確認として記録した。2026-07-14の履歴整理時に親側session traceの`turn_context`を直接確認し、上表の`gpt-5.6-terra` / `medium`を独立確認した。`inherited`表示から推測した値ではない。

`luna_explorer`はproject rootへ書き込み可能、`.git/`へ書き込み不可だった。`terra_docs_maintainer`はrestricted filesystemの`workspace-write`相当だった。他agentもruntimeのsandbox policyは`workspace-write`だった。全taskで書込み試験は行わず、検証後もworking treeはcleanだった。

## 2026-07-14 read-only再検証とterra_verifier確認

検証開始時:

- branch: `chore/codex-subagent-model-routing`
- local HEAD / remote branch / PR head: `17955d11cf6a6d6faba07925f15672de0b478f3e`
- localとremoteの差分: `0 0`
- working tree: clean
- PR #149: OPEN、Draft、mergeable
- CI run #448: success

### `luna_explorer`と`sol_reviewer`

親taskのeffective sandboxは`workspace-write`だった。read-only sandbox検証とrepo編集を同じ親taskで混在させない条件に従い、この親taskでは2agentを起動せず、read-only再検証を未実施とした。

したがって、今回の再検証でread-onlyを確認できたとは扱わない。直前の実測は両agentとも`workspace-write`で、project設定の`read-only`との差異の原因は未特定のままである。

### `terra_verifier`

`fork_turns = "none"`で`terra_verifier`を1回起動し、親側session traceを確認した。

| 項目 | 実測値 |
|---|---|
| child session | `019f5c61-c54e-7311-89d2-fd632141353d` |
| parent thread | `019f5c5c-4797-78c3-b227-945d65050993` |
| task path | `/root/terra_verifier_runtime` |
| agent role | `terra_verifier` |
| resolved model / reasoning effort | `gpt-5.6-terra` / `medium` |
| effective sandbox | `workspace-write`、managed restricted filesystem、network restricted |
| cwd | `/home/shigi/projects/codex-practice001/src` |
| branch | `chore/codex-subagent-model-routing` |
| HEAD | `17955d11cf6a6d6faba07925f15672de0b478f3e` |
| working tree | 起動前・確認後ともclean |

resolved値の根拠はsession traceの`session_meta.agent_role`と`turn_context.model` / `effort`であり、子agentの自己申告やagent TOMLではない。runtime検証中にファイル、Git、GitHubの変更はなかった。

## 2026-07-14 read-only親taskでの後続再検証

repo編集を行う`workspace-write` taskとは別に、Codex CLIを`read-only` sandboxで起動した親taskを使用した。子agentを起動する前に、親側session traceの`turn_context`でeffective sandboxとpermission profileを確認した。

検証開始時:

- parent session: `019f5c96-cf0a-7300-b61c-ae6a25044773`
- project root: `/home/shigi/projects/codex-practice001/src`
- branch: `chore/codex-subagent-model-routing`
- local HEAD / remote branch: `719631b9bea2533188f86e6e247ac5fbb28988dc`
- localとremoteの差分: `0 0`
- working tree: clean
- parent effective sandbox: `read-only`
- parent permission profile: managed restricted filesystem、root全体を`read`のみ
- approval policy: `never`
- network: restricted

親taskが`read-only`であることを確認した後、2agentを同時にせず、`fork_turns = "none"`で1体ずつ各1回起動した。1体目の完了と親側trace確認後にだけ2体目を起動した。

| Agent | child session | task path | agent role | resolved model / reasoning effort | effective sandbox | permission profile |
|---|---|---|---|---|---|---|
| `luna_explorer` | `019f5c98-6558-7c33-97af-e03b1b740db6` | `/root/phase_a_luna` | `luna_explorer` | `gpt-5.6-luna` / `low` | `read-only` | managed restricted filesystem、root全体を`read`のみ |
| `sol_reviewer` | `019f5c99-d4f0-7220-b5f3-78857a52bb52` | `/root/phase_a_sol_review` | `sol_reviewer` | `gpt-5.6-sol` / `high` | `read-only` | managed restricted filesystem、root全体を`read`のみ |

roleは各child traceの`session_meta.agent_role`、resolved modelとreasoning effortは`turn_context.model` / `effort`、effective sandboxとpermission profileは`turn_context.sandbox_policy` / `permission_profile`で親側から確認した。子agentの自己申告、agent TOML、`inherited`表示からの推測はruntime実測値の根拠にしていない。

検証前、agent間、検証後で次が不変だった。

- branch: `chore/codex-subagent-model-routing`
- HEAD: `719631b9bea2533188f86e6e247ac5fbb28988dc`
- localとremoteの差分: `0 0`
- working tree: clean
- `git diff --check`: 成功

既存ファイルへの書込み試験、NOOPファイル、ダミーファイル、確認用ファイルの作成は行っていない。runtime検証中のファイル変更、commit、push、PR更新も行っていない。

### `workspace-write`親taskとの比較

過去の親taskが`workspace-write`だった実測では、agent TOMLが`read-only`の`luna_explorer`と`sol_reviewer`もeffective sandboxが`workspace-write`だった。今回、親task自体が`read-only`の実測では、同じ2agentのeffective sandboxも`read-only`になった。

この比較から、effective sandboxはagent TOMLの設定値だけでは決まらず、親taskのlive runtime sandbox / permission profileの影響を受け、その境界内で解決されることを確認した。親taskが`workspace-write`のときにchildも`workspace-write`になった事実だけでは、agent TOMLの設定不良とは断定できない。read-only agentのeffective sandboxを検証する場合は、親task自体を`read-only`で起動し、親側runtime metadataまたはsession traceで親とchildの実効値をそれぞれ確認する必要がある。

これにより、`luna_explorer`と`sol_reviewer`がread-only親task下でeffective sandbox `read-only`になることと、過去の`workspace-write`実測との差異について、今回の完了条件に必要な範囲は解消済みとした。

## 現在の確認状態

| Agent | role | resolved model / reasoning | effective sandbox |
|---|---|---|---|
| `luna_explorer` | 確認済み | `gpt-5.6-luna` / `low`を親traceで確認済み | read-only親task下で`read-only`を確認済み。過去のworkspace-write親task下では`workspace-write` |
| `terra_implementer` | 確認済み | `gpt-5.6-terra` / `medium`を親traceで確認済み | `workspace-write` |
| `terra_docs_maintainer` | 確認済み | `gpt-5.6-terra` / `medium`を親traceで確認済み | restricted filesystem / `workspace-write`相当 |
| `terra_verifier` | 確認済み | `gpt-5.6-terra` / `medium`を親traceで再確認済み | `workspace-write` |
| `sol_specialist` | 確認済み | `gpt-5.6-sol` / `xhigh`を親traceで確認済み | `workspace-write` |
| `sol_reviewer` | 確認済み | `gpt-5.6-sol` / `high`を親traceで確認済み | read-only親task下で`read-only`を確認済み。過去のworkspace-write親task下では`workspace-write` |

この確認結果は、上記Windows側ユーザー設定を使った今回の環境に限定する。回避設定なし、別のCodex version、別アカウント、別環境での同一結果は保証しない。

## 今回の完了条件外で残る未確認

- repo外のWindows側ユーザー設定なしでのmodel routing
- 全環境、全Codex version、全アカウントでのcustom agent動作
- metadata公開だけを有効にした試行のreserved schemaエラー全文と原因
- `max_depth = 1`のruntimeによるnested spawn拒否
- model利用不可時のsilent fallback防止を失敗系で確認すること

これらは今回解消したread-only関連事項ではなく、PR成立条件またはmerge blockerとして扱わない。未確認事項は、設定値や別taskの結果から推測して確認済みにしない。

## 変更分離

- runtime検証中にrepoファイルを作成・変更していない
- read-only確認目的の書込み試験を行っていない
- Windows側ユーザー設定ファイルをrepoへ追加、コピー、追跡していない
- project側`.codex/config.toml`へWindows固有設定を追加していない
- runtime検証中にcommit、push、PR更新、Draft解除、mergeを行っていない
- LumiLabo関連ファイルを確認・変更対象に含めていない

## 2026-07-14 Subagent運用基盤17役再設計

この節は今回の個別実行結果であり、恒久的なagent選択・権限ルールの正本ではない。恒久ルールは`docs/ai/rules/model-routing-policy.md`、設定値は`.codex/agents/*.toml`を確認する。

### 対象と変更分離

- branch: `codex/subagent-harness-redesign`
- base HEAD: `c92b968f849cbd65b422cfccc90cf51b8cb951d4`
- `.codex/config.toml`: `max_threads = 3`、`max_depth = 1`を維持し、変更なし
- repo内にGit管理外Local MD、`.local/`、`.local-rules/`は確認できず、PC固有情報を共通docsへ転記していない
- runtime確認前後の`git status --porcelain`は27項目で不変。runtime用ダミー、NOOP、確認用ファイル、製品コード変更は作成していない
- commit、push、Pull Request操作は行っていない

公式仕様では、custom agent TOMLの必須項目と任意のmodel、reasoning effort、sandbox、およびmodelの用途別選択基準を確認した。設定値はruntime実測と分離した。

- https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents
- https://learn.chatgpt.com/docs/models#choosing-sol-terra-and-luna

### Static harnessのRed / Green / Refactor

`scripts/verify_codex_agents.py`を先に追加し、既存6役の状態でRedを確認した。Redでは新規11 TOML、17役catalog、共通契約markerの欠落を検出した。

Greenでは17 TOML、TOML構文、model / reasoning / sandbox期待値、`.codex/config.toml`、共通契約、policy登録を整合させ、次が成功した。

```text
python3 scripts/verify_codex_agents.py
Codex agent harness verification passed: 17 agent TOMLs and common contract are consistent.
```

Refactorでは、policy表のmodel / reasoning / sandbox drift、role固有責務marker、writer leaseのwriter名・対象ファイル・開始・終了条件、関連Markdownのローカルリンクを追加検査した。`terra_verifier`のpolicy表とTOMLの不一致を実際に検出・修正し、修正後もcheckerと`git diff --check`が成功した。

### 全17役のfresh session runtime確認

custom roleはfresh Codex CLI sessionから`fork_turns = "none"`で1体ずつ起動した。read-only役はread-only親、sandbox継承役はworkspace-write親で確認し、後者もtask上はGit読取りだけに限定した。resolved値は子の自己申告ではなく、親子関係を持つstate DBのthread metadataにある`agent_role`、`model`、`reasoning_effort`、`sandbox_policy`、`approval_mode`から照合した。

| Agent | child session | resolved model / reasoning | effective sandbox |
|---|---|---|---|
| `luna_explorer` | `019f5f2f-1bb2-74b2-9f40-d7adc49b6081` | `gpt-5.6-luna` / `low` | read-only |
| `terra_implementer` | `019f5f2f-331d-77a1-9628-5b1ae9ddb2c2` | `gpt-5.6-terra` / `medium` | workspace-write |
| `terra_docs_maintainer` | `019f5f2f-6da5-7952-aa25-ca8a7c6d1ca6` | `gpt-5.6-terra` / `medium` | workspace-write |
| `terra_verifier` | `019f5f36-d899-7593-b126-b113b9d9e0d1` | `gpt-5.6-terra` / `medium` | read-only |
| `sol_specialist` | `019f5f30-4d9c-7133-b41d-c5dbec15dc96` | `gpt-5.6-sol` / `xhigh` | workspace-write |
| `sol_reviewer` | `019f5f2f-3f40-7b73-9d7d-497af23e1876` | `gpt-5.6-sol` / `high` | read-only |
| `specification_reviewer` | `019f5f4c-3820-7ba0-b47d-641d76801147` | `gpt-5.6-terra` / `high` | read-only |
| `architecture_specialist` | `019f5f2f-c32e-7571-b42b-97b862486a82` | `gpt-5.6-sol` / `xhigh` | read-only |
| `design_specialist` | `019f5f2f-e397-7dc0-9bf6-401e7ebe06b6` | `gpt-5.6-terra` / `high` | read-only |
| `frontend_specialist` | `019f5f30-fdbf-7c92-ab06-5bba2b943ad4` | `gpt-5.6-terra` / `high` | workspace-write |
| `backend_specialist` | `019f5f31-333f-7fb2-893c-5c29a683aefe` | `gpt-5.6-terra` / `high` | workspace-write |
| `database_specialist` | `019f5f31-e83b-7db0-b0f4-905a38b309e0` | `gpt-5.6-sol` / `high` | workspace-write |
| `test_specialist` | `019f5f32-172e-72f2-8660-80e5e5cd547d` | `gpt-5.6-terra` / `high` | workspace-write |
| `context_recovery` | `019f5f32-d415-73b0-8eb6-96eb346fa8e8` | `gpt-5.6-terra` / `high` | workspace-write |
| `operations_specialist` | `019f5f33-0290-7870-a7f9-1ab5b14731d0` | `gpt-5.6-sol` / `high` | workspace-write |
| `browser_verifier` | `019f5f30-554e-7f93-81da-98224de133a4` | `gpt-5.6-terra` / `high` | read-only |
| `environment_specialist` | `019f5f4c-5385-7f73-929f-435e25a7e187` | `gpt-5.6-terra` / `high` | read-only |

read-only profileはmanaged restricted filesystemでroot全体がreadのみ、workspace-write profileはmanaged restricted filesystemでproject rootと一時領域がwrite、`.git`、`.agents`、`.codex`がread、どちらもnetwork restrictedだった。各childのapproval modeは`never`だった。

`terra_verifier`は初回確認で親継承だったため、TOMLを`read-only`へ修正後、fresh sessionで再確認した。`specification_reviewer`と`environment_specialist`はmodel比較反映後にfresh sessionで再確認した。その他の後続修正はdeveloper instructionsの契約強化だけで、表のrole / model / reasoning / sandbox値は変更していない。

### Terra High / Luna xhigh同条件比較

比較時点の同一candidate差分、同じread-only sandbox、同じ監査prompt、subagentなしで並行比較した。両sessionは同じbranch、HEAD、working tree項目を確認したが、比較時点のdiff hashは取得していない。金額換算costはruntimeから取得できないため推測せず、所要時間とtoken usageを記録した。

| Model | session | elapsed | input / cached / output / reasoning | state DB tokens used | 品質結果 |
|---|---|---:|---|---:|---|
| Terra High | `019f5f3a-9bf1-7013-8193-c3b6c661780e` | 171.314秒 | 451,154 / 332,288 / 7,245 / 4,332 | 458,399 | policy / TOMLの実在不一致、test roleの編集境界、review日を検出 |
| Luna xhigh | `019f5f3a-aa0a-7723-bd1f-52bd3c7c912b` | 389.388秒 | 1,297,742 / 1,145,856 / 17,892 / 13,148 | 1,315,634 | 観点は広いが上記policy / TOML不一致を見落とし、現在差分に該当しないanchor拡張等も提案 |

両方とも編集、Git / GitHub操作、subagent起動を行わず、停止条件を守った。今回の同条件ではTerra Highが短時間・少ないusageで、実在するdriftを検出したため、Luna xhighへの切替条件は成立しないと判断した。`specification_reviewer`、`environment_specialist`、`context_recovery`はTerra Highを採用した。read-heavy比較をwriter、DB、運用、browser tool利用へ外挿していない。既存のbounded検索役`luna_explorer`のLuna lowは今回の切替対象ではなく維持した。

### Codex App組み込みbrowser / Developer Mode / CDP

Browser skillの正規bootstrapを初回と最終確認時に実行したが、browser選択前に同じエラーで停止した。

```text
Mcp error: -32602: js: codex/sandbox-state-meta: sandboxCwd is not a local file URI: file:///home/shigi/projects/codex-practice001/src
```

このため、Codex App組み込みbrowser、Developer Mode、CDP、Console、Network、DOM、CSS、mobile / tablet / PC viewportは未確認である。対象URL、認証、fixture、許可操作も今回の製品画面作業として固定されていない。Chrome、Computer Use、curl、build等へ切り替えて実画面確認済みとは扱っていない。`browser_verifier`のrole / model / reasoning / read-only runtime認識は確認済みだが、実ブラウザ検証成功とは分離する。

### 残る未確認

- `max_depth = 1`によるnested spawn拒否のruntime実測。再委譲禁止は全17 TOMLのdeveloper instructionsとstatic harnessで確認済み
- model利用不可時にsilent fallbackしない失敗系runtime
- 組み込みbrowser bootstrap問題が解消した環境でのDeveloper Mode / CDP / 実画面検証

これらを設定値、静的checker、別経路の成功から確認済みへ読み替えない。

### 最終instructions反映後の17役contract smoke

初回`sol_reviewer`は、model / sandbox metadata確認後にdeveloper instructionsを強化した役があるため、現行契約のruntime証跡が不足していると指摘した。この指摘を採用し、最終TOML反映後に全17役を再度`fork_turns = "none"`で起動した。

- read-only親session: `019f5f5e-2a5a-7183-971b-d730bd6af9e5`
- workspace-write親session: `019f5f5e-2260-7ea1-a2a9-38b1f2dff060`
- 同時child: 最大2体
- childへ渡したもの: repo、project root、branch、作業段階、対象、編集不可、変更可・不可範囲、正本、確認済み事実、推測禁止、成功・失敗・停止条件、検証方法、7項目返却形式
- writer候補: writer leaseを与えず、Git読取りだけを許可
- `browser_verifier`: URL、認証、fixture、許可操作を与えず、browser開始前の不足停止を確認

| Agent | final contract smoke child session |
|---|---|
| `luna_explorer` | `019f5f5e-f04e-7080-9f40-d77835d6e8ad` |
| `terra_implementer` | `019f5f5f-3364-7d70-9dd9-5ac7bdde4fde` |
| `terra_docs_maintainer` | `019f5f5f-6af0-7183-8469-eceb3b6124fa` |
| `terra_verifier` | `019f5f5f-2cfa-7381-916a-35c1edd605ae` |
| `sol_specialist` | `019f5f60-0c17-7dd3-9a67-6e491f18ac91` |
| `sol_reviewer` | `019f5f5f-fd25-77c1-9ac0-cb52939dfc3f` |
| `specification_reviewer` | `019f5f60-37fe-79c0-856c-14491fa72316` |
| `architecture_specialist` | `019f5f61-2ce6-76b2-bf7f-83c1a2b8cdc9` |
| `design_specialist` | `019f5f61-678b-7bb3-9c05-423117d408dc` |
| `frontend_specialist` | `019f5f60-432a-7a52-ad0b-b2682598876d` |
| `backend_specialist` | `019f5f61-433c-7c43-8a57-96e0f2db4b03` |
| `database_specialist` | `019f5f61-7bda-74b0-988f-e045eb3d008b` |
| `test_specialist` | `019f5f62-66cf-7ee3-a154-c1ba3e4bc222` |
| `context_recovery` | `019f5f62-a30e-70f1-84de-29a1c6f85ee2` |
| `operations_specialist` | `019f5f63-8c79-7ee1-8fb2-17f4a2eaa50c` |
| `browser_verifier` | `019f5f62-6791-7792-9c6f-309c8b6b8860` |
| `environment_specialist` | `019f5f62-a73a-7a00-a960-c2f496f9315c` |

state DBで17 childすべてのrole、model、reasoning、effective sandboxを最終catalogと再照合した。各childは7項目形式で成功、失敗、未実行、未確認、停止・再実行条件を分離した。writer leaseなしの9役は編集せず、read-onlyの8役も編集しなかった。上記17 childをparentとする`thread_spawn_edges`は0件で、再委譲がなかったことを親側DBで確認した。

contract smoke開始前後で次が不変だった。

```text
tracked diff SHA-256: a869f399207ff7ae5cae7c886f0761ac532b40f6ad567b120bee999d2bab85f8
untracked content SHA-256: 6fb76e2cfec67934d6819ebb65ba022b7e0572f3af6697105839f671de4253dd
git status --porcelain items: 28
```

これにより、最終instructionsを読み込んだ全17役について、role / model / reasoning / sandbox、必須入力、編集禁止またはlease不足時の非編集、7項目結果、停止、Git / PR禁止、再委譲なしを確認した。`max_depth = 1`そのものがnested spawnを拒否する失敗系試験は、子agentへ再委譲禁止違反を要求するため実施していない。設定値による拒否は未実測のまま、developer instructionsによる禁止と実行時nested edge 0を確認結果とする。

### 単一writer、TDD、独立検証の証跡

- 実装中のrepo writerは親エージェント1体だけで、writer subagentへleaseを移していない
- runtime、verifier、reviewer実行中は親も編集を停止し、前後のstatusまたはcontent fingerprintを比較した
- harness TDDは、6役状態で11役・共通契約欠落を検出するRed、17役整合のGreen、policy表・role marker・writer lease・Markdown link検査を追加するRefactorの順で実施した
- 製品コード、Laravel、React、DBの変更はなく、製品テストのRed / Greenは対象外。Laravel test、npm test、buildは実行していない
- final `terra_verifier` child `019f5f52-4d65-7e91-8c98-47584d301414`が`python3 scripts/verify_codex_agents.py`と`git diff --check`を実行し、両方成功、実行前後のworking tree不変、生成差分なしを確認した

### 初回最終レビューの指摘対応

初回`sol_reviewer` child `019f5f54-203c-7e10-b3eb-11679f722ff2`の指摘を次のように処理した。

- High: 現行instructions適用後の17役runtime不足 → 上記17役contract smokeを追加
- Medium: reviewer再実行がBlocker / High修正後だけ → 採用指摘で差分・検証結果が変われば重要度を問わず再実行する契約へ修正
- Medium: static checkerの必須marker不足 → 編集可否、返却形式、resolved model、permission profile、HEAD、working treeを追加
- Medium: 単一writer / TDD / verifier証跡不足 → 本節へwriter時系列、Red / Green / Refactor、verifier childを記録
- Low: A/B比較を「最終差分」と表現 → 「比較時点の同一candidate差分」へ修正し、diff hash未取得も明記

修正後は同じ登録コマンドと同じ最終レビュー観点を再実行する。

## PR #151: Docker経由検証のruntime実測

この節はPR #151、branch `codex/subagent-harness-redesign`、HEAD `b82560f4b95425886a3461b2b1da57f868e0a544`に対する追加検証である。PR #149とbase HEAD `c92b968f849cbd65b422cfccc90cf51b8cb951d4`に対する過去節の結果は書き換えない。

### GitHub Actions CI run #456

2026-07-14にGitHub ActionsのCI run #456（run database ID `29314383314`）をGitHub CLIで確認した。

- workflow / job: `CI` / `test`
- head: `b82560f4b95425886a3461b2b1da57f868e0a544`
- conclusion: `success`
- `Build frontend assets`: success
- `Run Laravel tests`: success
- `Run Vitest`: success

この結果はGitHub Actions環境のCI結果であり、ローカル`terra_verifier`のruntime実測とは分離する。`python3 scripts/verify_codex_agents.py`は現時点でGitHub Actionsの専用ゲートとして登録されていない。

### repo境界と開始状態

Docker経由検証前にapp repoと外側Docker repoを別Git管理として確認した。

| Repo | remote | branch / HEAD | 開始時working tree |
|---|---|---|---|
| app | `Ryosuke-Shigi/codex-practice001` | `codex/subagent-harness-redesign` / `b82560f4b95425886a3461b2b1da57f868e0a544` | clean |
| outer | `Ryosuke-Shigi/laravel11-docker` | `main` / `52f20a85f2502ccf800e4ba70d9f0c2d30b6204f` | clean |

両repoの`AGENTS.md`、outer `docs/ai/rules/root-repository.md`、app `docs/operations/command-registry.md`を確認し、Docker Compose rootを`/home/shigi/projects/codex-practice001`、custom agent project rootを`/home/shigi/projects/codex-practice001/src`として分離した。Docker構成、製品コード、設定、Git、GitHubは変更対象外とした。

### workspace-write親taskでの先行実測

Codex Appの現在taskからfresh `terra_verifier`を起動した。親側state DBで次を確認した。

| 項目 | 実測値 |
|---|---|
| child session | `019f5f96-56f2-76d3-ae69-0e9186bf4b3c` |
| role / model / reasoning | `terra_verifier` / `gpt-5.6-terra` / `medium` |
| effective sandbox | managed restricted filesystem。project rootと一時領域はwrite、`.git` / `.agents` / `.codex`はread、network restricted |
| project root | `/home/shigi/projects/codex-practice001/src` |

3コマンドは成功したが、このsessionはeffective `workspace-write`であり、TOMLの`read-only`設定値だけではread-only経路の成立を証明できないため、正式なread-only実測を別のfresh parent sessionで行った。

### read-only親taskでの正式実測

- parent session: `019f5f9a-2541-76d3-914f-885259053291`
- child session: `019f5f9a-d17b-77f0-ac74-9c31ffc120a9`
- agent role: `terra_verifier`
- resolved model / reasoning: `gpt-5.6-terra` / `medium`
- effective sandbox / permission profile: managed restricted filesystemでroot全体read-only、network restricted
- project root: `/home/shigi/projects/codex-practice001/src`
- fork: `fork_turns = "none"`

親は検証を代行せず、子だけが外側Docker Compose rootで次を順に実行した。

| Command | Result |
|---|---|
| `docker compose exec php-fpm php artisan test` | exit 0、456 passed、4513 assertions |
| `docker compose run --rm npm npm run test:run` | exit 0、37 files、166 tests passed |
| `docker compose run --rm npm npm run build` | exit 0、Vite build成功。500 kB超chunk warningあり |

失敗と未実行はなかった。`npm run build`は`public/build/`へ出力し、このpathはapp repoの`.gitignore`対象だった。Laravel logも`storage/logs/.gitignore`対象である。verifierはcleanupを行わず、実行後もapp repoと外側repoの`git status --short`はともに空、branch / HEADは開始時から不変だった。Git管理外生成物の全内容、container / volume内部状態は完全比較していないため、Git working tree不変と外部runtime状態不変を同一視しない。

filesystem permission profileがread-onlyでも今回の登録済みDocker commandは成功した。この実測から、`terra_verifier`のTOMLは`read-only`を維持し、親が両repo、Docker Compose root、service、exact command、前後比較を固定したfresh read-only親taskから起動する構成を採用する。別環境で実行不能な場合は成功扱いせず、workspace-writeへの無条件変更、project権限拡張、別agent結果の流用を行わない。

### 未確認の維持

このDocker実測とCI成功から、次を確認済みへ読み替えない。

- Codex App組み込みbrowser、Developer Mode、CDP、Console、Network、DOM、CSS、実画面
- `max_depth = 1`によるnested spawn拒否の失敗系runtime
- model利用不可時のsilent fallback防止の失敗系runtime

### 静的契約とruntime証跡の分離

初回は静的checkerへ`terra_verifier`のDocker Compose root、両repo比較、read-only親task、生成物非cleanupに加え、このruntime履歴のPR番号、CI run番号、個別実測節もmarkerとして追加した。これは恒久契約と一時的な証跡の責務を混在させ、過去文字列が残るだけで成功する一方、runtime logの整理やarchiveで恒久契約が正常でも失敗する構造だった。

後続修正では、静的checkerの対象を次の恒久契約だけへ限定した。

- `.codex/agents/terra_verifier.toml`: Docker Compose root、app repoと外側repo、exact command、実行前後比較、cleanup禁止
- `docs/ai/rules/model-routing-policy.md`: read-only親task、Docker経由の登録済みコマンド、両repo分離、設定値とruntime実測の分離
- `docs/operations/command-registry.md`: Docker Compose実行場所、両repo比較、Git管理差分とGit管理外生成物、CIとローカルruntimeの分離

このruntime履歴はMarkdownリンク検査対象には維持するが、静的契約markerの対象にはしない。個別session、resolved model、sandbox、Docker実測、CI確認は証跡として保存し、その正確性と最新性はruntime確認とPRレビューで評価する。静的checker成功をruntime成功の代替にしない。

再発防止として、静的契約markerの対象pathに`docs/ai/logs/`が含まれる場合と、markerにPR番号、CI run番号、session ID、commit SHA形式が含まれる場合をchecker自身が検出する。guardを先に追加したRedでは、既存のruntime log path、`PR #151`、`GitHub Actions CI run #456`依存を検出した。その後にruntime log entryをmarker集合から外し、`TERRA_VERIFIER_STATIC_CONTRACT_MARKERS`へ改名してGreenへ戻した。
