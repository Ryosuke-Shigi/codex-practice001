# Coding Standards

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-12

## このドキュメントの目的

このドキュメントは、PHP / TypeScript / JavaScript / React / CSS / Tailwind の実装作法を固定するための正本です。

責務境界は `docs/architecture.md`、React / Inertia / TypeScript の画面責務は `docs/frontend.md`、UIの見た目と操作は `docs/ui.md`、コメントとPHPDoc / JSDocは `docs/commenting.md` を正本とします。

このドキュメントでは、各言語・各ファイルで毎回迷いやすい書き方、型、命名、確認コマンドを扱います。

## 基本方針

- 新規実装では、型、責務、入力、出力を先に固定する
- 既存ファイルの作法が共通docsと矛盾する場合は、推測で合わせず差異を報告する
- ルールのためだけに既存ファイルを一括変換しない
- 今回触るファイルでは、変更箇所の周辺だけを現在の作法に揃える
- 仕様変更、リファクタリング、format、命名変更を同じPRへ混ぜすぎない
- 型やコメントで責務違反を正当化しない

## PHP

### 型宣言

PHPでは、引数と返り値の型宣言を優先します。

- 引数には可能な限り型を付ける
- 返り値には可能な限り戻り値型を付ける
- 返り値がない場合は `void` を明示する
- nullを許容する場合は `?Type` を使う
- 配列を返す場合は、必要に応じてPHPDocで中身の意味を補足する

型宣言だけで意味が伝わらない場合は、PHPDocで業務上の意味、nullable、empty、例外条件を補足します。

### PHPDoc

PHPDocの詳細は `docs/commenting.md` に従います。

次のクラスでは、クラス責務のPHPDocを検討します。

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

PHPDocには必要に応じて `@param`、`@return`、`@throws` を使います。

ただし、PHPの型宣言と完全に重複するだけのPHPDocは追加しません。

### DTO / ListDTO

- DTOはレイヤー間のデータキャリアに限定する
- DTOへDB操作、業務判断、レスポンス生成、画面表示判断を置かない
- `toArray()` は配列変換までに限定する
- nullable、日時、金額、ID、外部API由来値は意味が分かる名前にする
- 配列のshapeが重要な場合はPHPDocまたはテストで固定する

### Repository

- RepositoryはDBまたは外部データソースとの境界に限定する
- 業務判断、保存可否判断、表示判断を置かない
- 取得条件、保存条件、外部APIのrequest条件はテストで固定する
- Eloquent Modelを外へ出す場合は、渡してよいレイヤーか確認する
- ResponderやComponentへModelを直接渡すための抜け道にしない

### Service

- Serviceは業務判断、計算、状態判断を扱う
- DB直接操作、HTTP都合、Inertia props生成を置かない
- Repositoryへ渡す条件と、受け取ったDTOの扱いを明確にする
- 業務例外を投げる場合は、呼び出し側で扱う責務も固定する

### Action

- Actionは1ユースケースの手順を扱う
- Command Action と Query Action を混同しない
- 大きな業務判断はServiceへ分ける
- EloquentクエリはRepositoryへ分ける
- HTTPレスポンス整形はResponderへ分ける

### Responder / Presenter

- ResponderはInertia props、JSON、CSV、PDFなどの出力整形を扱う
- 業務判断はResponderへ置かない
- Component側が業務ルールを再構築しなくてよい形に整える
- DB Modelや不要な内部カラムをpropsへ渡さない

### Laravel Pint

PHPの整形はLaravel Pintを使います。

```bash
composer format
composer format-check
```

formatだけの差分は、原則として機能変更PRへ混ぜません。対象ファイルの修正に伴う最小限の整形に留めます。

## TypeScript

### 基本

- 新規のReact / Inertia実装はTypeScript / TSXを基本とする
- `strict` を前提に、値の存在を推測しない
- props、戻り値、外部データ、nullableを型で表す
- 型エラーを `as` や `any` で隠さない
- 外部ライブラリの型不足は、局所的に扱い、理由を残す

### type / interface

- props、DTO由来の画面データ、Utilityの戻り値は `type` を基本とする
- 拡張される前提のオブジェクト境界では `interface` を使ってよい
- 同じ目的の型で `type` と `interface` を理由なく混在させない
- Laravel側DTOやResponderのpropsと対応する型は、名前と項目を揃える

### any / unknown

- `any` は原則使わない
- 外部ライブラリ、段階的移行、型定義が存在しない値で必要な場合だけ、範囲を局所化する
- 不明な外部入力は `unknown` で受け、型チェックしてから使う
- `any` を使う場合は、なぜ型を確定できないかをコメントまたはPRへ残す

### nullable / optional

- 存在しない可能性がある値は `null` または `undefined` のどちらを使うか、props側で固定する
- Laravelから明示的に空を渡す場合は `null` を優先する
- optional propsを増やしすぎてComponent内の推測分岐を増やさない
- empty状態は、`null`、空配列、0件を混同しない

### 型アサーション

- `as` は最終手段とする
- APIレスポンス、Inertia props、外部ライブラリ戻り値では、型アサーション前に入力の境界を確認する
- `as unknown as Type` のような二段階アサーションは原則使わない
- 型アサーションで業務上の存在保証を代用しない

### 命名

- ComponentはPascalCase
- Hookは `use` で始める
- Utility関数は動詞または判定内容が分かる名前にする
- booleanは `is`、`has`、`can`、`should` など意味が分かる名前にする
- DTO / props由来の名前はLaravel側の意味と揃える
- 略語を増やしすぎない

### 関数宣言

TypeScriptの関数宣言とアロー関数の使い分けは `docs/frontend.md` に従います。

- Page Component、共通Component、Hook、公開Utilityは関数宣言を基本とする
- `useEffect`、`map`、`filter`、イベントハンドラーなどの内部コールバックはアロー関数を使ってよい
- 同じ責務の処理で理由なく混在させない

### import

- 外部ライブラリ、エイリアス、相対importの順にまとめる
- 使っていないimportを残さない
- 循環依存を作らない
- `@/` aliasを使える箇所では、深すぎる相対パスを避ける
- 型だけのimportは必要に応じて `import type` を使う

## JavaScript

- 新規のアプリケーションコードはTypeScript / TSXを基本とする
- JavaScriptは設定ファイル、既存互換、型定義が不要な小さな初期化に限定する
- JavaScriptを増やす場合は、TypeScriptにしない理由をPRへ残す
- jQueryはLaravel-Admin等の既存jQuery領域に限定する
- React / Inertia側で新規にjQuery依存を増やさない
- Vanilla JS と jQuery を同じ責務で混在させない

## React / Inertia

React / Inertia側の責務は `docs/frontend.md` に従います。

- Pageはページ全体の組み立てとページ固有UI状態を扱う
- Feature Componentは機能固有の表示・操作を扱う
- Common Componentは業務非依存の表示・操作だけを扱う
- Effects Componentは背景・演出に限定する
- ComponentへDB取得、外部API通信、業務判断、権限判断を置かない
- Inertia propsの形はResponderで整える
- Component側で業務ルールを再構築しない

## CSS / Tailwind

UIの見た目と操作基準は `docs/ui.md` に従います。

- Tailwind classは、レイアウト、余白、サイズ、文字、色、状態の順に読みやすくまとめる
- classNameが長くなりすぎる場合は、Component分割や変数化を検討する
- inline styleは動的値、外部ライブラリ都合、局所的な例外に限定する
- z-indexは場当たりで増やさず、Modal、Header、Effectsなどの重なり責務を確認する
- responsive指定はモバイルファーストで追加する
- 色だけで状態を表現しない

## テスト・確認コマンド

変更内容に応じて、対象範囲から全体へ広げて確認します。

PHP:

```bash
composer format-check
php artisan test
```

Frontend:

```bash
npm run typecheck
npm run test:run
npm run build
```

`npm run typecheck` は、TypeScript / TSX を変更した場合の確認コマンドです。現時点ではCI必須ゲートではありません。

formatを適用する場合:

```bash
composer format
```

## CI

Pull Requestとmainへのpushでは、少なくとも次を確認します。

- Laravel Pint check
- frontend build
- Laravel tests
- Vitest

TypeScript typecheck は、既存の型エラー解消と運用確認が完了するまでCI必須ゲートにはしません。TypeScript / TSX を変更するPRでは、必要に応じて手元または個別PRで `npm run typecheck` を確認します。

CIが通っても責務境界が正しいとは判断しません。責務、型、コメント、テスト、docs更新は差分レビューでも確認します。

## 変更時の確認項目

- `docs/architecture.md` の責務境界を崩していないか
- `docs/frontend.md` のComponent / props責務を崩していないか
- `docs/ui.md` のUI責務と操作条件を崩していないか
- `docs/commenting.md` に従い、必要なPHPDoc / JSDocを追加・更新したか
- 型宣言、nullable、empty、例外条件が曖昧なままになっていないか
- `any` や型アサーションで不整合を隠していないか
- 必要なformat / test / buildを確認したか
- TypeScript / TSXを変更した場合は、必要に応じてtypecheckを確認したか
