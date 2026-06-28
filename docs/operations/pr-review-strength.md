# PRレビュー強度ルール

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-13

## このドキュメントの目的

このドキュメントは、PRの作業種別、影響範囲、失敗時の危険度に応じてレビュー強度を切り替えるためのルールです。

目的はレビューを雑にすることではありません。必要な確認を落とさず、不要な全量確認を避けることで、確認精度とレビュー効率を両立します。

軽量化は確認省略ではありません。小さいPRに過剰レビューをかけず、危険なPRを軽く見ないために、最初にレビュー強度を判定します。

## 差分優先レビュー

PRレビューでは、リポジトリ全体理解から入りません。差分から影響範囲を確定し、レビュー強度に応じて必要な範囲へ段階的に広げます。

最初に見るもの:

1. PR本文
2. changed files
3. diff stat
4. diff本文
5. 実行された確認コマンド
6. CI結果

差分優先レビューは、全体理解を放棄することではありません。差分と確認結果から影響範囲を決め、必要なdocs・入口・周辺コードだけを読むための手順です。

## コメント・アノテーション追従確認

コード変更を含むPRでは、関連するコメント、PHPDoc、JSDoc、型アノテーション、props契約説明が実装と矛盾していないか確認します。

確認対象は、責務、入力、出力、DTO形、状態遷移、例外条件、外部API境界、props契約が変わった箇所です。

コメントのみの変更は原則 Level 1 で扱えます。ただし、コード変更に伴う説明の追従漏れは通常の差分レビュー観点として扱い、不要なコメント追加ではなく実装と説明の矛盾防止を目的に確認します。

## レビュー強度

### Level 1: 軽量レビュー

対象:

- Markdown / docs のみ
- コメント / PHPDoc / JSDoc のみ
- Pint整形のみ
- typo修正
- PRテンプレート更新
- コマンド台帳更新
- READMEの軽微修正

確認内容:

- PR本文
- changed files
- diff stat
- `git diff --check`
- docsリンクや表記崩れ
- secrets混入なし
- CI結果

原則としてコード全体探索はしません。

ただし、docsが責務、仕様、禁止事項、運用ルールを変更している場合は Level 2 以上へ上げます。AGENTS.md、docs索引、MDルーター、Sensors、PR Summary、operations docs の導線を変えるdocsのみPRも、軽すぎる確認で済ませません。

### Level 2: 通常レビュー

対象:

- React Component の小規模修正
- props / type / mock / fixture 修正
- TypeScript typecheck修正
- 小さいService修正
- 小さいDTO修正
- 既存テストの軽微修正
- UI表示の微調整

確認内容:

- PR本文
- changed files
- 対象ファイル周辺
- 関連する最小docs
- 必要な確認コマンド
- CI結果
- 差分が目的外へ広がっていないか

全機能を探索しません。対象機能の入口と変更ファイルに絞ります。

### Level 3: 重点レビュー

対象:

- Action / Service / Repository / DTO / Responder を含む機能変更
- API通信
- DB保存・更新・削除
- Job / Artisan Command / Scheduler
- バリデーション
- Inertia props
- 画面導線
- MOCK / PROTOTYPE から PRODUCT への反映
- 複数レイヤーにまたがる変更

確認内容:

- PR本文
- changed files
- 関連docs
- feature docs
- 対象Route
- Controller / Request / Action / Service / Repository / DTO / Responder
- 変更に対応するテスト
- CI結果
- 責務混在がないか
- 仕様・導線・失敗条件が落ちていないか

このレベルでは必要な周辺コードを読みます。ただし、リポジトリ全体の無差別探索はしません。

### Level 4: 厳格レビュー

対象:

- Migration
- DBスキーマ変更
- 認証・認可
- secrets / env
- 本番反映手順
- Docker / nginx / queue / scheduler
- 外部API更新・削除
- セキュリティに関わる変更
- 削除処理
- 大規模リファクタリング
- 複数機能にまたがる変更
- CI / CD / GitHub Actions 変更

確認内容:

- PR本文
- changed files
- 関連docs
- AGENTS.md
- `docs/ai/index.md`
- `docs/operations/command-registry.md`
- migration / model / repository / service / test
- Docker構成
- 本番影響
- rollback方針
- secrets混入
- 破壊的操作の有無
- CI結果
- 必要な手動確認

このレベルでは、merge前に人間の明示判断を必須とします。

## レベル引き上げ条件

以下が1つでもあれば、レビュー強度を上げます。

- DB変更がある
- 外部API通信がある
- 認証・認可に触る
- 本番環境に影響する
- 削除処理がある
- Queue / Scheduler / Job に触る
- Docker / nginx / ports に触る
- Migration がある
- 複数目的が混ざっている
- 仕様と実装の差異が見つかった
- CIが失敗している
- テスト未実行の理由が弱い
- PR本文と差分が一致していない
- コメントだけと言いながら非コメント行が変わっている
- docsだけと言いながら、アプリ機能仕様・UI仕様・コード仕様の変更を含んでいる
- コード変更に対して、関連するコメント、PHPDoc、JSDoc、型アノテーション、props契約説明が古いまま残っている可能性がある

## レベルを下げてはいけない条件

以下は軽量レビューにしません。

- UI導線を変える
- バリデーションを変える
- DTOの形を変える
- Repositoryの取得条件を変える
- Serviceの業務判断を変える
- Actionの処理順序を変える
- Responderのprops構造を変える
- DB保存・更新・削除に触る
- 本番反映手順に関わる
- セキュリティに関わる

## PR確認時の最初の判定

PR確認では、最初に以下を判定してからレビューに入ります。

1. PRの目的
2. 変更ファイル
3. 影響範囲
4. レビュー強度レベル
5. 必要な確認コマンド
6. 読むdocs
7. 読まないdocs

読む範囲を先に決めることで、必要な確認を固定し、不要な探索を避けます。

## 確認コマンドの扱い

確認コマンドは `docs/operations/command-registry.md` に従います。

PRレビュー強度ルールは、確認コマンドを省略するためのルールではありません。作業種別ごとに、必要なコマンドを選ぶためのルールです。

docs / Markdown のみを変更した場合は、原則として `git diff --check` を確認します。Laravel test や npm build は必須にしませんが、docs以外を変更した場合は作業種別に応じて必要な確認へ上げます。

## レビュー中の停止条件

AIが迷ったまま作業を続けると、不要な探索と誤修正が増えます。以下に該当する場合は、作業を進めず停止して報告します。

- 対象ファイルを特定できない
- 入口となる Route / Action / Component / Command を特定できない
- docs とコードが矛盾している
- feature docs と共通docsが矛盾している
- 指示内容とPR差分が一致しない
- 変更対象外のファイルを触る必要が出た
- 指示外の責務に処理を移す必要が出た
- 仕様が不足していて実装判断が必要になった
- テスト失敗の原因が今回差分か既存不具合か判断できない
- 確認コマンドが不明
- `docs/operations/command-registry.md` と実際のコマンドが矛盾している
- 代替実装をしないと完了できない
- UI / DB / API / 本番 / Docker / CI など、当初範囲外の領域に影響する

停止時の報告形式:

```md
## 停止理由

- `<なぜ止めたか>`

## 確認できたこと

- `<確認済みの事実>`

## 矛盾・不足

- `<docs / コード / 指示の差異>`

## これ以上進めると危険な理由

- `<誤修正・過剰探索・仕様破壊の可能性>`

## 次に人間が判断すること

- `<判断が必要な点>`
```

## PR本文への記載

PR本文では、`docs/templates/pr-summary.md` に従ってレビュー強度と確認範囲を記載します。

レビュー強度を明記することで、作業者と人間レビューの判断基準を揃えます。
