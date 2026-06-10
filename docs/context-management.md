# Context Management

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、ChatGPT / CodexApp / subagentsへ必要な文脈だけを渡し、トークン・時間・調査コストを抑えながら、推測や読み落としを防ぐための運用方針を定めます。

目的は単純なトークン削減ではありません。

必要な情報を必要な作業へ正しく接続し、AIと人間が前知識なしでも安全に理解を再起動できる状態を作ることを目的とします。

## 基本方針

- リポジトリ全体を毎回読み込まない
- すべてのdocsを毎回読み込まない
- `AGENTS.md` と `docs/index.md` を入口として使う
- 作業内容に必要な共通docsとfeature docsだけを読む
- 検索してから必要なファイルと必要な範囲だけを開く
- 1タスクへ複数機能・複数目的を混ぜない
- 決定済みの共通方針は貼り直さず文書参照で済ませる
- 不明な前提を推測で補完しない
- 文書同士が矛盾する場合は `docs/index.md` の優先順位に従う
- 必要な前提が見つからない場合は実装を進めず不足を報告する
- 作業後は次回の理解再起動に必要な情報だけを圧縮して残す

## 文脈の読み込み階層

### 常時確認するもの

```text
AGENTS.md
docs/index.md
```

`AGENTS.md` は作業ルールの入口、`docs/index.md` は正本順位・用語・参照先の入口として扱います。

### 作業内容に応じて確認するもの

例:

- 開発段階・Product化: `docs/development-flow.md`
- 設計・責務境界: `docs/architecture.md`
- テスト: `docs/testing.md`
- UI: `docs/ui.md`
- React / Inertia / TypeScript: `docs/frontend.md`
- MOCK / Prototype: `docs/prototype-policy.md`
- ログ: `docs/logging.md`
- セキュリティ: `docs/security.md`
- コメント: `docs/commenting.md`
- コンテキスト管理: `docs/context-management.md`

作業と無関係な文書は読み込みません。

### 機能固有文書

特定機能を扱う場合は、該当する `docs/features/` を確認します。

例:

- DanceShortsRadar: `docs/features/dance-shorts-radar.md`

実行時刻、API quota、特定テーブル条件、enum、Seeder、Job名、Command名、機能固有テストは、共通docsではなくfeature docsを優先します。

### 対象コード

対象機能に関係する範囲だけを確認します。

- Route / Command / Schedulerなどの入口
- Controller / Request
- Action / Service
- Repository
- DTO / ListDTO
- Responder
- Feature Component
- Common Component
- 関連テスト
- 関連する設定・Migration・Job・Event・Listener

検索結果から関係が確認できないファイルを、念のためという理由だけで大量に開きません。

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

検索語は、機能名、Route名、Command名、DTO名、Service名、Repository名、画面名、エラーメッセージなど、今回の目的に直接関係するものを使います。

## 1タスクの範囲

1タスクは原則として次の単位に限定します。

```text
1目的
1機能または1ユースケース
1責務境界
1ブランチ
1Pull Request
```

複数の目的が見つかった場合は分割します。

ただし、同じ目的を成立させるために不可分なDTO・Service・Repository・Responder・Component・Test・docs更新は、同じタスクへ含めてよいものとします。

## 指示用まとめの圧縮

指示用まとめには今回固有の内容だけを書きます。

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
- 共通DTO方針
- 共通UI方針
- 共通コメント方針
- 共通セキュリティ方針
- 共通テスト方針
- MOCK / Prototype / Productの共通定義

例:

```text
共通方針は AGENTS.md と docs/index.md から必要文書を選んで従う。
機能固有方針は該当する docs/features/ に従う。
今回固有の条件は以下。
```

共通ルールを毎回全文コピーしません。

詳細な型は `docs/templates/instruction-summary.md` に従います。

## 理解再起動

人間は時間が経てば忘れ、AIは前回の会話や実装意図を完全には保持しません。

そのため、開発後の記録は単なる作業ログではなく、次回の文脈ロード用資料として扱います。

最低限残す内容:

- 現在の状態
- 機能の目的
- 入口となるRoute / Command / Scheduler / Page
- 主要なAction / Service / Repository / DTO / Responder / Component
- 処理の流れ
- 責務境界
- テストで固定した仕様
- 変更したファイル
- 実行した確認コマンドと結果
- 触ってよい場所
- 注意が必要な場所
- 未完了事項
- 次に読むべき文書・ファイル

次回はこの圧縮情報を入口として、不足する部分だけを追加調査します。

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

- `Base branch`: まとめを作成した基準ブランチ
- `Base commit`: 確認した基準commit
- `Created at`: 作成日時
- `Related PR`: 関連するPull Request
- `Invalid when`: このまとめが無効になる条件

例:

```text
Invalid when:
- 関連PRが変更された
- 対象feature docsが更新された
- 入口ActionまたはDTO構造が変更された
```

会話履歴をそのまま残さず、決定事項と検証済み事実だけを残します。

却下済み案・失敗した案を残す場合は、再採用しない理由を短く記録します。

## GPT情報源用資料

GPT情報源へ入れる資料は、長期間有効な共通前提に限定します。

### 入れるもの

- 開発全体の目的
- IDEA BOARD / MOCK / PROTOTYPE / PRODUCTの段階
- ADR Pattern / レイヤードの責務
- DTO中心のデータ境界
- TDD / PR / CIによるガードレール
- コンテキスト読み込み階層
- 理解再起動の考え方
- 指示用まとめの圧縮ルール
- AIへ任せる範囲と人間が判断する範囲

### 入れないもの

- 一時的なブランチ名
- 古いcommit SHA
- 解決済みの一時エラー
- 特定PRだけの詳細
- 長い会話ログ
- 現在のコードと一致しない古い仕様
- 秘密情報や本番接続情報
- 一時的な感情や経緯

### 必須メタデータ

GPT情報源には次を付けます。

```text
Status: active / archived / superseded
Scope: 適用対象
Last reviewed: YYYY-MM-DD
Canonical source: 正本となるdocs
Supersedes: 置き換えた旧資料
```

古い情報源を残す場合は `archived` または `superseded` を明記します。

GPT情報源は共通方針が変わった時だけ更新します。

日々の作業結果は理解再起動用まとめやNotionへ残します。

## 正本と補助資料

正本順位は `docs/index.md` に従います。

基本:

```text
現在のコード・成功しているテスト
    ↓
AGENTS.md・共通docs
    ↓
feature docs
    ↓
README
    ↓
Notion・GPT情報源・理解再起動用まとめ
```

下位資料だけを根拠に、コードや正本docsを変更しません。

矛盾がある場合は停止して差異を報告します。

## ChatGPTとCodexAppの使い分け

### ChatGPT

- 仕様整理
- 責務分離
- 設計の壁打ち
- テスト観点整理
- 指示用まとめの圧縮
- PR差分のレビュー観点整理
- 理解再起動用まとめの作成
- docs間の矛盾確認

### CodexApp

- 対象コードの調査
- 実装・修正
- 差分適用
- テスト追加・修正
- 確認コマンド実行

ChatGPTへリポジトリ全体を毎回説明せず、共通方針は情報源とdocsを参照し、今回固有の内容だけを会話へ載せます。

CodexAppへは、対象範囲・成功条件・失敗条件・実装しないことを固定した指示用まとめを渡します。

## subagentsの利用

subagentsは文脈量を減らすために無条件で増やしません。

利用する場合:

- 独立した調査対象がある
- レビュー観点を分離できる
- テスト観点だけを確認させる
- 同じファイルを編集しない

利用しない場合:

- 小規模な修正
- 1ファイルだけで完結する変更
- 調査範囲が重複する
- 統合コストの方が高い

subagentの結果はそのまま採用せず、親エージェントが重複を除き、事実と未確認事項を分けて統合します。

## 停止条件

次の場合は推測で先へ進みません。

- 必要な仕様が見つからない
- 対象機能を特定できない
- 現在のコード・テスト・docsが矛盾している
- 変更対象外へ影響する可能性がある
- 却下済み案か確認できない
- 本番データ・秘密情報・破壊的操作が関係する
- テスト結果を確認できないのに完了判定を求められている
- 理解再起動用まとめの基準commitが古い
- GPT情報源のStatusやScopeが不明

停止時は次を報告します。

- 不足している前提
- 確認済みの範囲
- 進められない理由
- 矛盾している資料
- 次に必要な情報

## 作業完了時の確認

- 必要なdocsだけを参照したか
- 対象feature docsを確認したか
- リポジトリ全体を不要に読み込んでいないか
- 複数目的を混ぜていないか
- 共通方針を指示文へ重複記載していないか
- 推測で前提を補っていないか
- 次回の理解再起動用情報に鮮度情報があるか
- 情報源と一時的な作業記録を分けているか
- 古い情報源へStatusを付けたか

## 原則

```text
情報を減らすことが目的ではない。
必要な文脈だけを、必要な時に、正しい入口から読み込む。
```

この運用により、トークン・時間・調査コストを抑えながら、AIが前提を取り違える危険も減らします。
