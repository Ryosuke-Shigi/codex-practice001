# Context Management

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-13

## このドキュメントの目的

ChatGPT / CodexApp / subagentsへ必要な文脈だけを渡し、トークン・時間・調査コストを抑えながら、推測や読み落としを防ぐための運用方針を定めます。

目的は単純なトークン削減ではありません。

必要な情報を必要な作業へ正しく接続し、AIと人間が前知識なしでも安全に理解を再起動できる状態を作ります。

## 基本方針

- リポジトリ全体を毎回読み込まない
- すべてのdocsを毎回読み込まない
- `AGENTS.md` と `docs/index.md` を入口にする
- 必要な共通docsとfeature docsだけを読む
- 検索してから必要なファイルと範囲だけを開く
- 1タスクへ複数機能・複数目的を混ぜない
- 共通方針は貼り直さず文書参照で済ませる
- 不明な前提を推測で補わない
- 文書同士が矛盾する場合は `docs/index.md` の用途別正本を確認する
- 正本同士が矛盾する場合は自動的に優先せず停止する
- 作業後は次回の理解再起動に必要な情報だけを圧縮する

## 探索範囲制限

AI駆動開発では、目的なくリポジトリ全体を探索しません。

禁止すること:

- 目的なく `app/` 全体を読む
- 目的なく `resources/` 全体を読む
- 目的なく `tests/` 全体を読む
- 関係ない feature docs を読む
- 関係ない Docker / 本番 / CI docs を読む
- エラーや目的と関係ないクラス名で広範囲検索する
- 手がかりがないまま grep を繰り返す

許可する検索:

- 機能名
- Route名
- Controller名
- Action名
- Service名
- Repository名
- DTO名
- Responder名
- Component名
- Test名
- エラー文
- PRで変更されたファイル名
- `docs/index.md` や feature docs から辿れる明示的な参照

検索の原則:

1. PR本文、指示用まとめ、AGENTS.md、`docs/index.md` を確認する
2. 作業種別と対象機能を特定する
3. 読むdocs / 読まないdocs を決める
4. 変更対象ファイルと入口を特定する
5. 必要なファイルだけ読む
6. 依存先が判明した場合だけ追加で読む

## 文脈の読み込み階層

### 常時確認

```text
AGENTS.md
docs/index.md
```

`AGENTS.md` は作業ルールの入口、`docs/index.md` は用語・文書配置・用途別正本の入口です。

### 作業内容に応じて確認

- 開発段階・Product化: `docs/development-flow.md`
- 設計・責務境界: `docs/architecture.md`
- テスト: `docs/testing.md`
- UI: `docs/ui.md`
- React / Inertia / TypeScript: `docs/frontend.md`
- MOCK / Prototype: `docs/prototype-policy.md`
- ログ: `docs/logging.md`
- セキュリティ: `docs/security.md`
- コメント: `docs/commenting.md`

作業と無関係な文書は読み込みません。

### 機能固有文書

特定機能を扱う場合は該当する `docs/features/` を確認します。

例:

- DanceShortsRadar: `docs/features/dance-shorts-radar.md`

実行時刻、API quota、特定テーブル条件、enum、Seeder、Job名、Artisan Command名、機能固有テストはfeature docsへ置きます。

feature docsは共通ルールを上書きできません。

### 対象コード

対象機能に関係する範囲だけを確認します。

- Route / Artisan Command / Scheduler
- Controller / Request
- Action / Service
- Repository
- DTO / ListDTO
- Responder
- Feature / Common Component
- 関連テスト
- 設定・Migration・Job・Event・Listener

## 検索してから読む

```text
目的・段階・対象機能を確認
    ↓
AGENTS.md / docs/index.mdで参照先を決める
    ↓
必要な共通docs・feature docsを読む
    ↓
名前・Route・Class・Test・エラーで検索
    ↓
入口と主要責務を特定
    ↓
必要なファイルだけを読む
    ↓
依存先が判明した場合だけ追加で読む
```

「念のため」という理由だけでディレクトリ全体を大量に読み込みません。

## 1タスクの範囲

```text
1目的
1機能または1ユースケース
必要なレイヤー一式
1ブランチ
1Pull Request
```

複数目的は分割します。

同じ目的を成立させるために不可分なAction・Service・Repository・DTO・Responder・Component・Test・docs更新は同じタスクへ含めてよいものとします。

## 指示用まとめの圧縮

指示用まとめは、会話履歴をそのまま渡さず、検証済みの作業指示へ圧縮します。

CodexAppへ渡す時は、完全な1つのmarkdownブロックだけを使います。

次の指示は使いません。

- 途中で切れた指示
- 複数ブロックに分かれた指示
- ブロック外補足つきの指示

不足がある場合は、部分追記ではなく、完全な1つのmarkdownブロックとして再生成します。

指示用まとめの外側にある説明文は、CodexAppへの作業指示として扱いません。

毎回書くもの:

- 対象
- 目的
- 前提
- 作業ブランチ
- 触る範囲
- 成功条件
- 失敗条件
- 責務分離
- 実装しないこと
- TDD / テスト観点
- docs更新要否
- 確認コマンド
- 実装順
- 完了後の報告項目

文書参照で済ませるもの:

- Git運用全般
- 共通アーキテクチャ
- DTO・UI・コメント・セキュリティの共通方針
- 共通テスト方針
- MOCK / Prototype / Productの共通定義
- 機能固有の長い仕様

```text
共通方針は AGENTS.md と docs/index.md から必要文書を選んで従う。
機能固有方針は該当する docs/features/ に従う。
今回固有の条件は以下。
```

詳細は `docs/templates/instruction-summary.md` に従います。

## 理解再起動

開発後の記録は単なる作業ログではなく、次回の文脈ロード用資料として扱います。

最低限残す内容:

- 現在の状態
- 機能の目的
- 入口
- 主要責務
- 処理フロー
- テストで固定した仕様
- 変更ファイル
- 確認コマンドと結果
- 触ってよい場所
- 注意が必要な場所
- 未完了事項
- 次に読む文書・ファイル

## 理解再起動用まとめの標準形

```text
Base branch:
Base commit:
Created at:
Related PR:
Invalid when:
現在地:
目的:
完了済み:
未完了:
入口:
主要責務:
処理フロー:
変更ファイル:
テストで固定した仕様:
確認結果:
次に読む場所:
注意点:
次の作業:
```

### 鮮度管理

- `Base branch`: 基準ブランチ
- `Base commit`: 確認した基準commit
- `Created at`: 作成日時
- `Related PR`: 関連Pull Request
- `Invalid when`: このまとめが無効になる条件

例:

```text
Invalid when:
- 関連PRが変更された
- 対象feature docsが更新された
- 入口ActionまたはDTO構造が変更された
```

会話履歴をそのまま残さず、決定事項と検証済み事実だけを残します。

却下済み案を残す場合は、再採用しない理由を短く記録します。

## GPT情報源

GPT情報源へ入れる資料は、長期間有効な共通前提に限定します。

### 入れるもの

- 開発全体の目的
- IDEA BOARD / MOCK / PROTOTYPE / PRODUCT
- ADR Pattern / レイヤードの責務
- DTO中心のデータ境界
- TDD / PR / CIのガードレール
- コンテキスト読み込み階層
- 理解再起動
- 指示用まとめの圧縮
- AIと人間の判断境界

### 入れないもの

- 一時的なブランチ名
- 古いcommit SHA
- 解決済みの一時エラー
- 特定PRだけの詳細
- 長い会話ログ
- 現在のコードと一致しない古い仕様
- 秘密情報・本番接続情報
- 一時的な感情や経緯

### 必須メタデータ

```text
Status: active / archived / superseded
Scope: 適用対象
Last reviewed: YYYY-MM-DD
Canonical source: 用途ごとの正本となるdocs・コード・テスト
Supersedes: 置き換えた旧資料
```

古い情報源を残す場合は `archived` または `superseded` を明記します。

日々の作業結果は理解再起動用まとめやNotionへ残します。

## 用途別の正本

用途別の正本は `docs/index.md` に従います。

- 全体ルール・禁止事項: `AGENTS.md` と共通docs
- 実装済みの現在挙動: コード・Migration・設定・成功テスト
- 機能固有の意図・制約: feature docsと関連テスト
- 外部説明: README
- 作業経緯・理解回収: Notion・GPT情報源・理解再起動用まとめ

コードが共通方針に違反している場合、コードが存在するという理由だけで正しい設計とは判断しません。

feature docsが共通方針を上書きすることも認めません。

矛盾がある場合は停止して差異を報告します。

## ChatGPTとCodexApp

### ChatGPT

- 仕様整理
- 責務分離
- 設計の壁打ち
- テスト観点整理
- 指示用まとめの圧縮
- PRレビュー観点整理
- 理解再起動用まとめ
- docs間の矛盾確認

### CodexApp

- 対象コードの調査
- 実装・修正
- 差分適用
- テスト追加・修正
- 確認コマンド実行

CodexAppへは、対象範囲・成功条件・失敗条件・実装しないことを固定した指示用まとめを渡します。

## subagents

利用する場合:

- 独立した調査対象がある
- レビュー観点を分離できる
- テスト観点だけを確認させる
- 同じファイルを編集しない

利用しない場合:

- 小規模修正
- 1ファイルで完結する
- 調査範囲が重複する
- 統合コストの方が高い

subagentの結果は親エージェントが統合し、事実と未確認事項を分けます。

## 停止条件

- 必要な仕様が見つからない
- 対象機能を特定できない
- コード・テスト・共通docs・feature docsが矛盾している
- 変更対象外へ影響する可能性がある
- 却下済み案か確認できない
- 本番データ・秘密情報・破壊的操作が関係する
- テスト結果を確認できないのに完了判定を求められている
- 理解再起動用まとめの基準commitが古い
- GPT情報源のStatusやScopeが不明

停止時は、不足前提、確認済み範囲、進められない理由、矛盾資料、次に必要な情報を報告します。

## 作業完了時の確認

- 必要なdocsだけを参照したか
- 対象feature docsを確認したか
- リポジトリ全体を不要に読んでいないか
- 複数目的を混ぜていないか
- 共通方針を重複記載していないか
- 推測で前提を補っていないか
- 理解再起動用情報に鮮度情報があるか
- 情報源と一時作業記録を分けているか
- 古い情報源へStatusを付けたか

## 原則

```text
情報を減らすことが目的ではない。
必要な文脈だけを、必要な時に、正しい入口から読み込む。
```
