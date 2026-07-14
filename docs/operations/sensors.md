# Sensors Catalog

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / docs operations / feedback controls
- Last reviewed: 2026-07-14

## このドキュメントの目的

このドキュメントは、PR前確認、AIレビュー、ローカルスクリプト、将来のCI fail候補として育てる検出項目の台帳です。

作業前に迷いを減らすためのdocsではなく、作業中または作業後にズレ、漏れ、危険変更を検出して修正へ戻すための運用docsとして扱います。

このドキュメントには、既存docsの詳細ルールを全文複製しません。cloneした第三者が、どの漏れをどの段階で検出していくか理解できる粒度に留めます。

## Sensorsの位置付け

Guides / feedforward controls は、作業前にAIや作業者を迷わせないための事前制御です。

例:

- `AGENTS.md`
- `docs/index.md`
- `docs/ai/workflows/md-router.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/features/*`

Sensors / feedback controls は、作業中または作業後にズレ、漏れ、危険変更を検出し、修正へ戻すための事後制御です。

例:

- test
- build
- typecheck
- `git diff --check`
- PR Summary
- AIレビュー
- docs更新要否チェック

この分類は、AI coding agent harness を考えるための整理です。外部記事の詳細資料化や引用集としては扱いません。

## Sensorの種類

### Computational Sensors

機械的に判定できる、または判定しやすい検出項目です。

例:

- `git diff --check`
- markdown link check
- test
- typecheck
- build
- secrets検出

### Inferential Sensors

意味判断が必要な検出項目です。

例:

- docs更新要否
- 責務境界
- PRレビュー強度
- skipped / error の妥当性
- Common Component抽出妥当性

## 運用分類

| 分類 | 役割 |
|---|---|
| Manual Sensors | 人間がPR Summaryや差分で確認する |
| AI Review Sensors | Codex `/review` やAIレビューで意味判断する |
| Script Sensors | ローカルスクリプトや既存コマンドで検出する |
| CI Fail Candidate | 将来的にCIでfailさせる候補。今回の初版ではCI fail実装を行わない |

## 導入Level

| Level | 位置付け | 例 |
|---|---|---|
| Level 1 | 警告だけ。PR Summaryに確認結果や未実行理由を残し、CI failにはしない | docs更新要否、未実行理由、Sensors該当有無 |
| Level 2 | 明確な漏れだけCI fail候補にする | PR Summary必須項目なし、docs link切れ、command追加なのに `command-registry.md` 未更新、feature docsテンプレ必須見出しなし |
| Level 3 | 本番事故、セキュリティ事故、責務崩壊につながるものをCI fail候補にする | secrets混入、migration危険変更、Docker / nginx / security変更の確認不足、外部公開ポート変更、test / build失敗 |

## Sensors台帳

### SENS-001: git diff --check

- ID: SENS-001
- 名前: `git diff --check`
- 種別: Script
- 実行タイプ: Computational
- 実行タイミング: PR前
- 検出したい問題: 空白、行末、diff上の基本崩れ
- 参照docs: `docs/operations/command-registry.md`
- 現在のLevel: Level 1
- 将来の自動化候補: CIでの `git diff --check` 実行
- 備考: docsのみ変更でも原則確認する。

### SENS-002: docs更新要否チェック

- ID: SENS-002
- 名前: docs更新要否チェック
- 種別: Manual / AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業中 / PR前
- 検出したい問題: Feature仕様変更、UI契約変更、コマンド追加、本番運用変更があるのにdocs更新判断がない状態
- 参照docs: `docs/index.md` / `docs/ai/workflows/work-result-feedback-loop.md` / `docs/templates/pr-summary.md`
- 現在のLevel: Level 1
- 将来の自動化候補: changed files とPR Summaryのdocs欄を照合するスクリプト
- 備考: docs更新そのものを目的化せず、戻す必要がない場合も理由を残す。

### SENS-003: PR Summary必須項目チェック

- ID: SENS-003
- 名前: PR Summary必須項目チェック
- 種別: Manual / Script
- 実行タイプ: Computational
- 実行タイミング: PR前
- 検出したい問題: PR Summaryに目的、変更内容、影響範囲、確認コマンド、未実行理由、docs更新要否、レビュー強度がない状態
- 参照docs: `docs/templates/pr-summary.md` / `docs/operations/pr-review-strength.md`
- 現在のLevel: Level 1
- 将来の自動化候補: PR本文の見出し有無チェック
- 備考: 将来のLevel 2候補。

### SENS-004: feature docsテンプレ準拠チェック

- ID: SENS-004
- 名前: feature docsテンプレ準拠チェック
- 種別: Manual / Script
- 実行タイプ: Computational
- 実行タイミング: PR前
- 検出したい問題: 新規feature docsに最低限の見出しや該当なし記載がない状態
- 参照docs: `docs/templates/feature-doc-template.md` / `docs/index.md`
- 現在のLevel: Level 1
- 将来の自動化候補: 新規 `docs/features/*` の必須見出しチェック
- 備考: 将来のLevel 2候補。既存feature docsの一括整形は別PRで扱う。

### SENS-005: command-registry反映チェック

- ID: SENS-005
- 名前: command-registry反映チェック
- 種別: AI Review / Script
- 実行タイプ: Both
- 実行タイミング: 作業中 / PR前
- 検出したい問題: Artisan Command、Scheduler、Docker経由確認コマンドなどを追加・変更したのに `command-registry.md` が更新されていない状態
- 参照docs: `docs/operations/command-registry.md` / `docs/architecture.md` / `docs/testing.md`
- 現在のLevel: Level 1
- 将来の自動化候補: command / scheduler / package scripts 差分と `command-registry.md` 更新有無の照合
- 備考: 将来のLevel 2候補。未確認コマンドを標準扱いしない。

### SENS-006: md-router参照漏れチェック

- ID: SENS-006
- 名前: md-router参照漏れチェック
- 種別: AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業中 / PR前
- 検出したい問題: 作業種別に対して読むべきdocsがPR Summaryや `md-router.md` に反映されていない状態
- 参照docs: `docs/ai/workflows/md-router.md` / `docs/ai/workflows/md-router-cases.md` / `docs/context-management.md`
- 現在のLevel: Level 1
- 将来の自動化候補: 変更ファイル種別から推定した作業種別とPR Summaryの確認範囲の照合
- 備考: MDルーターを毎回更新する意味ではない。必要な場合だけ更新する。

### SENS-007: レイヤー責務境界チェック

- ID: SENS-007
- 名前: レイヤー責務境界チェック
- 種別: AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業中 / PR前
- 検出したい問題: Controller、Request、Action、Service、Repository、DTO、Responder、React Page、Componentの責務混在
- 参照docs: `docs/architecture.md` / `docs/frontend.md` / `docs/ui.md`
- 現在のLevel: Level 1
- 将来の自動化候補: 一部の静的チェック、依存方向チェック、禁止importチェック
- 備考: 責務判断は意味判断が中心。機械化する場合も一部に留める。

### SENS-008: External API / Scheduler / Queue / Job チェック

- ID: SENS-008
- 名前: External API / Scheduler / Queue / Job チェック
- 種別: AI Review
- 実行タイプ: Both
- 実行タイミング: 作業中 / PR前
- 検出したい問題: External API、Scheduler、Queue、Jobを追加したのにログ、retry、failed、config、`.env.example` 方針がない状態
- 参照docs: `docs/architecture.md` / `docs/testing.md` / `docs/logging.md` / `docs/security.md` / `docs/templates/feature-doc-template.md`
- 現在のLevel: Level 1
- 将来の自動化候補: Job / Scheduler / config / docs 差分の照合
- 備考: 本番影響や外部API更新に関わる場合はレビュー強度を上げる。

### SENS-009: skipped / error 区別チェック

- ID: SENS-009
- 名前: skipped / error 区別チェック
- 種別: AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業中 / PR前 / 本番運用後
- 検出したい問題: skipped と error の区別が曖昧なログ方針
- 参照docs: `docs/logging.md` / `docs/templates/feature-doc-template.md`
- 現在のLevel: Level 1
- 将来の自動化候補: ログcontextの `result` や `failed_count` などの有無チェック
- 備考: ログ文言だけでなく、運用上の対応が変わるかで判断する。

### SENS-010: secrets / .env / config チェック

- ID: SENS-010
- 名前: secrets / `.env` / config チェック
- 種別: Script / CI Fail Candidate
- 実行タイプ: Computational
- 実行タイミング: PR前 / CI
- 検出したい問題: secrets、本番 `.env`、APIキー、token、cookie、session、個人情報の混入
- 参照docs: `docs/security.md` / `docs/logging.md`
- 現在のLevel: Level 3候補
- 将来の自動化候補: secrets scanner、禁止ファイル差分チェック
- 備考: 実値をdocs、PR本文、ログへ書かない。検出した場合は削除commitだけで完了扱いしない。

### SENS-011: migration / rollback チェック

- ID: SENS-011
- 名前: migration / rollback チェック
- 種別: Manual / AI Review
- 実行タイプ: Both
- 実行タイミング: 作業中 / PR前 / CI
- 検出したい問題: migration追加・変更時にrollback、本番影響、既存データ影響が未確認の状態
- 参照docs: `docs/testing.md` / `docs/security.md` / `docs/operations/pr-review-strength.md`
- 現在のLevel: Level 2
- 将来の自動化候補: migration差分検出、rollback方針欄のPR Summaryチェック
- 備考: 危険変更はLevel 3候補。今回の初版ではcheckerを実装しない。

### SENS-012: React props / Responder契約チェック

- ID: SENS-012
- 名前: React props / Responder契約チェック
- 種別: AI Review
- 実行タイプ: Both
- 実行タイミング: 作業中 / PR前
- 検出したい問題: React props変更にResponder、DTO、型、テストが追従していない状態
- 参照docs: `docs/frontend.md` / `docs/architecture.md` / `docs/testing.md`
- 現在のLevel: Level 1
- 将来の自動化候補: Responder propsキーとTypeScript型の差分確認、関連テスト有無チェック
- 備考: Component側で業務判断を再構築していないかも確認する。

### SENS-013: Common Component責務チェック

- ID: SENS-013
- 名前: Common Component責務チェック
- 種別: AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業中 / PR前
- 検出したい問題: Common Componentに業務固有URL、固定データ、ステータス解釈、権限判断が混ざる状態
- 参照docs: `docs/frontend.md` / `docs/ui.md`
- 現在のLevel: Level 1
- 将来の自動化候補: `Components/Common` へのfeature固有importやURL文字列の検出
- 備考: 見た目が似ているだけでCommon化しない。

### SENS-014: file size / function length / complexity チェック

- ID: SENS-014
- 名前: file size / function length / complexity チェック
- 種別: Script
- 実行タイプ: Computational
- 実行タイミング: PR前 / 定期
- 検出したい問題: 巨大ファイル、巨大関数、複雑度上昇
- 参照docs: `docs/architecture.md` / `docs/frontend.md` / `docs/testing.md`
- 現在のLevel: Level 1
- 将来の自動化候補: 行数、関数長、複雑度の警告スクリプト
- 備考: 初期PRでは閾値を固定しすぎない。警告から始める。

### SENS-015: logs / understanding reboot 反映チェック

- ID: SENS-015
- 名前: logs / understanding reboot 反映チェック
- 種別: Manual / AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業中 / PR前 / 本番運用後
- 検出したい問題: 失敗、誤読、再発防止、理解再起動に必要な情報が logs / context / feature docs / コメント / テストへ戻っていない状態
- 参照docs: `docs/context-management.md` / `docs/ai/workflows/work-result-feedback-loop.md` / `docs/logging.md`
- 現在のLevel: Level 1
- 将来の自動化候補: PR Summaryの未完了・対象外欄、docs更新要否欄、対象feature docs更新有無の照合
- 備考: 会話ログや一時作業メモをGit管理docsへ戻す意味ではない。

### SENS-016: Comment / Annotation Drift

- ID: SENS-016
- 名前: Comment / Annotation Drift
- 種別: Manual / AI Review
- 実行タイプ: Inferential
- 実行タイミング: コード変更時 / PR前
- 検出したい問題: コード変更に対して、コメント、PHPDoc、JSDoc、型アノテーション、props契約説明、責務説明が古くなっている状態
- 対象: Controller / Request / Action / Service / Repository / DTO / Responder / Job / Command / Scheduler / React Page / Hook / Component / Type
- 判定: コードの責務、入力、出力、状態遷移、例外条件、外部API境界、props契約が変わった場合、関連説明も更新されているか
- 参照docs: docs/commenting.md / docs/architecture.md / docs/frontend.md / docs/templates/pr-summary.md
- 現在のLevel: Level 1
- 将来の自動化候補: changed files とコメント・PHPDoc・JSDoc・型定義の差分照合。ただし機械判定できる範囲に限定し、意味判断を無理にCI failへ押し込まない
- 備考: 不要なコメント追加を求めるSensorではない。実装と説明の矛盾を防ぐSensorとして扱う。

### SENS-017: branch / commit granularity チェック

- ID: SENS-017
- 名前: branch / commit granularity チェック
- 種別: Manual / AI Review
- 実行タイプ: Inferential
- 実行タイミング: 作業開始時 / commit前 / PR前
- 検出したい問題: main直作業、branch不明、branch省略のGitHub書き込み、最後に全変更を詰めた1commit、意味の薄いwip commit量産、無関係な変更を混ぜたcommit
- 参照docs: `docs/ai/rules/agent-working-policy.md` / `docs/operations/command-registry.md` / `docs/templates/pr-summary.md`
- 現在のLevel: Level 1
- 将来の自動化候補: branch protection、PR commit一覧とchanged filesの照合、commit messageの最低限チェック
- 備考: 細かいcommitを増やすためのSensorではない。レビュー可能、巻き戻し可能、原因特定可能な単位になっているかを確認する。

### SENS-018: Docker npm実行経路チェック

- ID: SENS-018
- 名前: Docker npm実行経路チェック
- 種別: Manual / AI Review
- 実行タイプ: Both
- 実行タイミング: React / TypeScript変更時 / PR前
- 検出したい問題: `npm run build`、`npm run test:run`、`npm run typecheck` をホストOS側のnpm / nodeで実行し、Dockerの `npm` service 経由確認として扱ってしまう状態
- 参照docs: `docs/operations/command-registry.md` / `docs/frontend.md` / `docs/templates/pr-summary.md`
- 現在のLevel: Level 1
- 将来の自動化候補: PR Summaryの確認コマンドに `docker compose run --rm npm` が含まれるか、ホストnpm由来の失敗ログを未解決のまま成功扱いしていないかの照合
- 備考: ホストOS側で `UNC paths are not supported`、`vitest is not recognized`、`Cannot find module @rollup/rollup-...`、Nodeバージョン不一致が出た場合は、ホストNode調査を続けずDocker npmで再実行する。

### SENS-019: Project AI harness / runtime / 単一writerチェック

- ID: SENS-019
- 名前: Project AI harness / runtime / 単一writerチェック
- 種別: Script / AI Review / Manual
- 実行タイプ: Both
- 実行タイミング: `.codex/config.toml`、Subagent運用docs、project checker変更時 / agent選択時 / runtime確認時 / PR前
- 検出したい問題: 公開repoが個人用agent catalogを必須依存にする状態、親だけの代替導線欠落、設定値とresolved runtimeの混同、親を含む複数writer、Redを観測しないGreen、検証・レビュー中の書込み、ブラウザ利用不能を代替経路で成功扱いする状態、許可されていないGit / GitHub操作やsubagent再委譲
- 参照docs: `docs/ai/rules/model-routing-policy.md` / `docs/ai/workflows/loop-engineering.md` / `docs/testing.md` / `docs/operations/command-registry.md`
- 現在のLevel: Level 1
- 将来の自動化候補: `python3 scripts/verify_project_ai_harness.py`をCIへ登録する。resolved model、effective sandbox、単一writer、ブラウザ実行可否などruntime・意味判断を要する部分は、自動化可能な証跡が揃うまでAI Review / Manualを維持する
- 備考: 静的ハーネス成功をruntime成功へ読み替えない。fresh sessionで認識されていないagent、親側metadataで確認できない実効値、利用不能なCodex App内蔵ブラウザは未確認として記録する。現在のLevel 1はCI fail化の導入段階であり、危険度を表さない。Git / PR操作、再委譲、複数writerなどの安全境界違反を検出した場合はpolicyに従い即時停止する。

## PR Summaryへ残す項目

Sensorsに関係するPRでは、`docs/templates/pr-summary.md` に従い、少なくとも次を残します。

- 目的
- 変更内容
- 影響範囲
- 確認コマンドと結果
- 未実行コマンドと理由
- README / docs更新要否
- レビュー強度
- 該当したSensor、または該当なしの理由
- branch運用とcommit粒度の確認結果
- CI fail化していない場合は、その理由

## CI fail化する前の条件

Level 2またはLevel 3としてCI fail候補にする前に、次を確認します。

- 誤検知が多すぎない
- ローカルで再現できる
- 失敗時の修正方法をPR本文や関連docsから説明できる
- 既存差分を大量に巻き込まない
- 人間の意味判断が必要な項目を無理に機械判定へ押し込んでいない
- `docs/operations/command-registry.md` に実行場所や確認方法を追加できる
- fail化するLevelとレビュー強度が一致している

## 今回まだ実装しないこと

この初版では、次を実装しません。

- CIスクリプト
- GitHub Actions変更
- PHPStan導入
- ESLint設定変更
- dependency-cruiser導入
- secrets scanner導入
- migration checker導入
- done-checklist.md
- external-integration-feature-template.md
- 外部記事の資料化ページ
- PDF / Notion用資料
- アプリ実装

## 関連docs

| Path | 関係 |
|---|---|
| `docs/index.md` | docs全体の索引、用途別の正本 |
| `docs/ai/index.md` | AI作業フローと責務境界の補助索引 |
| `docs/ai/workflows/md-router.md` | 作業開始時に読むdocs、読まないdocs、停止条件を固定する入口 |
| `docs/ai/workflows/md-router-cases.md` | MDルーターの実戦ケース集 |
| `docs/ai/workflows/work-result-feedback-loop.md` | 作業後にどのdocs、型、コメント、テストへ戻すかの判定 |
| `docs/ai/rules/model-routing-policy.md` | 任意のSubagent利用、親の統合、単一writer、runtime確認境界の正本 |
| `docs/templates/pr-summary.md` | PR本文の実装後事実整理 |
| `docs/templates/feature-doc-template.md` | 新規Feature docsの型 |
| `docs/operations/pr-review-strength.md` | PR差分の危険度に応じたレビュー強度 |
| `docs/operations/command-registry.md` | 実行場所と確認コマンドの台帳 |
| `docs/architecture.md` | ADR Pattern、レイヤー責務境界 |
| docs/commenting.md | コメント、PHPDoc、JSDoc、型説明の書き方 |
| `docs/testing.md` | テスト方針と実行コマンド |
| `docs/frontend.md` | React / Inertia / TypeScript責務 |
| `docs/ui.md` | UI、Common Component、操作性 |
| `docs/logging.md` | ログ分類、skipped / error、記録禁止情報 |
| `docs/security.md` | secrets、本番接続、破壊的操作 |
| `docs/context-management.md` | 文脈読込、探索範囲制限、理解再起動 |
