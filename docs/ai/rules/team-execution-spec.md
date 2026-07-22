# Dynamic Specialist Team Execution Specification

- Status: active
- Scope: project-neutral AI harness core
- Mode: shadow
- Canonical source: Registry、Task Contract、Execution Policy、Run State、artifact

## 目的と現在地

この文書は、依頼ごとに必要最小のSpecialistチームを選び、単一orchestratorが契約、状態、権限、証拠、回復を管理する実行契約です。[Project Model Routing Policy](model-routing-policy.md) の親責務、単一writer、runtime分離を置き換えず、machine-readable coreとして具体化します。

現在はshadow modeです。coreはlocal JSONの検証・選定・判定・stagingを実装しますが、role availability、resolved model、effective sandbox、外部情報源接続、source activationのruntime成功を静的成功から推測しません。callerが接続済みflagやhashを渡しても外部接続evidenceとして信頼せず、外部情報源を更新済みとは扱いません。

## Machine-readable正本

| 文書 | 唯一の責務 |
|---|---|
| [Agent Capability Registry](../../../.codex/team-harness/agent-capability-registry.json) | domain、capability、path scope、risk trigger、許可role、symbolic model profileの上限 |
| [Execution Policy](../../../.codex/team-harness/execution-policy.json) | state集合、許可遷移、terminal、retry、write、source staging、legacy switch |
| [Versioned Schema](../../../.codex/team-harness/team-harness.schema.json) | 入力、Registry、Policy、Run State、12 artifact、commit manifest、commit anchorの閉じたschema |
| [Acceptance Scenarios](../../../.codex/team-harness/acceptance-scenarios.json) | 25シナリオと自動test名の1対1対応 |
| [Task Contract example](../../../.codex/team-harness/task-contract.example.json) | 29 user fieldを持つcanonical input envelope |

Execution Policyだけがstate、遷移、reserved state、evidence gateのownerです。reserved stateは`implementation_approved`、`source_sync`、`final_verification`、`final_review`、`completed`、`blocked`、`failed`、`needs_human_approval`、`cancelled`の9個を必須とし、terminalは`completed`、`failed`、`blocked`、`cancelled`、write可能stateは`implementing`、`retrying`のcanonical exact集合です。evidence gateはartifactのexact committed writer grant、quality grantのprior committed generation、retryingのverified-fix専用exit、final-review retry上限`needs_human_approval`を必須とします。state graphのexact値をPython定数、checker、schemaへ複製せず、schemaはclosed構造と参照型だけを検査します。semantic policy validatorは読み込んだPolicy自身を基準にstate重複、全stateのtransition、未知target、terminal outgoing、reserved/write/source/evidence関係を検証し、さらにPolicy artifact pinのversion/digestを照合するため、内容を任意変更してdigestだけ再計算しても受理しません。Registryはcanonical rootと各agentの全required fieldを要求します。`model_profile`はruntimeへ委譲するsymbolic値であり、具体modelやavailabilityではありません。

RegistryとExecution Policyのconstructorは欠落値をdefaultで補完しません。canonical schemaを満たす入力だけを受け取り、legacy変換はExecution Policyが明示的に有効化したadapter entrypointだけで行います。

`.codex/config.toml`はRegistry、Policy、Schema、Scenario、run directoryへの参照とPolicy artifact pinだけを持ちます。pinはschemaとcanonical exampleにも同じversion/digestを置き、state graphの意味は複製しません。mode、write authorization、retry、source sync、legacy adapterを複製せず、各runは開始時のExecution Policy snapshotを保持します。resume、authorize、completionはsnapshotとcurrent pinの一致を確認し、別runや後続configの値を混在させません。

## Task Contract

canonical envelopeは`schema_version`、`idempotency_key`、`task_contract`を持ち、任意のtop-level `role_assignments`はclosed objectとして`writer`、`reviewer`、`verifier`をちょうど1名ずつ指定します。Task Contractのuser fieldは次の29個です。

| 分類 | field |
|---|---|
| identity / intent | `task_id`、`title`、`goal`、`background`、`current_state`、`desired_state` |
| scope / risk | `scope`、`non_goals`、`allowed_paths`、`forbidden_paths`、`affected_domains`、`risk_level`、`required_capabilities` |
| acceptance | `acceptance_criteria`、`constraints`、`source_of_truth`、`required_checks`、`stop_conditions`、`retry_conditions`、`completion_conditions` |
| team / ownership | `team_assignment`、`primary_writer`、`consulting_specialists`、`reviewer`、`verifier`、`write_ownership` |
| approval / delivery | `approval_boundaries`、`required_deliverables`、`information_source_sync` |

validatorはrequired field、型、numeric minimum、required listの空、重複item、nested unknown property、project相対pathをfail closedで検査します。canonical input、resume、write authorization、source sync、runtime eventはそれぞれのpositive schemaへ通し、artifact/Finding/quality reportをgrant型ごとのdiscriminated event schemaで分離し、new/resume/write/source entrypointで`schema_version`を要求します。`allowed_paths`と`forbidden_paths`の矛盾、空のnon-goal/ownership、fixed assignmentのunknown/collision/scope不一致もteam形成前に拒否します。top-level `role_assignments`とfixed Task Contractを同時指定する場合はwriter/reviewer/verifierが完全一致しなければblockedにし、どちらかを黙って優先しません。正規化後は`schema_version`とdigestを付与しimmutableにします。`human_summary`は同じ29 fieldとdigestから決定的に生成し、別編集しません。team形成前の入力問題は、raw値を持たないclosedなsanitized input problem projectionとして入力種別、field名、canonical blocker/rejectionだけを保存し、そのdigestをcanonical start requestとimmutable run identityへ結合します。field名自体にpersonal absolute path、session identifier、secret、token、password、private markerがある場合もprivateと分類し、生のkeyをproblem projection、Run State、artifact、generationへ残しません。安全な既知field名は維持し、unknown top-level/Task Contract fieldというcanonical problem codeだけを残します。Task Contract自身にschema、型、空値、item、path等のblockerがある場合は、元のraw built contractを保存せず、全invalid caseで同一のschema-valid・value-independent safe rejected Task ContractをRun State、start request、artifactへ使い、元のcanonical problem codeだけをsanitized projectionへ保持します。valid Task Contractに対するenvelope/Registry/capability問題ではvalidated contractを維持します。private new inputはcanonical/legacyとも元のidempotency key、title、path、agent等を破棄し、固定safe idと同じsafe rejected Task Contract fallbackへ収束してterminal blockedにします。resume時のrun IDは既存runを探すrouting境界だけに使い、redaction rejectionを永続化しません。

`required_checks`、`required_deliverables`、`retry_conditions`、`completion_conditions`は既知predicateまたはmachine-checkable IDだけを受理します。custom check/deliverable/completion predicateは、Run Stateへ先に保存され、そのIDとrun/contract/plan provenanceへ結合したartifact receiptがなければ自己申告で充足できません。

欠落または曖昧な仕様、scope不一致、絶対path、traversal、`.env*`、`.git/**`、secret、token、password、private key、session identifier、個人絶対pathはteam形成前に停止します。入力問題projectionにはraw value、private value、元のprivate-input idempotency keyを保存しません。[Team Task Contract Skill](../../../skills/team-task-contract/SKILL.md) は同じschema、validator、CLIだけを使い、別契約を持ちません。

## Team形成とwave

選定はdomain、全required capability、全allowed path、risk triggerを組み合わせます。primary writerは契約のdomain・capability・pathを単独ですべて覆う1体だけです。writer複数体のcoverage集約は行わず、該当writerがなければwrite grantを1件も発行せずblockedにします。広いpath一致だけの不要Specialistは追加しません。top-level `role_assignments`がある場合はそのwriter/reviewer/verifierをexact assignmentとして使い、欠落、複数指定、role不適合、衝突、unknown agent、writer scope不足をblockedにしてdynamic fallbackしません。Run Stateは`role_assignments`、Registry/Policy/Task Contract、sanitized input problem projectionを含むcanonical start request snapshotを各digestとともに固定し、start authority全体をrun IDへ結合します。load時はcurrent Registryとpinned Policyを使って`select_team`と`plan_waves`を再実行し、teamの順序・role・全Registry field・selection reason、fallback、eligible writer、ownership、runtime profile、wave、thread countが完全一致しなければstructured integrity blockedにします。

各runはorchestrator、1 primary writer、必要最小のread-only Specialist、writerと異なるverifier、writer/verifierと異なるreviewerを持ちます。入力問題がないrunはpersisted teamが空でもcanonical selection replayを無条件で実行し、selection、ownership、profile、wave、grant、metricsのexact projectionと照合します。sanitized input problem projectionに初期blocker/rejectionがあるterminal blocked runだけはteam形成前のexact unselected projectionを再生し、空team、空grant、null selection、空ownership/profile/wave、thread count 0以外を拒否します。waveは最大3個で、wave 1をimplementation memberだけ、wave 2をverifierだけ、wave 3をreviewerだけに固定します。implementation waveが`max_threads = 3`を超える場合は後続waveへ押し出さずblockedにします。`max_depth = 1`であり、member総数を同時thread数へ読み替えません。

Shared Planはrevisionを持ちます。Task Contractは変更せず、実行順序だけをrevision付きで更新します。Specialist Finding receiptは`status: open`とcanonical digestを持つappend-only記録で、verified fix後も変更しません。解決はissue identity、元Finding digest、fix artifact receipt/report/attempt/cause/provenanceへ結合したappend-only resolution receiptを追加して表し、検索用catalogの`open`/`resolved`とresolution digestは両receipt列から決定的に導出します。Findingは`issue_id`、`clause`、`location`で同一論点を関連付け、position衝突は自動解決せず`needs_human_approval`へ送ります。

plan、implementation artifact、write ownershipの変更はartifact revision/digestを進め、derived approval、initial/final report、source stagingを無効化します。approval以降のstateに古いapprovalを残しません。public Finding eventは割当済みreviewer/verifier actor、actorと一致するsource、`issue_id`、`clause`、`location`、`status: open`を必須とします。public eventからresolvedを作れず、verified fixだけが明示されたissue IDをresolveします。

## Stateとevidence gate

代表経路は次です。ただし許可の正本は常にExecution Policyです。

```text
received → discovering → contracted → team_formed → planning → implementing
→ verifying → reviewing → implementation_approved → source_sync
→ final_verification → final_review → completed
```

verification/review reportはactor、required checks、attempt、plan revision、artifact revision/digest、diff digest、input/environment fingerprint、report digest、provenance、orchestrator-issued quality grantへ結合します。grantはRun Stateへ先に保存されたexact objectだけを受理し、caller生成・一部改変・期限切れを拒否します。load時もpersisted quality reportのdigestをevent payloadから再計算し、actor、phase/role、exact persisted grant generation、attempt、plan/artifact/diff/input/environment、checks、status、provenanceを再検証します。final reportはさらにcurrent staging digest、source manifest digest、committed source revisionへ結合し、failure historyは完全なhistorical report snapshot、実report generation ref/revision、Finding identity列を保持します。各entryはreport digest、cause、generation、同reportで解決されたまたは当時未解決のFindingから作るone-to-one failure historyとしてcanonical再投影し、重複receiptと同causeの別attempt Finding混入を拒否します。load時はhistorical report generationのmanifest/stateへ戻り、snapshot、grant、artifact、plan、revision、attempt、cause、report digestを照合します。historical entryの各identityは同generationのFindingのissue/clause/location/source/digestと一致します。resolution receiptが存在するidentityだけを対応するresolutionおよびfix artifact receiptのissue IDへ追加照合し、receiptがないidentityはopen blockerとして維持します。不足・古い証拠・fictional generation・unrelated issue・不正digest/provenanceはstructured integrity failureです。`passed`、`failed`、`blocked`を全report phaseでtotalに分岐し、retry上限到達時もfailed report、failure history、counter、rejectionを同じgenerationへ保存してcanonical stop stateへ遷移します。final verificationの`blocked`はterminal `blocked`へ送ってreserved dead-endを残しません。canonical checksはnormalized report、verification/review summary、`metrics.test_results`へ保持し、空のlegacy summaryで上書きしません。grantの`runtime_authenticity_status`は`unverified`であり、local受理をruntime認証成功へ読み替えません。

failure historyのidentityは`report_digest`、`phase`、`attempt`の組であり、保存generationそのものを同一性には使いません。各entryは、そのreportを記録したhistorical generationに存在したFinding identityのexact集合を保持します。後続のverified fixは個々のissueへresolution receiptを追記するだけで、historical entryを現在のopen/resolved状態へ再投影しません。fix artifactとresolution receiptへ結合できるのは、そのresolution receiptが実在するidentityだけです。複数failureの一部だけを解消した場合、残るopen issueは保持され、全issueが証拠付きで解消されるまでapprovalやcompletionへ進めません。同じissue/clause/location identityが解消後に再発した場合は新しいappend-only Finding digestを追加し、全Finding digestとresolution receipt列からcatalogを再投影してopenへ戻します。過去Findingやresolutionを上書きせず、新しいFindingを解消するreceiptが追加されるまでbounded retryの未解決causeとして扱います。

`implementation_approved`は直接eventで設定できません。現行artifactに対するinitial verificationとinitial reviewがともにpassし、未解決Finding・conflict・blockerが0の場合だけorchestratorがderived approvalを作ります。generic transitionは9個すべてのreserved stateへの出入りを拒否し、orchestrator内部の専用gateだけが遷移させます。runtime遷移とload時trace replayは同じpure dedicated state gateを使い、approval/source/final/completedとblocked/failed/needs-human/cancelledの証拠predicateを一致させます。event batchは全eventを事前検証してcopy上で順番に評価します。Finding conflictがreserved遷移を作る場合は、save前にもstorage/replayと同じpure typed exact reserved evidence predicateをcandidateへ適用します。conflict原因Findingと無関係Finding等を順序に関係なく同batchへ混ぜた場合は`event_batch_after_reserved`としてbatch全体をatomicに拒否し、public APIからsave時例外を出さず、persisted state、Finding、revision、generationを変更しません。通常の拒否もbatch全体のstate、plan、artifact、Finding、attempt、revisionを変更しませんが、retry/stop専用gateがfailure report、history、counter、rejectionとcanonical reserved stop stateを同時に確定する場合は、そのfailure evidenceをatomic rollbackで消しません。

reserved stateへ入る各trace entryは、そのentryを導入したgeneration固有のclosedなreserved evidenceを持ちます。reserved transitionを含む1 generationのnew trace suffixは、reserved transitionをexactly 1件だけ持ち、そのentryをsuffix末尾かつ保存後の`run.state`と一致させます。証跡はrun ID、generation revision、transition sequence、target state、Task Contract digest、artifact revision/digest、staging/source binding、completion digest、非循環canonical gate-state digestに加え、そのgenerationで初めて追加されたtransition reason/cause、report、Finding、receipt、failure、rejection、blocker、conflictのgeneration-new evidenceへ結合します。target-specific causality projectionはreason/cause digest、reportのphase/kind/status/digest、Finding identity、receipt/failure/conflict digest、rejection/blocker codeをclosedに保持し、kindごとのtyped exact causal subsetだけを許可します。initial blockerはreason別のcanonical blocker/rejection全体、implementation approvalはgeneration-newのpassed initial review、Finding conflictは同一identityのposition集合だけ、quality blockerはexact phase/report/status/cause、failure snapshot、reason、rejectionを要求します。`blocked`は同generationの許可されたinterrupt、initial blocker、stop condition、blocked reportだけ、`failed`は同generationのretry-limit failureだけ、`needs_human_approval`は同generationのFinding conflictまたはfinal-review retry-limit failureだけをcauseにできます。正当causeと無関係なFinding、receipt、rejection、blocker、conflict、reportを同generationへ混在させた場合も受理しません。過去failureのrelocation、誤ったphase/kindのreport、借用したrejectionもtargetを正当化できません。runtime producer、save、全historical load replayは同じpure typed projectionを使います。saveは確定revisionとprior committed stateから新規suffixだけに証跡を付与し、loadは各historical generationのprior stateと同じpredicateを再生します。rejection、blocker、conflictもgeneration間のappend-only exact prefixです。不一致は`reserved_trace_generation_evidence_invalid`です。

quality reportのstatusを判定してからretry/stop先を選び、failed/blocked branchがreserved stateを中間通過しないPolicy edgeを使います。under-limit final-review failureはfailed report、failure history、cause counter、open drift Finding、transitionを1 request、1 generation、1 saveで`final_verification`から`retrying`へcommitします。blockedとretry-limitも同じ単一generationでPolicy所有の`blocked`または`needs_human_approval`へ進み、`final_review`へ入るのはpassed branchだけです。private pending transitionやsecond saveへ依存しません。`source_sync`からretry上限の`failed`へ、`final_verification`からfinal-review上限の`needs_human_approval`へ進むedgeをExecution Policyが所有し、Python側へstate graphを複製しません。

失敗後のretryはfailed report digest、正規化cause fingerprint、attempt、plan revision、explicit issue IDs、immutable input/environment fingerprint、Run Stateへ先に保存されたdiff receiptとproducer/run/contract/plan provenanceを要求します。receiptのpath/content digestとissue因果を永続化済みartifactに照合し、Task Contractの全`receipt:<id>` retry conditionが同じverified causal fix receiptのreceipt/check/deliverable ID集合に含まれることも要求します。generic transition into `retrying`と`retrying`からのgeneric transitionをともに拒否し、failed/blocked canonical quality report処理の内部gateだけがretryへ入り、全検証済みfixの内部gateだけが`implementing`へ戻します。全検証が成功するまでattempt、revision、Finding receiptを一切変更しません。callerが任意hashを提示してもfix artifactにはなりません。同一cause fingerprintがPolicy上限を超えた時点で停止し、message一致だけでFindingをresolveしません。

initial reportとfinal reportは別artifact entryです。source staging後のfinal reportはcurrent staging artifact digest、source manifest digest、source revisionへ追加結合し、final verificationの後にだけfinal reviewを受理します。final review failureはcause fingerprint、failure history、open `FINAL-DRIFT`へ結合してbounded retryへ入り、同一原因上限ではPolicy固定の`needs_human_approval`へ停止します。completion gateは未来stateやreportを合成しません。`final_review`にあり、4 reportがcurrent/pass、final reportがinitialと別、staging/source bindingがcurrent、Task Contractのcompletion/deliverable境界を保持し、blocker・rejection・未解決・driftが0の場合だけ`completed`へ遷移します。

completion reportは単一のcanonical completion/source binding projectionです。`completed`を導入するgeneration revision、run ID、Task Contract digest、current artifact revision/digest、source artifact/manifest digest、staging digest、initial verification、initial review、final verification、final reviewのfour report digestsをclosed required fieldとして保持します。runtimeのcompletion reasons/current checkとload時検証は同じprojectionを使います。save前の判定はCASで確定する次generationへ結合し、load時は保存済みgenerationからexact再投影します。source、Task Contract、artifact、initial/final reportのいずれかが変わった後に古いcompletionや古いfinal evidenceを再利用できず、`completion_source_binding_invalid`で停止します。情報源同期候補も、最終検証を通過した同じartifact、staging、source manifestへ結合されたものだけです。

`completed`、`failed`、`blocked`、`cancelled`はterminalです。取消はactorを`orchestrator`へ固定し、非空reasonを必須とするclosed `cancel` eventと専用gateだけで受理します。このdedicated cancellation evidenceをreserved evidenceへ結合し、generic transitionによる`cancelled`到達を拒否します。`interrupt`は従来どおり`blocked`でありcancelへ読み替えません。terminal runへの遅延event、Finding、resume、requestは`terminal_immutable`として拒否し、artifact generationを増やしません。public runtime schemaは証拠のない`review_failed`を公開eventとして受理せず、failureはcanonical quality reportだけから記録します。

## run-scoped write authorization

Registryは権限上限、Task Contractはその縮小、Run Stateのownershipは現行割当、orchestrator-issued grantはlocalな書込判定根拠です。authorize requestはrun ID、expected run revision、割当writer、空でないexact path ownership、現行ownership revision、現行lease epochを同時に満たす必要があります。

writer grantはgrant ID/kind、run ID、agent、exact paths、ownership revision、lease epoch、issued revision、有効期限、issuer、grant digestを持ち、Run Stateへartifactと同じcommitで保存します。authorize時はcaller値を再計算して信頼せず、prior committed generationのpersisted grantとの完全一致を要求します。missing、期限切れ、未commit、改変、別run/agent/path/revision/epochは拒否します。未知runはlock directoryを作る前にread-onlyで判定し、structured not-foundを返します。write可能stateはpolicyの`implementing`または`retrying`だけです。reviewer、verifier、read-only Specialist、unknown agent、Task Contract外、Registry scope外、forbidden path、traversal、project root外へ解決するsymlinkはfail closedです。coreのauthorize結果はruntime enforcement成功を意味しません。

write grantは選定済みprimary writer 1体だけに発行します。ownership revisionも全exact pathを同じprimary writer 1体へ割り当てる場合だけ受理し、read-only Specialistをownershipへ加えてwrite grantを作りません。reviewer、verifier、read-only Specialist、coverageを集約した複数writerにはdeny用grantも発行しません。複数writerのworktree requestは、pathがdisjointでもwrite authorizationへ昇格させません。coreはworktree作成やruntime権限付与を行いません。

## Persistence、integrity、resume

各runは`.codex/runs/<run-id>/`のrun単位interprocess `flock`で直列化します。更新はexpected revisionによるcompare-and-swapです。各成功saveは新しいimmutable generationへRun State、state trace、12 artifact、generation commit manifestを書き、最後にrun rootのcommit manifest pointerをatomic replaceし、その後に同じlocal trust boundary内のcommit anchorをatomic更新します。anchorは全revisionのmanifest digest連鎖とhigh-watermarkを保持し、rootだけまたはanchorだけの一方的な巻戻しを検出します。root交換前のcrash orphanはanchorへ載らず無視し、root交換済みでanchor更新前のnext childだけはparent digestを照合してanchorを回復します。

rollback検知の保証範囲はlocal trust boundary内の非協調な変更です。root pointerだけの巻戻し、anchorだけの巻戻し、途中破損、manifest chain、artifact、状態遷移、receipt、source、completionの不整合、未承認変更をfail closedで検出します。一方、root manifestとlocal anchor、および参照先の旧generationを、両方へ同等以上の権限を持つ主体が整合した状態で同時に巻き戻すcoordinated rollback攻撃は対象外です。この協調巻戻しを検知済み、防止済み、安全保証済みとは扱いません。外部append-only ledger、TPM/OS monotonic store、署名鍵、MAC鍵、未承認secretsは導入していません。将来の外部trust anchor追加は可能ですが、現在の実装保証ではありません。

commit manifestはgeneration/state reference、state digest、trace digest、12 artifact digest、receipt artifact ref/digest/authority binding、staging artifact ref/digest、provenance、自身のdigestに加え、parent generation、parent manifest digest、parent state ref/digest、parent artifact refsを持ちます。初回parentはnullです。loadはroot pointerと各historical manifestをschema-firstで検証し、schema failureならinteger/path access、anchor判定、semantic validatorを呼ばず停止します。semantic validationの内部例外も秘密値や例外文を返さないgeneric integrity codeへ変換します。その後root pointerからparent manifest chainだけを逆走し、revisionの連続増加、各manifest/state/artifact digest、parent binding、rootとgeneration manifestの一致を検証します。state trace、Finding、failure history、implementation/resolution/artifact receipt log、improvement proposalは直前generationのexact prefixを保持し、Task Contract、start request、sanitized input problem projection、role assignment、Policy、Registry bindingは全chainでimmutableです。projection digest、start request digest、canonical Task Contract、role assignment、Registry/Policy authorityからrun IDを再計算するため、projectionと自己申告digestをまとめて再hashしても既存run identityでは受理しません。`specialist-findings`をRun StateのFinding receipts/catalog/conflictsから毎generation canonical生成し、全12 artifactをRun Stateから再投影してcontent/ref/manifest digestを照合するため、削除・rewrite後にstateとartifactを再hashしても受理しません。artifact receiptは各generationで新規追加分をraw content、prior committed exact write grant、generation ref、run/contract/planへ戻すcanonical raw receipt projectionとして再構築し、callerがmetadataを再hashしたreceiptや既存raw fileを使ったappendを拒否します。receipt path scopeは各pathを正規化したうえで、receiptを作ったhistorical generationのexact write grant、Task Contractのallowed pathとscope include/exclude、forbidden path、active ownership、およびcurrent Registry writer path scopeへ再結合します。さらにreceipt初出時のprior stateがpinned Policyのwrite-enabled stateであること、actorがprimary writerであること、ownership revision、lease epoch、grant producer/run/agent/issued revision/digest、receipt provenanceをprior write-enabled generationへ結合します。許可範囲外、時間範囲外、または無関係なpathは、receiptが存在していてもcheck、deliverable、retry、completionを正当化できず、`receipt_path_scope_invalid`です。Run StateはRegistry snapshotのversion/kind/digestも保持します。Run State schemaは永続化する全canonical fieldをrequiredとし、team、selection、authority grants、Finding/resolution receipt、report、source、artifact、metricsをnested closed/type/required schemaで検証します。load時はcurrent canonical Registryへ全team memberを再結合し、ID、assigned role、Registry roles/domains/capabilities/path scopes/risk triggers/model profile/agent digest、primary/quality assignment、write/quality grant actor・role・phase・generation、catalog projectionを照合します。さらにstateのPolicy所属、traceの連続性・末尾state・全transition・sequence、revision、report、Finding receipt digest/status/identity、receipt-derived catalog、artifact provenance、source flags、metricsをsemantic validatorで照合し、digestだけ再計算したcorruptionも信頼しません。各fileをfsyncし、artifact/receipt/staging/generation/generations/run directoryをcommit pointer交換前にfsyncします。pre-swap fsync失敗やcrashではpointerを交換せず前generationを読み続けます。load/resume/completion時にmanifest JSON、run directory containment、absolute/traversal ref、Run State schemaとsemantic consistency、Task Contract digest、trace、artifact digest、artifact provenance、receipt raw contentとdigest、run/revision identityを再検証します。全generationのhistorical stagingについてもref containment、file存在、content digest、generation manifest binding、source manifest digest、final reportのstaging/source/revision bindingを検査します。不一致は例外で外へ抜けたり復元・上書きしたりせずstructured blocked integrity failureとして停止します。stale CASも拒否します。同一idempotency inputは同じrunを返し、拒否だけで意味上の変更がないresumeは新generationを作りません。

## Artifact set

各generationは次の12 JSON artifactを持ちます。

1. `task-contract`
2. `baseline-inventory`
3. `team-assignment`
4. `specialist-findings`
5. `shared-plan`
6. `implementation-log`
7. `state-transition-log`
8. `verification-report`
9. `review-report`
10. `source-update-manifest`
11. `completion-report`
12. `improvement-proposals`

Artifact referenceはdigestとrun/contract/revision provenanceを持ちます。artifact eventはcallerが提示したwrite authority grantとprior committed Run Stateのactive primary writer grantが完全一致し、write可能state、Task Contractのexact allowed path、Registry scope、active ownershipをすべて満たす場合だけ受理します。quality eventのquality grantとはschema上も型を分離します。orchestratorはcallerの自己申告をreceiptとして信頼せず、raw immutable contentをgeneration内へ保存し、そのref/digest/grant digestをcommit manifestへ結合したartifact receiptを発行します。同じbatchのartifact/plan/ownership変更で再発行された未commit grantを後続quality reportが使う場合はbatch全体を拒否します。check、deliverable、retry gateはこのverified receiptだけを信頼します。`implementation-log`はentriesに加えてRun Stateから完全再計算するclosed metrics projectionを持ちます。team順序、selection reasons、team/wave count、retry、verification/review failure、architecture violation、test summary、source update、completion/blockedをstored state/history/team/plan/source/completionから導出し、elapsed time/token/costは計測入力がないため常に`unavailable`です。load時はunknown fieldを拒否し、metrics digestとimplementation-log artifact contentまでcanonical projectionと完全一致させます。改善提案はmetrics digestとartifact referenceを根拠にし、自動適用しません。raw private dataは保存せず、権限拡張、Security policy、schema、外部公開はhuman approvalへ戻します。保持方針は30日ですが自動削除しません。

## Strict source staging

source requestはExecution Policyの`minimum_state`、current derived approval、current initial reports、未解決0、exact artifact revision/digestを要求します。さらにpayload、source baseline digest、target identityが必要です。Policyがmanual activationを要求する場合のactivation、private data、stale/missing evidence、no-overwrite対象は拒否します。

受理時は既存targetを上書きせず、immutable generation内へ実在するversioned staging fileを書き、payload、baseline、closedな`system`/`catalog` target identity、run/contract/artifact provenance、manual handoff、staging digest、source manifest digest、committed revisionを保存します。storageはsource introduction generationをchainから確定し、初出時だけ`committed_revision == manifest.revision`、staging refの同generation内包含、source artifactと同generation state artifactの一致、run/contract/artifact provenanceを要求します。source introductionは直前のapproved Task Contract、artifact revision/digest、initial verification/review report、implementation approval、未実行final reportをexact carryします。後続generationはsource manifestとこのsource basisを消失までimmutableに保持します。`source_sync`はreportを変更せず、`final_verification`はfinal verification reportだけ、`final_review`はfinal review reportだけを変更でき、`completed`は4 reportを変更できません。artifactを変更するverified fix generationはcurrent source、completion、approval、initial/final reportを新artifact revisionへ結合したcanonical inactive形へ同時resetし、過去generationのsource manifestとstaging fileはappend-only履歴として保持します。state層の単一pure canonical inactive source projectionをruntime reset、completion projection、save、load、historical replayで共用し、accepted/stagedがfalseの全generationをそのgenerationのrun/contract/artifactへexact再投影します。inactive時のstatus、null source/staging/manifest、no-overwrite、connection `unverified`/falseを含む全fieldが一致しなければ`completion_source_binding_invalid`です。accepted shadow sourceも単一pure Policy projectionをruntime producer、Run State semantic validation、storage historical replayで共用し、`status == execution_policy.source_sync.external_disconnected_status`かつ`staging_artifact.manual_handoff == execution_policy.source_sync.manual_activation`を必須とします。connection `unverified`/falseとno-overwriteも維持し、これらを改変してstaging/source/manifest/anchorのdigestを再構築しても`completion_source_binding_invalid`で拒否します。再approval後はfresh source introductionだけを受理し、旧source requestやcompletion evidenceの再利用を拒否します。消失後の再出現は新しいintroductionとして同じ検証を行います。initial reportとapprovalを同時に再hashした場合を含め、source chainのcanonical rebindは`completion_source_binding_invalid`です。final reportやcompletionをstaging前または過去revisionへ再bindした場合も同じcodeで停止します。shadow modeではcallerの接続flag/hashを一切信頼せず、connection statusは常に`unverified`、statusとmanual handoffはpinned Execution Policyの値です。これは手動適用候補を表すだけで、外部情報源の更新やactivation成功を意味しません。shadow coreはsourceを更新しません。

## CLIと終了code

[CLI](../../../scripts/team_harness.py) は標準ライブラリだけを使い、`validate`、`build-contract`、`team-select`、`init-run`、`resume-run`、`transition`、`record`、`authorize-write`、`source-sync`、`improvement`、`completion-gate`、`catalog-projection`、`legacy-adapt`を提供します。

blocked、failed、rejected、unauthorized、source未受理、completion未完はJSONを出力したうえでnon-zero終了します。未知runのread-only照会はrun rootやlockを作らず、構造化されたnot-found JSONを返します。`validate`は正本config、example、閉じたschemaを実validatorへ通します。`catalog-projection`は同じRegistryから決定的なstdoutを生成するだけで、UIやsourceを編集しません。

project checkerはfull suite timeoutを単一の静的権威値300秒として持ち、全206 testの実行件数と成功を確認します。個別test側へtimeout定数を複製しません。

## Recovery、rollback、Legacy

通常回復はrun ID、任意のexpected revision/contract digestを伴うresumeです。integrity mismatch、contract mismatch、stale revision、同一原因retry上限、権限不足、人間判断が必要な衝突では停止します。

rollbackは親writerがこの変更の明示差分だけを戻し、team harness設定を停止します。run、staging artifact、外部sourceを自動削除・上書きしません。branch、commit、runtime権限、外部sourceをcoreから変更しません。modeをshadowから切り替えることは別の承認済み変更です。

legacy adapterのenabled switchとentrypointのownerはExecution Policyです。legacy single-agent envelopeは29 field Task Contractへ一方向変換され、その後は同じRegistry、team形成、review/verify、persistence、completion gateを通ります。canonicalとlegacyの同時指定、unknown agent、disabled adapterはfail closedで、別実行経路を残しません。証拠のないlegacy `review_failed` eventはcoreへ入れず、将来変換する場合もadapter境界でactor、exact quality grant、checks、cause、report digestを持つ完全なcanonical review reportへ変換しなければなりません。
