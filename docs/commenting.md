# Commenting

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-12

このドキュメントは、通常コメント・PHPDoc・JSDocの書き方を固定するためのものです。

コメントは、初見の人が主要処理の目的・責務・判断理由・制約を追えるようにするために使います。処理内容を変えたり、テストや設計整理の代替にしたりしません。

処理手順の逐語説明ではなく、判断理由、責務、制約、UI契約、例外条件、将来壊しやすい境界を説明するために使います。

実装作法、型、命名、確認コマンドは `docs/coding-standards.md` に従います。

## 基本方針

- 通常コメント・PHPDoc・JSDocの説明文は日本語で書く
- クラス名、関数名、変数名、型名、コマンド、ライブラリ名、API項目名、正式な技術用語は英語のまま書く
- `@param`、`@return`、`@throws` などのタグは英語のまま書き、説明文は日本語で書く
- コメントは、目的、責務、判断理由、制約、UI契約、例外条件、変更時に守る条件を残すために使う
- 型やシグネチャから明らかな内容を重複して書かない
- 単純処理やコードから明白な箇所には、形式的なコメントを追加しない
- コメントをテストの代替にしない
- 未確認内容、古い仕様のメモ、将来予定、推測を書かない
- TODO、TBD、あとで、仮、未定のような曖昧な保留を書かない
- 外部API仕様、エラー原文、英語であることが仕様の文字列は翻訳しない

## PHP

PHPでは、次の箇所にコメント追加を検討します。

- クラスの責務や、レイヤー上の配置理由が初見で分かりにくい箇所
- 公開メソッドの目的、引数、返り値、例外がシグネチャだけでは読み取りにくい箇所
- 業務判断、状態判断、DB境界、外部API境界を扱う箇所
- Controller / Request / Action / Service / Repository / Responder / DTO の責務境界を読み違えやすい箇所
- Job / Event / Listener / Artisan Command の処理順や再実行時の前提を残す必要がある箇所

DTO / ListDTO には、データキャリアとしての責務を説明するコメントは置いてよいです。ただし、DBアクセス、業務判断、HTTPレスポンス生成、JSONレスポンス生成、View / Inertia / React 用の表示判断を正当化するコメントは書きません。

### PHPDocを付ける対象

次のクラスでは、責務がクラス名だけで明確でない場合にクラスPHPDocを付けます。

- Controller
- Request / FormRequest
- Action
- Service
- Repository
- Responder / Presenter
- DTO / ListDTO
- Factory
- Strategy
- Event / Listener
- Job
- Artisan Command

次の公開メソッドでは、シグネチャだけで目的、引数の意味、返り値の用途、例外条件が読み取れない場合にPHPDocを付けます。

- Actionの `__invoke`
- Serviceの公開メソッド
- Repositoryの公開メソッド
- Responder / Presenterの公開メソッド
- Factory / Strategyの公開メソッド
- DTO / ListDTOの生成系メソッド、`toArray()`
- Job / Artisan Command の実行入口

### `@param` / `@return` / `@throws`

`@param` は、型宣言だけでは引数の業務上の意味、IDの基準、nullable、empty、外部API由来値の扱いが分からない場合に使います。

`@return` は、返り値の用途、配列shape、nullable、empty、ResultDTOの意味がシグネチャだけでは分からない場合に使います。

`@throws` は、呼び出し側が例外を扱う必要がある場合、または外部API・DB・業務状態によって失敗条件を明示すべき場合に使います。

ただし、PHPの型宣言と完全に重複するだけのPHPDocは追加しません。

## Action / Service / features docs / Test の役割分担

コメントやPHPDocは、業務仕様やテストの代替ではありません。どこに何を書くかを次のように分けます。

```text
docs/features/ = 人間が読む業務仕様
Action PHPDoc = ユースケース、呼び出すService、成功条件
Service PHPDoc = 業務判断、入力、出力、置かない責務
Service内コメント = なぜその条件・計算・比較なのか
Test = 実行可能な仕様固定
```

ControllerのコメントやPHPDocには、HTTP入口として受けるRequest、呼び出すAction、返すResponderを中心に書きます。業務判断、DB条件、表示整形の詳細は書きません。

Request / FormRequestのコメントやPHPDocには、入力形式、許可値、境界値、入力DTOへの接続を中心に書きます。業務上の可否判断はServiceへ置き、Requestコメントで正当化しません。

Action の PHPDoc には、何のユースケースかを書きます。

書く内容:

- このActionが担当するユースケース
- Command Action / Query Action の区別
- 呼び出す主な Service
- 入力DTO / Request由来の入力
- 出力DTO / Responderへ渡す結果
- 成功条件
- 失敗条件や例外条件

書かない内容:

- Serviceの業務判断の詳細
- DB取得条件の詳細
- UI表示条件の詳細
- テストで固定すべき細かい期待値

Service の PHPDoc には、何の業務判断を担当するかを書きます。

書く内容:

- このServiceが担当する業務判断
- 入力
- 出力
- 判断対象
- 置かない責務
- 呼び出し元の想定
- 副作用の有無

書かない内容:

- Controller都合
- Requestバリデーション
- DB直接操作
- Inertia props生成
- HTML / UI構造
- テスト実装の都合

Service 内コメントは、なぜその条件、計算、比較なのかを説明するために使います。

書く内容:

- なぜその条件で分岐するのか
- なぜその期間で比較するのか
- なぜその値を除外するのか
- なぜ null / 0 / 空配列を区別するのか
- なぜその丸め方にするのか
- なぜその優先順位にするのか
- 仕様上壊してはいけない判断理由

書かない内容:

- `if` の逐語説明
- 変数代入の説明
- コードを読めば分かる処理順
- 古い仕様メモ
- TODO / TBD / あとで / 仮 / 未定

`docs/features/` には、機能としての業務仕様を書きます。機能の目的、利用者が判断できること、業務仕様、表示仕様、禁止事項、壊してはいけない挙動、外部API制約、DB保存条件、UI契約、テストで守るべき仕様、過去に却下した案を置きます。

Test は、成功条件、失敗条件、壊してはいけない挙動、入力と出力の対応、DTO構造、Repository条件、Service判断、Action手順、Responder props、UI操作や表示状態を実行可能な仕様として固定します。長い業務背景はTestへ詰め込まず、`docs/features/` に置きます。

## TypeScript / React

TypeScript と React では、次の箇所にコメント追加を検討します。

- Component / Hook / Utility の責務がファイル名やpropsだけでは読み取りにくい箇所
- state を分離している理由や、UI操作とデータ取得の境界が重要な箇所
- 非同期処理の順序、古い結果の無効化、競合防止を扱う箇所
- 表示用の変換やキャッシュが、サーバー側責務と混同されやすい箇所
- 外部ライブラリやブラウザAPIの制約に合わせた実装理由を残す必要がある箇所
- MOCK由来のUI契約をProductへ引き継いでいる箇所
- scroll範囲や表示密度に意図がある箇所
- mobile専用操作、mobile / PC表示切替、swipe / autoplay / modal / tabなど操作条件が重要な箇所
- Productで本データへ置き換える境界
- Componentへ業務判断を置かないための境界
- 一見不要に見えるがUX上必要な余白、配置、z-index、overflow指定

JSDocは、公開されるUtilityや複雑なHookなど、呼び出し側が責務・制約を知る必要がある場合に使います。propsの型から明らかな説明は重複して書きません。

TypeScript / Reactでは、props型、nullable、empty状態、外部データ由来値を型で明示します。`any` や型アサーションで不整合を隠しません。型だけで意味が伝わらない場合は、コメントで業務上の意味やUI契約を補足します。

`as` を使う場合は、理由が必要な箇所ではコメントまたはPR本文に残します。`as unknown as Type` のような二段階アサーションは原則使いません。

## テスト

テストコメントは、何の仕様や境界を守るテストなのかを補うために使います。

- テスト名だけで意図が伝わる場合はコメントを追加しない
- 境界値、外部API失敗、非同期処理、Fake実装など、前提の理解が必要な箇所に絞る
- コメントで曖昧な期待値を正当化しない
- コメント追加だけでテスト不足を解消した扱いにしない

## 見直し

実装変更時は、関連コメントが現在の実装と一致しているか確認します。

古いコメントを見つけた場合は、現在の実装に合わせて修正するか、不要であれば削除します。判断に迷う場合は、責務境界や仕様を人間に確認してから更新します。
