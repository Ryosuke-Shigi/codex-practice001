# Context Management

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-13

## このドキュメントの目的

作業者が必要な文脈だけを読み、時間・調査コストを抑えながら、推測や読み落としを防ぐための運用方針を定めます。

目的は単純なトークン削減ではありません。

必要な情報を必要な作業へ正しく接続し、別の開発者が前知識なしでも安全に理解を再起動できる状態を作ります。

## 基本方針

- リポジトリ全体を毎回読み込まない
- すべてのdocsを毎回読み込まない
- `AGENTS.md`、`docs/ai/index.md`、`docs/index.md` を入口にする
- 作業開始時は `docs/ai/workflows/md-router.md` で作業種別ごとの読むdocsを固定する
- 必要な共通docsとfeature docsだけを読む
- 検索してから必要なファイルと範囲だけを開く
- 1タスクへ複数機能・複数目的を混ぜない
- 共通方針は貼り直さず文書参照で済ませる
- 不明な前提を推測で補わない
- 文書同士が矛盾する場合は `docs/index.md` の用途別正本を確認する
- 正本同士が矛盾する場合は自動的に優先せず停止する
- 作業後は次回の理解再起動に必要な情報を正本となるdocs、型、コメント、テストへ反映する

## MDルーター

作業開始時は、必ず `docs/ai/workflows/md-router.md` を確認し、作業種別ごとに読むdocsを固定する。

作業種別を判定できない場合、推測でdocs探索を広げず停止します。

docs、コード、テストが矛盾する場合は、自己判断で統合せず、停止条件を発動して人間へ判断を戻す。

作業完了時は、今回の作業によってMDルーターの追加・削除・修正が必要かを確認する。

MDルーターは毎回必ず更新するものではない。必要がある場合だけ更新する。

## 探索範囲制限

目的なくリポジトリ全体を探索しません。

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

1. PR本文、AGENTS.md、`docs/ai/index.md`、`docs/index.md` を確認する
2. 作業種別と対象機能を特定する
3. `docs/ai/workflows/md-router.md` のMDルーターで参照範囲を決める
4. 読むdocs / 読まないdocs / 編集禁止ファイル / 除外対象 / Git境界 / 停止条件を宣言する
5. 変更対象ファイルと入口を特定する
6. 必要なファイルだけ読む
7. 依存先が判明した場合だけ追加で読む

作業開始時に宣言すること:

- 今回読むdocs
- 今回読まないdocs
- 編集禁止ファイル
- 除外対象
- Git境界
- 停止条件

## 文脈の読み込み階層

### 常時確認

```text
AGENTS.md
docs/ai/index.md
docs/index.md
```

`AGENTS.md` は作業ルールの入口、`docs/ai/index.md` はAI作業用MDの索引、`docs/index.md` は用語・文書配置・用途別正本の入口です。

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
AGENTS.md / docs/ai/index.md / docs/index.md / docs/ai/workflows/md-router.mdで参照先を決める
    ↓
MDルーターで読むdocs・読まないdocs・編集禁止ファイル・停止条件を固定
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

## 理解再起動で残す情報

理解再起動は、会話ログや一時作業メモを保存することではありません。プロダクトを後から理解し直すために、現在のコード、型、コメント、テスト、docsから目的、責務、入力、出力、禁止事項、変更時の注意を回収できる状態を作ることです。

共通docsへ残すもの:

- 複数機能に共通する責務境界
- 開発段階、テスト方針、コメント方針、UI責務
- 追加、変更、削除時に守る成長ルール
- コマンド実行場所やGit境界の共有ルール

feature docsへ残すもの:

- 機能固有の目的、入口、入力、出力
- 業務判断、外部API制約、DB条件、表示条件
- テストで固定した仕様
- 変更時に壊しやすい導線や状態

コード、型、コメント、テストへ残すもの:

- レイヤーごとの責務
- DTO、props、フォーム入力、API結果の形
- なぜその条件分岐や制約が必要か
- Service判断、Request validation、Responder props、UI状態の実行可能な仕様

## 一時メモとGit管理docsの分離

一時的な作業条件、会話運用、個人の確認メモ、ローカル環境固有の再発防止メモは、Git管理docs体系へ含めません。Git管理docsには、cloneした第三者がプロダクトを理解、変更、テスト、運用するための情報だけを残します。

ローカル専用メモを使う場合も、表docsから中身を案内しません。PRには、実際に変更したdocs、確認結果、未実行コマンドと理由だけを書きます。

## 停止条件

- 必要な仕様が見つからない
- 対象機能を特定できない
- コード・テスト・共通docs・feature docsが矛盾している
- 変更対象外へ影響する可能性がある
- 却下済み案か確認できない
- 本番データ・秘密情報・破壊的操作が関係する
- テスト結果を確認できないのに完了判定を求められている
- 理解再起動に必要なdocs、型、コメント、テストのどれを正とするか判断できない

停止時は、不足前提、確認済み範囲、進められない理由、矛盾資料、次に必要な情報を報告します。

## 作業完了時の確認

- 必要なdocsだけを参照したか
- 対象feature docsを確認したか
- リポジトリ全体を不要に読んでいないか
- 複数目的を混ぜていないか
- 共通方針を重複記載していないか
- 推測で前提を補っていないか
- 理解再起動に必要な情報が、正しいdocs、型、コメント、テストへ反映されているか
- Git管理docsと一時作業メモを分けているか
- 古い情報にはStatusを付けたか

## 原則

```text
情報を減らすことが目的ではない。
必要な文脈だけを、必要な時に、正しい入口から読み込む。
```
