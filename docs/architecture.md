# Architecture

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、このプロジェクトで採用しているADR Pattern / レイヤード構成の責務境界を明文化するためのものです。

AIエージェントや人間が機能追加・修正を行う際に、Controller / Request / Action / Service / Repository / DTO / Responder / Componentなどの責務が混ざらないようにすることを目的とします。

機能固有の実行条件、API制約、DB条件、テスト固定内容は `docs/features/` に置き、この文書には共通原則だけを置きます。

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
- AIは実装補助・調査・差分修正・レビュー補助として使う
- レイヤーはクラス数を増やすためではなく、変更理由と責務を分けるために使う
- 単純処理へ不要なService、Factory、Strategyを増やさない
- 機能固有仕様は共通docsへ混ぜず `docs/features/` に分離する

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
- Component

すべての機能で全責務を必ず作るわけではありません。必要な責務だけを使います。

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

## AI駆動開発における責務境界

AIへ作業を依頼する場合も、次を守ります。

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
- ComponentへLaravel側の業務ルールが入っていないか
- 不要なFactory / Strategy / Eventを増やしていないか
- 機能固有仕様を共通docsへ混ぜていないか
- 必要なテストが追加・更新されているか
