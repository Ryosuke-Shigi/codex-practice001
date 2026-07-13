# Custom Subagent Runtime Verification History

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` project-scoped custom subagent
- Last reviewed: 2026-07-14
- Related policy: [Subagent Model Routing Policy](../rules/model-routing-policy.md)
- Related PR: #149

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
