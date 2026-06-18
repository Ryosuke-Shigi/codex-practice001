# Documentation Index

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-12

## このドキュメントの目的

このドキュメントは、どの文書をいつ読むか、どの情報を正本として扱うかを示す案内板です。

`AGENTS.md` は作業時の入口、この文書はdocs全体の索引として扱います。

## 用途別の正本

情報は1本の順位だけで決めません。用途ごとに正本を分けます。

### 全体ルール・禁止事項

- `AGENTS.md`
- `docs/ai/index.md`
- `docs/ai/workflows/md-router.md`
- 共通方針docs

### コマンド実行・Git境界

- `docs/operations/command-registry.md`

ローカル構成では外側Docker repoと `src/` 内アプリrepoが別Git管理のため、作業対象に応じたGit境界の確認は `docs/operations/command-registry.md` を正本とします。

### PR確認・レビュー強度

- `docs/operations/pr-review-strength.md`

### 実装済みの現在挙動

- 現在のコード
- Migration・設定
- 成功しているテスト

### 機能固有の意図・制約

- `docs/features/` の該当文書
- 関連する成功テスト

feature docsは機能固有の意図・制約を記録し、現在の実装挙動はコード・Migration・設定・成功テストで確認します。どちらか一方だけを全用途の正本とは扱いません。

### 外部向け説明

- `README.md`

### 作業経緯・理解回収

- Notion
- GPT情報源
- 理解再起動用まとめ

コードが共通方針に違反していても、コードが存在するという理由だけで正しい設計とは判断しません。

feature docsが共通ルールを上書きすることも認めません。

コード・テスト・共通docs・feature docsが矛盾している場合は、自動的に優先順位を決めず、推測で進めず差異を報告します。

## 用語

### ADR Pattern

このプロジェクトでいうADR Patternは、次を指します。

```text
Action - Domain - Responder
```

Actionはユースケースの手順、Domain側のService等は業務判断、Responderは出力整形を担当します。

### Decision Record

重要な設計判断と、その理由・却下案・影響を残す記録です。

Architecture Decision Recordの略称としてADRとだけ書くとADR Patternと衝突するため、このプロジェクトでは `Decision Record` または `設計判断記録` と表記します。

### Command Action / Query Action / Artisan Command

- `Command Action`: 登録・更新・削除・同期開始など、状態を変更するユースケースのAction
- `Query Action`: 一覧・詳細・検索・ランキングなど、参照するユースケースのAction
- `Artisan Command`: Laravelのコンソール実行入口。JobをdispatchするかActionを呼び、業務ロジック本体を持たない

`Command` だけではCommand ActionとArtisan Commandを区別できないため、文書では対象を明記します。

## 常時確認する文書

| 文書 | 役割 |
|---|---|
| `AGENTS.md` | AI・人間が作業時に守る入口ルール |
| `docs/ai/index.md` | AI作業用MDの索引 |
| `docs/index.md` | docsの索引、正本の役割分担、用語 |
| `docs/ai/workflows/md-router.md` | 作業種別ごとに読むdocs、読まないdocs、停止条件、作業後の保守ルール |

## MD作業ルーター

MD作業ルーターは、作業開始時に参照範囲と編集禁止範囲を固定する入口です。MD群は全部読む知識ベースではなく、作業ごとに必要な棚だけ開きます。

詳細な作業種別別ルーティング、PRレビュー強度との接続、停止条件、作業後の保守ルールは `docs/ai/workflows/md-router.md` を正本とします。

作業前に宣言する項目は `docs/ai/workflows/md-router.md` を確認してください。

## 作業内容に応じて確認する文書

| 文書 | 読む条件 |
|---|---|
| `docs/context-management.md` | 文脈読込、トークン節約、理解再起動 |
| `docs/ai/workflows/md-router.md` | 作業種別ごとの読むdocs、読まないdocs、停止条件、PRレビュー強度との接続 |
| `docs/feature-module-portability.md` | Feature Module移植ルール。Feature全体移植 / PRODUCTのみ移植 / MOCKのみ移植 / PROTOTYPEのみ移植 / IDEA BOARDのみ移植、移植元repoは読むだけ、移植先repoだけに差分を出す原則、移植対象・差し替え対象・移植しない対象の固定、個別Feature移植マニフェストの追加方針 |
| `docs/development-flow.md` | IDEA BOARD / MOCK / PROTOTYPE / PRODUCT、Product化 |
| `docs/ui-development-flow.md` | MOCKで作る画面単体、PROTOTYPEで作る接続、PRODUCTへ引き継ぐUI契約 |
| `docs/architecture.md` | ADR Pattern、レイヤード、責務境界、Command Action / Query Action / Artisan Command |
| `docs/operations/command-registry.md` | Docker経由コマンド、root / `/src` のGit境界、作業種別ごとの確認 |
| `docs/operations/pr-review-strength.md` | PRの作業種別、影響範囲、危険度に応じたレビュー強度 |
| `docs/coding-standards.md` | PHP / TypeScript / JavaScript / React / CSS の実装作法、型、命名、確認コマンド |
| `docs/testing.md` | テスト追加、仕様固定、CI確認 |
| `docs/frontend.md` | React / Inertia / TypeScript、props、Component責務 |
| `docs/ui.md` | UI、Common、モバイル、操作、Effects |
| `docs/prototype-policy.md` | MOCK / Prototypeの配置、許可範囲、Product化 |
| `docs/logging.md` | ログ分類、出力責務、保持期間 |
| `docs/security.md` | 秘密情報、本番接続、破壊的操作、外部公開、バリデーションの安全境界 |
| `docs/commenting.md` | コメント、PHPDoc、JSDoc |

## 機能固有文書

機能固有の実行時刻、取得条件、DB条件、API制約、テスト仕様は、共通docsへ書き込みすぎず `docs/features/` に置きます。

| 文書 | 対象 |
|---|---|
| `docs/features/api-discovery-hub.md` | API Discovery Hubの同期、検索、保存メモ、テスト固定仕様 |
| `docs/features/dance-shorts-analyzer.md` | DanceShortsAnalyzerの保存済み動画検索、Analyze表示、snapshot計算、テスト固定仕様 |
| `docs/features/dance-shorts-radar.md` | DanceShortsRadarの同期、ランキング、テスト固定仕様 |
| `docs/features/japan-quake-wave-map.md` | Japan Quake Wave Mapのfeed、XML、map pin、status API |
| `docs/features/application-logs.md` | Project Hub logsのAPI連携ログ、ERRORログ、対応済み管理、テスト固定仕様 |

新しい機能固有文書を追加した場合は、この一覧も更新します。

## テンプレート

| 文書 | 用途 |
|---|---|
| `docs/templates/pr-summary.md` | Pull Requestのレビュー用まとめ |

## 文書の配置基準

### `AGENTS.md`

全作業で守らないと事故につながる短いルールと、参照先だけを置きます。

### 共通方針docs

複数機能に共通する判断基準だけを置きます。

### `docs/features/`

特定機能だけに有効な仕様、入口、処理フロー、テスト固定内容を置きます。

### `README.md`

外部閲覧者向けの概要、技術構成、利用方法を置きます。内部の詳細ルールは置きすぎません。

### Notion・理解再起動用まとめ

作業経緯、理解回収、現在地、未完了事項を置きます。長期的な正本にはしません。

## 文書メタデータ

長期保存する情報源・機能文書には、必要に応じて次を付けます。

```text
Status: active / archived / superseded
Scope: 適用リポジトリ・機能
Last reviewed: YYYY-MM-DD
Canonical source: 用途ごとの正本となる文書・コード・テスト
Supersedes: 置き換えた旧資料
```

`Canonical source` は全用途を1本へ集約する意味ではありません。機能固有文書では、意図・制約と現在挙動の正本を分けて記載します。

一時的な理解再起動用まとめには、次も残します。

```text
Base branch:
Base commit:
Created at:
Related PR:
Invalid when:
```

長期保存するGPT情報源には、一時的なcommit SHAやブランチ名を入れません。

## 更新ルール

- 共通ルール変更時は、正本となる共通docsだけを先に更新する
- 機能仕様変更時は、コード・テストと該当する `docs/features/` を更新する
- README、Notion、GPT情報源は正本変更後に追従させる
- 古い資料を残す場合は `archived` または `superseded` を明記する
- 同じ詳細ルールを複数文書へ全文複製しない
- 他文書で同じ観点を確認する場合は、その文書の責務に必要な要約と正本への参照だけを置く
