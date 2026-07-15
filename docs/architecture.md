# Architecture

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-15

## このドキュメントの目的

このドキュメントは、このプロジェクトで採用しているADR Pattern / レイヤード構成の責務境界を明文化するためのものです。

開発者が機能追加・修正を行う際に、Controller / Request / Action / Service / Repository / DTO / Responder / Componentなどの責務が混ざらないようにすることを目的とします。

機能固有の実行条件、API制約、DB条件、テスト固定内容は `docs/features/` に置き、この文書には共通原則だけを置きます。

## 設計思想の全体像

このプロジェクトの構成は、クラス数や文書数を増やすためのものではありません。

変更理由、責務、確認手段を分けることで、後から変更するときに「どこを見ればよいか」「どこを変えてはいけないか」「何で完了と判断するか」を追える状態にするためのものです。

この章は全体像を説明する入口です。レイヤーごとの詳細責務はこの文書の後続章、理解再起動の方針は `docs/context-management.md`、IDEA BOARD / MOCK / PROTOTYPE / PRODUCT の詳細は `docs/development-flow.md`、Sensorsの詳細は `docs/operations/sensors.md` を正本とします。

### 責務を分ける理由

```text
Controller / Request
        ↓
Action
        ↓
Service / Repository / DTO / Strategy / Factory
        ↓
Responder
        ↓
React / Inertia
```

Controller / Request はHTTP入口と入力形式、Action はユースケース手順、Service は業務判断、Repository はデータ取得・保存境界、DTO はレイヤー間のデータ、Strategy / Factory は処理差分や生成・選択、Responder は出力整形、React / Inertia は画面表示を担当します。

責務を分けると、変更理由と調査範囲を狭められます。入力形式が変わったのか、業務判断が変わったのか、データ取得条件が変わったのか、画面向けの整形が変わったのかを分けて確認できます。

ただし、すべての機能で全レイヤーを必ず作るわけではありません。単純な処理へ不要なService、Factory、Strategyを増やさず、変更理由を分ける必要がある場所だけ責務を置きます。

### 段階を分ける理由

```text
IDEA BOARD
    ↓
MOCK
    ↓
PROTOTYPE
    ↓
PRODUCT
```

IDEA BOARD は構想と未確定事項、MOCK は固定データによるUI確認、PROTOTYPE は画面間の接続や簡易的なデータの流れ、PRODUCT は仕様・責務・データ境界・テストを固定した本実装を扱います。

段階を分ける目的は、構想、UI確認、接続検証、本実装を混ぜないことです。MOCKで作った固定データやPROTOTYPEの仮処理を、そのままPRODUCTの完成仕様として扱いません。各段階で確認できたことを取り出し、次の段階で必要な契約や判断へ変換します。

### 確認ループを持つ理由

```text
実装 / docs変更
        ↓
test / build / PR / Sensors
        ↓
ズレ検出
        ↓
修正
        ↓
再確認
```

docs、test、build、PR、Sensorsは、設計を言いっぱなしにしないための確認手段です。

docsは目的と責務を残し、testは仕様を実行可能な形に固定し、PRは差分と判断理由を人間が確認する場所になります。Sensorsは、空白崩れ、docs更新漏れ、責務境界の崩れ、secrets混入、理解再起動に必要な情報の戻し漏れなどを、作業中またはPR前に検出するための台帳です。

すべてを機械判定するのではなく、機械的に見つけられるものと、人間やAIレビューで意味判断するものを分けます。

### AI駆動開発で人間が判断を持つ理由

```text
人間:
  仕様 / 責務境界 / 完成判定 / merge判断

AI:
  調査 / 実装補助 / 差分修正 / レビュー補助
```

AIは調査、実装補助、差分修正、レビュー補助に使います。ただし、仕様を決めること、責務境界を決めること、完成と判断すること、mergeすることは人間が持ちます。

この分担により、速く作ることと、後から保守できる形に留めることを分けて扱います。AIが生成した差分も、責務境界、確認結果、未実行理由、影響範囲を人間が確認できる形で残します。

### 理解再起動を重視する理由

理解再起動とは、後から人間やAIが読み直したときに、目的、責務、入力、出力、禁止事項、変更時の注意を回収できる状態を作ることです。

そのため、共通の責務境界は `docs/architecture.md`、文脈読込と戻し先の考え方は `docs/context-management.md`、機能固有の目的や制約は `docs/features/`、実行可能な仕様はtest、データ境界はDTOや型へ分けて残します。

## 用語

### ADR Pattern

このプロジェクトでいうADR Patternは、次を指します。

```text
Action - Domain - Responder
```

- Action: ユースケースの手順
- Domain: Service、Repository、DTO、Factory、Strategy、Event / Listenerなど
- Responder: HTTPレスポンスやInertia propsの出力整形

### Decision Record

重要な設計判断と、その理由・却下案・影響を残す記録です。

Architecture Decision RecordとADR Patternを混同しないため、設計判断の記録は `Decision Record` または `設計判断記録` と表記します。

### Command Action / Query Action / Artisan Command

- `Command Action`: 登録・更新・削除・同期開始など、状態を変更するユースケースのAction
- `Query Action`: 一覧・詳細・検索・ランキングなど、参照するユースケースのAction
- `Artisan Command`: Laravelのコンソール実行入口

Command Action / Query ActionはActionの分類です。Artisan CommandはJobをdispatchするかActionを呼ぶ入口であり、業務ロジック本体を持ちません。

## 基本方針

- 人間が仕様・責務・設計境界・レビュー観点を決める
- 支援ツールは実装補助・調査・差分修正・レビュー補助として使う
- レイヤーはクラス数を増やすためではなく、変更理由と責務を分けるために使う
- 単純処理へ不要なService、Factory、Strategyを増やさない
- 機能固有仕様は共通docsへ混ぜず `docs/features/` に分離する

## 理解再起動性

理解再起動性とは、一定期間後または別の開発者が途中参加した場合でも、コード、型、コメント、テスト、docsを読めば、目的、責務、入力、出力、禁止事項、変更時の注意点を回収できる状態です。

短さだけを優先して判断理由を消さず、後から変更するときに必要な意図と制約を残します。ただし、コードを読めば分かる処理の逐語説明や、実装と矛盾した古いコメントは残しません。

このプロジェクトでは、理解再起動性を次で支えます。

- レイヤーごとの責務境界をこの文書で固定する
- 機能固有の目的、入力、出力、禁止事項は `docs/features/` に置く
- 主要な型、DTO、propsでデータ境界を明示する
- PHPDoc、JSDoc、コメントには意図、制約、変更時の注意を書く
- テストで仕様と責務境界を実行可能な形に固定する
- 追加、変更、削除時にdocs、コメント、型、テストの更新要否を確認する

## 採用している責務

- Controller
- Request
- Action
- Service
- Repository
- DTO / ListDTO
- Responder
- Factory
- Strategy
- Event / Listener
- Job
- Artisan Command
- Scheduler
- Component

すべての機能で全責務を必ず作るわけではありません。必要な責務だけを使います。

## ディレクトリ作成前の責務設計

ADR Pattern / レイヤードアーキテクチャでは、ディレクトリやファイルを先に作るのではなく、責務の置き場を先に決めます。

責務配置が未確定のまま Controller / Service / Repository / DTO / Responder を作成すると、名前だけで実装が進み、責務混在を起こしやすくなります。

そのため PRODUCT実装では、以下を先に固定します。

- Controller: HTTP入口
- Request: 入力形式の検証
- Action: ユースケース手順
- Service: 業務判断・ドメインルール
- Repository: DB操作・外部データ取得境界
- DTO / ListDTO: レイヤー間のデータキャリア
- Responder: 画面・API向けの出力整形
- Component: 表示責務
- Test: 固定する仕様

レイヤー名に合わせて機械的にファイルを作らず、必要な責務だけを作ります。

DTO / ListDTO はデータキャリアであり、業務判断、DBアクセス、表示判断を持たせません。

Service / Repository / Responder / Component の責務を混ぜません。

責務配置を固定できない場合は、推測で実装せず、必要な確認事項を報告して停止します。

## Controller の責務

ControllerはHTTPの入口を担当します。

- Requestを受け取る
- DTOを生成する、または生成処理へ渡す
- Actionを呼ぶ
- Responderの結果を返す

Controllerへ置かないもの:

- 業務判断
- DB直接操作
- 外部API通信
- 複雑なレスポンス整形

## Request の責務

Requestは入力形式のバリデーションを担当します。

- 必須
- 型
- 文字数
- 形式
- 許可値

業務上の可否判断はServiceへ置きます。

## Action の責務

Actionは1ユースケースの手順を扱います。

Requestから作られたDTOを受け取り、ServiceやRepositoryを呼び出して処理順序を制御します。状態変更はCommand Action、参照処理はQuery Actionとして必要に応じて分離します。

Actionへ置いてよいもの:

- ユースケース開始から完了までの手順
- Service / Repositoryの呼び出し
- ResultDTOへの集約
- Transaction境界の調整

Actionへ置かないもの:

- 大きな業務判断
- Eloquentクエリ
- HTTPレスポンス整形

## Service の責務

Serviceは業務判断・ドメインルールを扱います。

- 条件分岐
- 判定
- 計算
- 状態遷移の可否
- 同期・保存・表示に関する業務上の意味づけ

ServiceへDB直接操作を置かず、データソースとのやり取りはRepositoryを経由します。

ServiceへHTTP都合や画面表示都合を混ぜません。

## Repository の責務

Repositoryは、DBまたは外部データソースとの境界を扱います。

### DB Repository

- Eloquent / Query Builderによる取得
- 保存
- 更新
- 削除
- 並び順・絞り込み条件

### External API Repository

- 外部API通信
- API制約に合わせたrequest分割
- 外部レスポンスの取得
- 外部レスポンスからDTOへの変換

Repositoryへ置かないもの:

- 業務判断
- 保存可否判断
- 画面表示判断
- HTTPレスポンス整形
- ユースケース全体の手順

Repositoryは「どのデータソースから、どの条件で取得・保存するか」を扱い、「そのデータを業務上どう判断するか」はServiceへ置きます。

## DTO / ListDTO の責務

DTOはレイヤー間のデータ境界として扱います。

- 単体DTOは1件分のデータキャリア
- ListDTOは複数DTOを束ねるデータキャリア
- 必要に応じて `toArray()` を持ってよい

`toArray()` は配列変換までに限定します。

DTO / ListDTOへ置かないもの:

- 業務判断
- DB操作
- 外部API通信
- HTTPレスポンス生成
- JSONレスポンス整形
- 画面表示判断

## Responder の責務

Responderは出力整形を扱います。

- Inertia props
- JSON response
- CSV / Excel / PDF
- StreamDownload
- 保存結果の表示用整形

ActionやServiceから受け取ったDTO / ListDTOを、利用先に必要な形へ変換します。

業務判断はResponderへ置きません。

## Factory の責務

Factoryは生成・選択を扱います。

- DTO生成
- Strategy選択
- Responder選択
- 実装クラスの選択

Factoryへ業務判断本体を置きすぎず、判断の意味はService、処理差分はStrategyへ分けます。

## Strategy の責務

Strategyは、同じ目的に対するアルゴリズムや処理差分を扱います。

Strategyを検討する例:

- 条件ごとに同じ目的の処理が変わる
- if / switchが増え、各処理の独立性が高い
- 処理差分を個別にテストしたい

条件分岐が小さい場合は、無理にStrategy化しません。

## Event / Listener の責務

Eventは発生した事実を表します。

Listenerは、その事実に対する副作用を扱います。

例:

- 通知
- ログ
- 外部連携
- 後処理

原則:

- 1事実1Event
- Listener同士の強い順序依存を避ける
- ユースケース本体をListenerへ隠さない

## Job の責務

Jobは非同期実行またはQueue実行の単位を担当します。

JobはActionを呼び出す入口とし、業務ロジック本体を持たせません。

Jobへ置いてよいもの:

- timeout / tries
- Queue設定
- Action呼び出し
- 実行境界のログ

## Artisan Command の責務

Artisan Commandはコンソール実行の入口を担当します。

Artisan Commandへ置いてよいもの:

- 引数・optionの受け取り
- Jobのdispatch
- Action呼び出し
- exit codeと実行結果メッセージ

Artisan Commandへ業務判断、DB直接操作、同期本体を置きません。

## Component の責務

Componentは画面表示、ユーザー操作、UI状態を担当します。

Componentへ置いてよいもの:

- propsの表示
- タブ・モーダル・選択状態
- クリック・タップ・スワイプ
- 画面内で完結する表示順や開閉

Componentへ置かないもの:

- DB操作
- 外部APIの業務判断
- 権限判断
- 状態遷移の可否判断
- Laravel側で確定すべき業務ルール

画面表示に必要な形は、可能な限りResponderで整えてから渡します。

## Scheduler の責務

Schedulerは定期実行の入口を担当します。

Schedulerへ置いてよいもの:

- 実行時刻や実行条件の登録
- 対象Artisan CommandまたはJobの呼び出し
- `withoutOverlapping()` などの実行境界
- env / config gate

Schedulerへ業務判断、DB直接操作、同期本体を置きません。実行される処理の本体はArtisan Command、Job、Action、Serviceへ分離します。

## Command Action / Query Action の分離

状態を変更する処理はCommand Actionとして扱います。

例:

- 登録
- 更新
- 削除
- 同期開始

データを取得して表示する処理はQuery Actionとして扱います。

例:

- 一覧
- 詳細
- 検索
- ランキング

Command Action / Query Actionの分離は、読み書きの責務を明確にするために使います。

このプロジェクト全体を完全なCQRSとして扱うとは限りません。CQRS採用を断定せず、必要なユースケースでCommand Action / Query Actionを分離します。

## 依存方向

入口ごとに処理フローを分けます。HTTP、Artisan Command、QueueのすべてがRequest、Responder、Pageを通るわけではありません。

### HTTP / Inertia / JSON

```text
Route
    ↓
Controller
    ↓
Request / Input DTO
    ↓
Action
    ↓
Service / Repository / Strategy
    ↓
Output DTO / ListDTO
    ↓
Responder
    ↓
Page / Feature Component
    ↓
Common Component
```

### Artisan Command

```text
Scheduler / Manual CLI
    ↓
Artisan Command
    ↓
Jobをdispatch または Input DTOを生成してActionを呼ぶ
    ↓
Action
    ↓
Service / Repository / Strategy
    ↓
ResultDTO / exit code / 実行結果メッセージ
```

### Queue

```text
Scheduler / Artisan Command / アプリケーション入口
    ↓
Jobをdispatch
    ↓
Queue worker
    ↓
Job
    ↓
Action
    ↓
Service / Repository / Strategy
    ↓
ResultDTO
```

RequestはHTTP入力の形式検証に使います。Artisan CommandやJobへ機械的にRequestを通しません。

ResponderはHTTP、Inertia、JSON、CSV、PDF、Download等の出力整形が必要な場合に使います。コンソールやQueue処理へPageやHTTP Responderを機械的に追加しません。

呼び出し方向を逆転させ、Common ComponentやDTOからRepositoryを呼ぶような構成にしません。

## Dependency Injection / Service Container

DIはレイヤー間の責務を曖昧にするためではなく、依存方向と差し替え境界を明示するために使います。

### 基本原則

- 継続的に利用する協調オブジェクトは、原則としてconstructor injectionで受け取る
- Controller、Action、Service、Repository実装、Responder、Strategy、Factoryなどの依存関係をconstructorで明示する
- 依存解決はLaravel Service Containerと既存の適切なServiceProviderで行う
- ActionやServiceなどの内部で `app()`、`resolve()`、Container直接参照により依存を探索しない
- 協調するService、Repository、外部Clientなどを処理内部で直接 `new` しない
- hidden dependency、循環依存、Service Locator化を許可しない

### 値の生成

Service Containerから解決する協調オブジェクトと、処理中に生成するデータ・値を区別します。DTO、ListDTO、Input DTO、ResultDTO、Value Object、Eventとして渡す事実データ、Exception、副作用を持たない単純な値オブジェクトは `new` で生成してよく、Container管理のServiceとして扱いません。

DTO / ListDTO / Request / EventへService、Repository、Containerなどを注入して責務を移動しません。

### interfaceを使う条件

interfaceまたは契約境界を設けるのは、主に複数実装の切替、外部API・Storage・通知・永続化などのInfrastructure境界、環境・設定による実装切替、Framework・SDK・外部Clientの具象からの分離、設計上必要なFake、または依存方向を内側へ保つ必要がある場合です。

実装が1つで差し替え境界がなく、Laravelの具象クラスautowiringで責務とテスト可能性を維持できる場合は、不要なinterfaceを追加しません。「Mockしやすい」だけを理由に全クラスをinterface化しません。

interfaceの配置は、契約を必要とする側の責務に従います。存在しないディレクトリ構成や命名規則を推測で追加しません。

### Laravel入口ごとの注入方法

- Controller、Action、Serviceなどの通常依存はconstructor injectionを基本とする
- JobのconstructorにはQueueへ安全にシリアライズできるpayloadを置き、ServiceやRepositoryなどの実行依存は必要に応じて `handle()` のmethod injectionで受け取る
- Listenerの協調依存はconstructor injectionで受け、`handle()` にはDispatcherから渡されるEventを受け取る
- Jobの `handle()`、Artisan Commandの `handle()`、Controller methodなど、Framework / Containerがmethod parameterを解決する入口の単一処理だけに必要な依存はmethod injectionを使用できる
- method injectionを依存関係を隠すために乱用しない
- Eventは発生した事実を表すデータに限定し、Service、Repository、Containerを保持しない

### bindingとFactory

interfaceと実装のbindingは既存の適切なServiceProviderへ置き、binding、実装選択、環境分岐、生成条件をActionやServiceへ置きません。Laravelが自動解決できる具象クラスまで機械的にbindingせず、通常binding、singleton、scopedを目的なく混同しません。singletonは状態、lifecycle、副作用、request間共有の安全性を確認してから使います。環境別bindingでは、環境差分とテスト方法を確認可能にします。

既存Factoryが実装クラスを選択する場合、その役割は注入済み候補からの実行時選択です。Container探索や依存グラフ構築は担いません。

## 機能固有仕様の配置

次は共通docsではなく `docs/features/` に置きます。

- Scheduler実行時刻
- API quota
- 特定テーブルの条件
- 特定enum値
- Seeder件数
- 特定画面の表示順
- 機能固有のJob / Artisan Command名
- 機能固有のテスト固定内容

共通docsからは、該当するfeature文書へ参照を張ります。

## Decision Record を残す条件

次のような重要判断では、必要に応じて設計判断記録を残します。

- 責務境界を変更する
- 永続化方式を変更する
- 外部API境界を変更する
- 複数案から将来影響の大きい案を選ぶ
- 後から理由を説明できないと再変更される可能性が高い

文言修正や小さな実装差分ごとにDecision Recordを作りません。

## 作業時の責務境界

支援ツールへ作業を依頼する場合も、次を守ります。

- 仕様にない機能を追加しない
- 変更対象を明確にする
- 最小差分で修正する
- 責務境界を崩さない
- 必要なテストを追加・更新する
- 差分とテスト結果を人間が確認する

仕様、責務境界、完成判定、merge、本番反映は人間が判断します。

## 変更時の確認

- Controllerへ業務判断が入っていないか
- Requestへ業務判断が入っていないか
- Actionへ大きな業務ロジックが入っていないか
- ServiceへDB直接操作が入っていないか
- Repositoryへ業務判断・表示判断が入っていないか
- DTOへ処理・レスポンス生成が入っていないか
- Responderへ業務判断が入っていないか
- Artisan Commandへ業務ロジックが入っていないか
- Schedulerへ業務判断や同期本体が入っていないか
- ComponentへLaravel側の業務ルールが入っていないか
- 主要なPHPDoc、JSDoc、コメント、型が意図・制約・変更時の注意を回収できる状態か
- 不要なFactory / Strategy / Eventを増やしていないか
- 協調依存がconstructorまたはLaravel入口のmethod injectionで明示され、Service Locator化していないか
- DTO / ListDTO / Request / EventへServiceやRepositoryを注入していないか
- interface、binding、singletonを差し替え境界やlifecycleの確認なしに増やしていないか
- 機能固有仕様を共通docsへ混ぜていないか
- 必要なテストが追加・更新されているか
