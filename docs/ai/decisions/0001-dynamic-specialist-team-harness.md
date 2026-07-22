# Dynamic Specialist Team Harness Core

- Status: accepted
- Date: 2026-07-22
- Decision type: 設計判断記録
- Related specification: [Dynamic Specialist Team Execution Specification](../rules/team-execution-spec.md)

## 背景

single-agent経路だけでは、作業ごとの専門観点、run-scoped write権限、独立review/verify、証拠の鮮度、interrupt後の整合性、source activation境界を同じ契約で追跡できません。一方、個人agent catalog、具体model、runtime availability、外部workflowを公開projectの必須依存にすると、project中立性と再現性を失います。

## 決定

`.codex/team-harness/`のversioned JSONをmachine-readable正本とし、標準ライブラリだけの`team_harness` packageとCLIをshadow modeで採用します。

- closed positive schemaで全runtime envelope/request、29-field Task Contract、Registry、Execution Policy、Run State、12 artifact、commit manifest、commit anchorを検証する。loadはschema-firstで、schema failure後にsemantic検証を呼ばず、semantic例外はgeneric integrity codeへ変換する
- Registryのdomain/capability/path/risk上限から、全範囲を単独で覆う1 primary writer、必要最小のread-only Specialist、distinct verifier、distinct reviewerを選び、implementation / verification / reviewのstrict 3 waveへ配置する。top-level `role_assignments`がある場合はexact writer/reviewer/verifierを選び、fixed Task Contractとの同時指定も完全一致を要求する。欠落・複数・不適合・衝突・scope不足・fixed不一致をblockedにしてfallbackせず、writer coverage集約と複数writer grantを拒否する
- Execution Policyをstate、transition、terminal、9 reserved state、write state、evidence gate、source staging、legacy switchの唯一ownerにし、terminalを`completed`/`failed`/`blocked`/`cancelled`、write stateを`implementing`/`retrying`、final-review retry上限を`needs_human_approval`へcanonical固定する。state graphをPython/checker/schemaへ複製せず、schemaはclosed構造と参照型だけを検査し、semantic validatorはloaded Policy自身の関係とconfig/schema/exampleで共有するartifact version/digest pinを照合する。Registry/Policy constructorは欠落値をbackfillせず、各runのimmutable policy snapshotを他runへ漏らさない
- write authorizationとartifact eventをrun/revision/actor/exact ownership、prior committed generation、caller提示grantとRun Stateへ先に保存したorchestrator-issued write grantの完全一致へ結合し、path・symlink・role・grant不備をfail closedにする。未知runのauthorizeはlock前にread-only not-foundとする
- verification/reviewをactor、required checks、attempt、plan/artifact revision、artifact/diff digest、input/environment fingerprint、report digest、provenance、prior committed generationのpersisted quality grantへ結合する。同一batchで再発行された未commit grantは拒否する
- implementation approvalはcurrent initial reportsと未解決0からのみ導出し、direct approvalを拒否する
- approval/source/final/completedにblocked/failed/needs-human/cancelledを加えた全9 stateをreservedとし、generic transitionからの出入りを拒否する。reserved transitionを含む各generationはnew trace suffixの末尾にfinal stateと一致するentryをexactly 1件だけ導入し、そのgenerationで新規のtransition固有cause/report/Finding/receipt等だけを非循環projectionへ結合する。kindごとのpure typed exact projectionでinitial blockerの全problem、generation-new initial review、Finding conflict identity/position、quality report phase/kind/status/cause/failure/reason/rejectionを検証し、正当causeに無関係な同generation deltaを混ぜたtransitionも拒否する。failed/blocked quality branchはreserved中間checkpointを置かず、under-limit final-review failureをreport/history/counter/drift Finding/transitionとともに`final_verification`から`retrying`へ1 request・1 generation・1 saveでcommitする。`final_review`へ入るのはpassed branchだけとする。event batchは全件を事前検証し、Finding conflictを含むcandidateもsave前にstorage/replayと同じpure typed exact predicateで評価する。conflict原因と無関係なFinding等を同batchへ混ぜた場合は`event_batch_after_reserved`でatomicに破棄し、例外や永続変更を残さない。plan/artifact/ownership変更時はderived evidenceを無効化する
- retryをfailed report、normalized cause、explicit causal issue、persisted diff receipt、run/contract/plan provenance、Task Contractの全`receipt:<id>`条件へ結合し、verified causal receiptがすべてのIDを証明するまでattempt/revision変更を禁止する。generic transitionによる`retrying`へのentryとexitを拒否し、failed/blocked quality処理とverified fixの内部gateだけを許可する
- custom check、deliverable、completion predicateをpersisted artifact receiptへ結合し、自己申告による充足を拒否する
- artifact receiptはactive primary writer、caller提示とprior committed exact write grantの一致、write state、Task Contract exact path、Registry scope、active ownershipを要求し、raw immutable content/ref/digest/grant bindingをgenerationとcommit manifestへ保存する。receipt初出時はprior committed generation自体がpinned Policy上のwrite-enabled stateであり、同じprimary writer、ownership revision、lease epoch、grant producer/run/agent/issued revision/digest、receipt provenanceへ結合されていなければならない。artifact write grantとquality grantはdiscriminated schemaで分離し、check/deliverable/retry gateはverified receiptだけを信頼する
- public Findingは割当quality actor、canonical identity、`status: open`だけを受理してimmutable append-only receiptにする。verified fixはFindingを変更せず、元Finding digest、fix receipt/report/attempt/cause/provenanceへ結合したresolution receiptを個々のissueへ追記し、catalog statusを全Findingとresolution receiptの列から導出する。failure historyはreport digest/phase/attemptとhistorical generationのFinding exact集合へ結合し、一部だけのresolutionで残りのfailureを消さない。同じidentityのFindingがresolution後に再発した場合も新しいFinding digestを追記し、過去のFinding/resolutionを保持したままcatalogをopenへ戻し、新しいresolutionまでbounded retry上の未解決failureとして扱う。final review failureはopen drift Finding、failure history、normalized retry causeへ結合し、Policy上限でhuman/blockedへ停止する
- initial/final verification/reviewとcompletion gateを分け、全statusをtotalに処理する。retry上限でもfailed report/history/counter/rejectionをstop stateと同じgenerationへ保存し、final-verification blockedをterminal blockedへ送る。canonical checksをnormalized report、summary、metricsへ保持する。completionはrun/Task Contract/artifact/source/staging/4 report/導入generationのclosed canonical projectionとし、source変更後の古いcompletionやfinal evidenceを拒否する
- RunStoreをrun単位`flock`、revision CAS、immutable generation、pre-pointer file/directory fsync、atomic commit pointer、同じlocal trust boundary内のcommit anchor high-watermarkで保存し、全persisted fieldをrequiredとするnested closed Run State schemaもload時に検証する。rootだけまたはanchorだけの一方的巻戻し、途中破損、chain/artifact/state/receipt/source/completion不整合を拒否し、pre-pointer crash orphanを無視し、root交換後/anchor更新前のnext childだけを回復する。rootとanchorと参照先旧generationを同等以上の権限で整合して同時に巻き戻す協調攻撃は対象外であり、検知・防止・安全保証を主張しない。外部ledger、TPM/OS monotonic store、署名/MAC鍵、未承認secretsは導入しない。各commit manifestはparent generation/manifest digest/state/artifact refsを固定し、root pointerからparent manifest chainを逆走してcontiguous revision、immutable input、state trace/Finding/failure history/implementation receipt/rejection/blocker/conflictのappend-only exact prefixを検証する。rootとhistorical manifestはschema-firstで検証する。Run Stateから12 artifactをcanonical再生成し、特に`specialist-findings`とmetrics artifactのcontent/digest一致を必須にする
- Run StateへRegistry version/kind/digest、top-level `role_assignments`、raw値を持たないsanitized input problem projection、canonical start requestと各digestを保存し、そのstart authorityをrun IDへ結合する。Task Contract blockerがあるinputは元のraw invalid値を保存せず、全case共通のschema-valid・value-independent safe rejected Task ContractをRun State/start/artifactへ使い、元のcanonical problem codeだけをsanitized projectionへ保持する。valid Task Contractに対するenvelope/capability問題はそのcontractを維持する。private field名もpersonal path/session/secret/private markerとして分類し、生keyをprojection/artifact/generationへ残さない。private new canonical/legacy inputは元idempotency key、title、path、agentを保存せず、固定safe idと同じsafe rejected Task Contract fallbackへ収束してblockedにする。入力problemがないrunはteamが空でもcurrent Registryとpinned Policyで`select_team`/`plan_waves`を再実行し、入力problemでteam形成前にblockedとなったrunだけはexact unselected projectionを検証する。全member/assignment/reason/fallback/eligible writer/ownership/runtime profile/wave/thread count、write・quality grantのactor/role/phase/generationを再結合する。persisted quality reportはdigest、exact grant、actor、attempt、plan/artifact/staging/diff/input/environment/source revision/checks/provenanceを再検証する。runtimeとload replayは同じpure dedicated state gateを使い、各generationのprior stateとの差分からreserved entryをexactly 1件へ限定する。target-specific causalityはtransition reason/cause digest、report phase/kind/status/digest、Finding identity、receipt/failure/conflict digest、rejection/blocker codeへ結合し、`blocked`/`failed`/`needs_human_approval`をPolicy定義の同generation causeだけで正当化する。各kindはそのcauseに必要なexact causal subsetだけを許容し、同generationに正当なcauseと無関係なFinding/receipt/rejection/blocker/conflict/reportを混在させたreserved遷移も拒否する。過去・無関係・relocated・wrong-report・後続generationの証跡流用を拒否する。artifact receiptはraw content、prior grant、generationからcanonical raw receipt projectionを再構築し、正規化pathをhistorical exact grant、Task Contract allowed/include/exclude/forbidden、ownership、current Registry scopeへ再結合する。全generationのhistorical stagingはcontainment/existence/content/manifest/source/final-report bindingを検証する。metricsはteam/plan/history/source/completionからclosed projectionとして再計算する。state/trace/policy transition/revision、Finding/resolution receipt、artifact/source/metricsを含め、digestを再計算したcorruptionをstructured blocked integrity failureにする
- source syncをcurrent approval/evidenceから作る実在immutable generation fileのno-overwrite stagingに限定する。sourceが最初にacceptedとなるgenerationでexact committed revision、同generation内ref、closed target identity、source/artifact digest、run/contract/artifact provenanceへ結合し、approved Task Contract、artifact、initial reports、implementation approval、未実行final reportsをexact carryする。後続generationはsource manifestとsource basisを消失までimmutableに保ち、stateごとに許されたfinal reportだけを変更する。artifactを変更するverified fixではhistorical stagingを保持しながらcurrent source/completion/approval/initial・final reportを新artifact revisionに結合したcanonical inactiveへ同時resetし、新しいsource introductionと全quality gateを要求する。単一pure canonical inactive source projectionをruntime、save、load、全historical generationで共用し、inactive run/contract/artifact/status/null source・staging・manifest/no-overwrite/connection unverifiedをexact比較する。accepted shadow sourceも単一pure Policy projectionをproducer、semantic validation、historical replayで共用し、statusを`execution_policy.source_sync.external_disconnected_status`、manual handoffを`manual_activation`へexact bindingする。connection unverified/falseとno-overwriteも維持し、digest/manifest/anchor再構築後の改変も`completion_source_binding_invalid`で拒否する。simultaneous canonical rebind、過去revisionへ再bindしたfinal report/completion、旧source/completion証跡の再利用を拒否する。source消失後の再出現は新しいintroductionとして再検証し、shadow modeではcallerのconnection flag/hashを信頼せずactivationを手動境界に保つ
- implementation-logへselection reasonとverification/review failureを分離した非捏造metricsを保存し、改善提案をmetrics digestとartifact evidenceへ結合する
- terminal runをimmutableにし、cancelはactor `orchestrator`と非空reasonを持つclosed dedicated event/gateだけで受理し、`interrupt`は`blocked`のままにする。CLIはblocked/rejected/unauthorized/not accepted/incompleteをnon-zeroで返す
- legacy envelopeは同じTask Contractと共通coreへ一方向変換し、dual/unknown/disabledを拒否する。証拠のないpublic `review_failed` eventはschemaから除外し、coreへretry authorityを持ち込ませない

## 代替案

### 固定single-agent経路を維持する

単純ですが、専門観点、独立gate、finding conflict、run-scoped ownership、回復証拠を共通artifactとして扱えないため採用しません。

### projectへ個人catalogと具体modelを保存する

runtime依存が見えますが、環境固有情報を公開正本へ固定するため採用しません。Registryはsymbolic `model_profile`までとします。

### mutableな単一Run Stateを上書きする

実装量は少ない一方、process競合、lost update、partial write、tamper、crash直後の正本を判定できません。immutable generationとatomic commit pointerを採用します。

### approval eventまたはcompletion時に不足stateを補う

進行は容易ですが、誰のどのartifactに対する証拠か失われます。approvalはcurrent initial evidenceから導出し、final evidenceはstaging後に別途要求します。

### 外部sourceをcoreから直接更新する

自動化は進みますが、credential、接続状態、既存target、activation権限がshadow coreへ混入します。versioned stagingとmanual handoffだけを採用します。

### 複数writerを通常経路にする

速度向上の可能性はありますが、ownership競合とintegration driftが通常化します。全scopeを単独で覆うprimary writerがいないrunはblockedとし、disjoint ownershipや独立worktreeを提示されても複数writerへgrantを発行しません。

### 外部trust anchorで協調巻戻しも検知する

writerから独立したappend-only ledger、TPM/OS monotonic store、または署名/MAC鍵を使えばlocal rootとanchorの同時巻戻しを検知できる余地があります。しかし外部運用、鍵管理、permission、secretsの新しい契約が必要であり、今回のshadow coreには導入しません。現在の保証は非協調な一方的巻戻しと整合性破損の検知までです。

## 影響

良い影響:

- 25 acceptance scenarioと206 automated testで契約を固定できる
- stale evidence、direct approval、late terminal event、path escapeをfail closedにできる
- crash前generationの継続読取、CAS、tamper検出、concurrent Findingのlost update防止を共通化できる
- runtime profileをsymbolicに保ち、静的成功とruntime実測を分離できる

コストと制約:

- 各saveでRun State、12 artifact、commit manifestのimmutable generationを管理する
- quality report producerはcurrent evidence bindingsとprovenanceを供給する必要がある
- shadow mode中はsource stagingを外部更新成功と報告できず、手動activation工程が残る
- core authorizeはruntime sandboxやfilesystem enforcementを代替しない
- local root、anchor、旧generationを同等以上の権限で整合して同時に巻き戻す協調攻撃は検知対象外である

## Rollback

親writerがこのDecisionに属する明示差分だけを戻し、`.codex/config.toml`のteam harness利用を停止します。Git管理外の`.codex/runs/`、staging artifact、外部sourceを自動削除・上書きしません。外部へ手動適用された内容がある場合はsource ownerが別途rollbackを判断します。shadow modeのため、rollbackはLaravel / Reactや本番runtimeの成功状態を仮定しません。
