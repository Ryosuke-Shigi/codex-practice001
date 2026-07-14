# Testing

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-14

## このドキュメントの目的

このドキュメントは、このプロジェクトにおける共通テスト方針を明文化するためのものです。

テストは、既存仕様の破壊を検知し、仕様と責務境界を固定する実行可能な仕様として扱います。後から別の開発者が参加しても、成功しているテストから入力、出力、境界、失敗条件を回収できる状態を目指します。

機能固有のテスト固定内容は `docs/features/` に置き、この文書には複数機能へ共通する基準だけを置きます。

実装作法、型、命名、format / typecheck の確認は `docs/coding-standards.md` に従います。Docker経由の実行場所と service は `docs/operations/command-registry.md` に従います。

## 基本方針

- テストはコードレビューの代替ではない
- テスト数ではなく、守っている仕様・責務境界・失敗条件を評価する
- 重要な境界は実装前または実装と同時に固定する
- 細かい仕様は、挙動が明確になった後に固定テストを追加してよい
- テストを通すために責務境界を崩さない
- 共通テスト方針と機能固有仕様を分ける

テストで主に確認するのは「期待する仕様が壊れていないか」です。

「責務分離が崩れていないか」「不要な抽象化が増えていないか」「実装作法・型・コメントが妥当か」は、差分レビューで確認します。

## テストにも責務境界を適用する

テストコードも、何のレイヤー・何の仕様を確認しているか分かる単位へ分けます。

基本分類:

- Unit: DTO / ListDTO / Service / Factory / Strategy / Utility
- Repository: DB条件、保存条件、外部API通信境界
- Feature: HTTP、Action、Job、Artisan Command、Scheduler、Inertia props、DB反映
- React: 表示・操作・UI状態・純粋Utility

1つのテストファイルへ、Serviceの業務判断、RepositoryのDB条件、Responderの出力整形を無理に混ぜません。

責務が崩れている場合は、テスト側で吸収せず実装側を見直します。

## テストを追加する理由

- `php artisan test` で既存仕様の破壊を検知できる
- 毎回コード全体を読み直す必要を減らせる
- 失敗したテストから修正範囲を絞れる
- 「このテストを通す範囲で修正」と指示できる
- 仕様説明・影響調査・手戻りのトークンを減らせる
- DTO、Repository、Service、Action、Responderの境界を固定できる
- PRレビューで見るべき場所を絞れる

## テストで守る対象

- Request / FormRequestの入力形式とバリデーション
- DTO / ListDTOのデータ境界
- Repositoryの取得・保存・通信条件
- Serviceの業務判断
- Actionのユースケース手順
- Job / Artisan Command / Schedulerの実行境界
- Event / Listenerの副作用境界
- Responderの出力形式
- Inertia props
- React Utilityの純粋処理
- 複雑なComponentの主操作
- loading / error / empty / selected の状態
- 追加・削除時に壊れやすい導線
- DB状態の変化
- 失敗・例外・空データ・重複・境界値

## 優先順位

基本の優先順位:

1. Serviceの業務判断
2. Request / FormRequestの入力バリデーション
3. DTO / ListDTOのデータ境界
4. RepositoryのDB・外部データソース境界
5. Actionのユースケース手順
6. Job / Artisan Command / Scheduler
7. Responder / Inertia props
8. React Utility
9. 複雑なReact Componentと画面状態

ただし、変更内容に直接関係する境界を最優先します。

## Request / Validation テスト

確認する観点:

- 必須項目
- 型
- 文字数
- 形式
- 許可値
- 境界値
- 不正入力時のエラー
- フロントを通らない直接リクエスト

バリデーションの安全境界は `docs/security.md` に従い、フロントエンドバリデーションだけで安全とは判断しません。

## DTO / ListDTO テスト

確認する観点:

- 値を正しく保持する
- nullable / enum / 日時 / 数値の境界
- `toArray()` の出力形式
- ListDTOが複数DTOを保持する
- ListDTOの `toArray()` が各DTOを配列化する
- 業務判断・DB操作・レスポンス生成を持たない

DTOの項目を変更した場合は、受け取り側のResponder・TypeScript型・テストも確認します。

## Service テスト

Serviceは業務判断・ドメインルールを扱うため、優先してテストします。

確認する観点:

- 条件分岐
- 判定結果
- 計算
- 状態遷移の可否
- 空データ・境界値
- 異常系
- Repositoryへ渡す条件
- DTOへの変換方針

DBやHTTP通信は必要に応じてFake / Mockへ置き換え、業務判断だけを確認します。

## Repository テスト

RepositoryはDBまたは外部データソースとの境界を扱います。

### DB Repository

確認する観点:

- 取得条件
- 保存・更新・削除
- 並び順
- filter / search
- soft delete
- unique / duplicate
- transactionが必要な境界
- 業務判断が混ざっていない

### External API Repository

確認する観点:

- URL、query、header、method
- API制約に合わせた分割
- timeout / failure
- 空入力時に通信しない
- 重複・不正な入力を送らない
- 外部レスポンスをDTOへ変換する
- 保存可否や業務判断を持たない

外部APIは `Http::fake()` 等を使い、実通信へ依存しないテストを基本とします。

## Action テスト

Actionはユースケースの手順を扱います。Command Action / Query Actionのどちらも、対象ユースケースに必要な境界を確認します。

確認する観点:

- Input DTOから処理が開始される
- Service / Repositoryの呼び出し
- 呼び出し順序
- Transaction境界
- 正常系のResultDTO
- 異常系・部分失敗
- 重複実行時の挙動
- Actionへ業務判断が集まりすぎていない

必要に応じてFeatureテストまたは単体テストを選びます。

## Job / Artisan Command / Scheduler テスト

### Job

- 期待するActionを呼ぶ
- timeout / tries
- Queue設定
- 失敗時の記録
- 再実行時の安全性
- Jobへ業務ロジックを持たせない

### Artisan Command

- 引数・option
- Job dispatchまたはAction呼び出し
- exit code
- 表示メッセージ
- Artisan Commandへ業務ロジックを持たせない

### Scheduler

- 実行時刻
- env / config gate
- `withoutOverlapping()`
- 対象Artisan Command / Job
- 無効時に実行しない

具体的な時刻・Artisan Command名・Job名は該当する `docs/features/` に記載します。

## Event / Listener テスト

Event / Listenerを使う場合は、次を確認します。

- Eventが1つの事実を表している
- 必要なタイミングでdispatchされる
- Listenerが通知・ログ・外部連携などの副作用に限定される
- Listenerの順序依存が強くない
- 失敗時の扱いが明確

## Responder / Inertia props テスト

確認する観点:

- propsのキー
- DTO / ListDTOの変換結果
- nullable / empty状態
- pagination
- URL・表示補助情報
- Component側で業務判断を再構築しなくてよい形
- DB Modelや不要な内部カラムを渡していない
- Responderへ業務判断が入っていない

## React Utility テスト

DOMへ依存しない純粋処理はVitestで確認します。

例:

- URL生成
- query組み立て
- 表示用変換
- 配列切り出し
- 日付・数値の表示補助
- スワイプ対象除外判定

純粋処理をComponentから分離できる場合に優先します。

## React Component テスト

Componentテストは、次の場合に追加を検討します。

- 表示切替が複雑
- ボタン・フィルタ・タブ操作が多い
- loading / error / empty / selectedを固定したい
- props変更による表示崩れを検知したい
- モバイル専用の表示条件がある
- 自動送り・スワイプ・Modalなどの操作仕様が重要

CSSの細かな見た目だけを固定するために、壊れやすいテストを大量に追加しません。

## Feature テスト

HTTPまたは画面/API経由のユースケースを確認します。

- status code
- validation error
- redirect
- Inertia component / props
- JSON shape
- DB状態
- 認証・所有確認
- soft delete
- success / failure / partial failure

FeatureテストへServiceの細かい全分岐を重複して書きません。

## 開発中テストと後追い固定テスト

### 開発中テスト

壊れると影響が大きい境界を先に固定します。

- Service
- DTO
- Repository条件
- Action手順
- Request validation
- Job実行境界

### 後追い固定テスト

- 並び順
- pagination props
- return URL
- 表示補助データ
- empty / selected状態
- モバイル固有操作

すべてを最初から完全なTDDにする必要はありませんが、すべてを後回しにもしません。

## Red / Green / Refactor

コードまたは実行可能な仕様を変更する場合は、原則として次の順序で進めます。

1. ユーザー指示、正本docs、現在コード、既存テストから仕様と責務を固定する
2. 不具合は現在の失敗を再現し、仕様変更は期待動作をテストへ先に記述する
3. 追加・変更したテストが意図した理由で失敗するRedを確認する
4. 最小実装でGreenにする
5. 成功テストと責務境界を壊さない範囲でRefactorする
6. 対象テスト、関連する回帰テスト、登録済み確認コマンドを実行する
7. UI変更では、利用条件が成立する場合に同じURL、viewport、操作で実画面を確認する
8. 実装担当から独立したreviewで、仕様、責務、過剰実装、テスト不足を確認する

禁止:

- 完成実装を先に作り、最後に通るテストだけを追加してTDD完了とする
- Redを確認せずTDD完了とする
- テスト削除や期待値緩和だけで失敗を消す
- 現在仕様を確認せず、テストを新しい挙動へ書き換える
- テスト数だけを品質指標にする

テストを先に作れない場合は、理由を明示します。

- 表示上の微調整で自動テストによる固定が不適切
- 外部環境が必要で再現可能な自動テストを作れない
- 既存ハーネスに不足がある
- 人間判断が必要な視覚要件

この場合も、代替となるbrowser手順、Sensor、型、契約、review方法を明示し、未検証を成功扱いしません。

## PRODUCT化時のTDD順序

PRODUCT化では、実装を先に作らず、PROTOTYPEで確認済みの振る舞いをPRODUCTで守る仕様として先にTestへ記述します。

```text
PROTOTYPEの振る舞い確認
    ↓
PRODUCTで守るべき仕様をTestへ記述
    ↓
意図した理由でRedになることを確認
    ↓
Action / Service / Responder / Componentを実装
    ↓
最小実装でGreenにする
    ↓
責務を壊さずRefactorする
    ↓
UI契約が壊れていないか確認
```

先に固定する観点:

- 選択したデータだけが対象になること
- 本番APIを追加呼び出ししないこと
- 保存済みデータを使うこと
- Serviceの業務判断
- Repositoryの取得条件
- Responderのprops構造
- UIで必要な状態
- loading / empty / error / selected などの状態
- 画面遷移や導線
- 壊してはいけない表示仕様

## Fixture / Fake / Mock

テスト本体へ長いXML・JSON・巨大payload・複雑な匿名クラスを書きすぎません。

次の場合は分離を検討します。

- テスト準備が本文の大部分を占める
- 同じ外部レスポンスを複数回使う
- 失敗再現用の匿名クラスが長い
- 外部仕様変更時の修正箇所が散らばる

配置例:

```text
tests/Fixtures/
tests/Fakes/
```

小さく1回だけ使うデータまで機械的に分離しません。

## テストコメント

コメントは手順の逐語説明ではなく、何の仕様を守るテストか説明するために使います。

コメントを検討する対象:

- 境界値
- 異常系
- 部分失敗
- 外部API失敗
- 将来変更されやすい仕様
- 期待値の理由がコードだけでは分かりにくい

テスト名で意図が十分に伝わる場合は、不要なコメントを追加しません。

古い仕様を説明するコメントが残っていないか、実装変更時に確認します。

## テスト追加・更新を検討する変更

- Serviceの判断変更
- DTO / ListDTOの構造変更
- Repository条件・外部API通信変更
- Action手順変更
- Job / Artisan Command / Scheduler変更
- Event / Listener変更
- Responder / Inertia props変更
- Request validation変更
- DB保存・更新・削除条件変更
- React Utility変更
- 重要なUI操作・表示条件変更

## テスト追加が不要な場合

次はテスト追加が不要な場合があります。

- docsのみ
- READMEのみ
- コメントのみ
- 文言のみ
- propsや表示条件へ影響しない軽微なCSS
- 既存テストで十分に固定されている変更

不要な場合も理由をPRへ記載します。

## 実行順

変更時は、対象範囲から全体へ広げます。

```text
対象テスト
    ↓
関連Unit / Feature
    ↓
Laravel全体
    ↓
PHP format check
    ↓
TypeScript / TSX変更時のtypecheck
    ↓
Vitest
    ↓
Frontend build
```

## 基本コマンド

実行場所と Docker service は `docs/operations/command-registry.md` を正本とします。

Laravel:

```bash
cd /var/www/api-discovery-hub
docker compose run --rm composer format-check
docker compose exec php-fpm php artisan test
docker compose exec php-fpm php artisan test tests/Unit
docker compose exec php-fpm php artisan test tests/Feature
docker compose exec php-fpm php artisan test tests/Unit/ExampleTest.php
```

Frontend:

```bash
cd /var/www/api-discovery-hub
docker compose run --rm npm npm run test:run
docker compose run --rm npm npm run build
```

TypeScript / TSXを変更した場合は、必要に応じて手元確認として次を実行します。

```bash
cd /var/www/api-discovery-hub
docker compose run --rm npm npm run typecheck
```

docsのみ変更の場合は、原則として Laravel test や npm build を必須にしません。docs確認コマンドが `docs/operations/command-registry.md` に定義されている場合はそれに従い、未実行の場合は理由を明記します。

## CI必須ゲート

現在のCI必須ゲートは次の確認です。

- Laravel Pint check
- frontend build
- Laravel tests
- Vitest

`composer format-check` は `pint --test` を実行する前提です。CIを通すために `pint --test --dirty` へ弱めません。

`npm run typecheck` は削除しませんが、既存型エラーが残っている間はCI必須ゲートに戻しません。TypeScript / TSX変更時の手元確認コマンドとして扱います。

## テスト結果の扱い

- 失敗テスト名を特定する
- 失敗原因に関係するファイルだけを読む
- 仕様を変えず、テストを通す最小差分を作る
- テスト自体が正しいか人間が確認する
- 実装をテストへ無理に合わせて責務を崩さない

テストが落ちた場合は、次を区別します。

- 実装の不具合
- 既存仕様の破壊
- 正式な仕様変更
- 古いテスト
- テスト環境の問題

作業者の判断だけで期待値を書き換えません。

## テストとレビューの関係

テスト成功後も、次をレビューします。

- Controller / Request / Action / Service / Repository / DTO / Responder / Componentの責務
- Repositoryへ業務判断が入っていないか
- ServiceへDB直接操作が入っていないか
- DTOへレスポンス生成が入っていないか
- Componentへ業務判断が入っていないか
- 不要な依存・過剰な抽象化
- 機能固有仕様が共通docsへ混ざっていないか
- テストが実装詳細ではなく仕様を固定しているか
- 実装作法、型、コメントが `docs/coding-standards.md` と `docs/commenting.md` に沿っているか
