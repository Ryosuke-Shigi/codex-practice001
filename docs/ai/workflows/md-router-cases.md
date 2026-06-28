# MD Router Cases

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-27

## このドキュメントの目的

このドキュメントは、`md-router.md` の実戦ケース集です。

作業種別ごとに、読むdocs、読まないdocs、触ってよい主な層、停止条件、確認コマンド、PR Summaryに残すことを短く確認するために使います。

## `md-router.md` との関係

- `md-router.md`: 作業種別ごとのルーティング正本
- `md-router-cases.md`: 実例集

迷った場合は `md-router.md` を正とします。この実例集は正本を補助するためのものであり、ルーティングの正本を分散させるものではありません。

## 各ケースの型

各ケースは次の観点で確認します。

- ケース名
- 目的
- 読むdocs
- 読まないdocs
- 触ってよい主な層
- 停止条件
- 確認コマンド
- PR Summaryに残すこと

確認コマンドは `../../operations/command-registry.md` にある実行経路から選びます。下表のコマンドは候補であり、実行したかどうかと結果はPRごとに記録します。

## ケース集

| ケース | 目的 | 読むdocs | 読まないdocs | 触ってよい主な層 | 停止条件 | 確認コマンド候補 | PR Summaryに残すこと |
|---|---|---|---|---|---|---|---|
| docsのみ変更 | docs構成、索引、運用ルールを整理する | `../../index.md` / `../../context-management.md` / `md-router.md` / 対象docs | 無関係feature docs / アプリコード | docs / README / AGENTS.md | docs正本が分散する、アプリコード変更が必要になる | `git diff --check` | docsのみ変更、Laravel test / npm build未実行理由 |
| docs運用最適化 | AGENTS / docs索引 / MDルーター / operations docs の導線を整理する | ../../../AGENTS.md / ../../index.md / ../index.md / md-router.md / md-router-cases.md / work-result-feedback-loop.md / ../../operations/sensors.md / ../../operations/pr-review-strength.md / ../../templates/pr-summary.md | 無関係feature docs / アプリコード / Docker構成 / CI設定 / ローカル環境固有情報の内容 | AGENTS.md / docs索引 / docs/ai/workflows / docs/operations / docs/templates | ローカル環境固有情報がGit差分に入る、SENS一覧の複製になる、アプリコード変更が必要になる | git diff --check / git diff --name-only | 変更した導線、該当Sensors、docs以外を触っていないこと |
| Sensors台帳追加・修正 | PR前確認、AIレビュー、スクリプト、CI fail候補として育てる検出項目を追加・更新する | `../../index.md` / `../../operations/sensors.md` / `md-router.md` / `md-router-cases.md` / `work-result-feedback-loop.md` / `../../templates/pr-summary.md` | 無関係feature docs / アプリコード / CI実装 / Docker構成 | docs/operations / docs/ai/workflows | CI実装やアプリコード変更が必要になる、既存docsの全文複製になる | `git diff --check` | 追加・修正したSensor、CI fail化しない範囲、Laravel test / npm build未実行理由 |
| React UIだけ修正 | 画面表示、操作、UI状態を修正する | `../../frontend.md` / `../../ui.md` / 対象feature docs | Repository / Migration | Page / Component / hook / type | propsやDB条件の変更が必要になる | `docker compose run --rm npm npm run build` | UI影響範囲、確認した画面、build結果 |
| Inertia props変更ありのReact修正 | ResponderからReactまでのprops契約を変更する | `../../frontend.md` / `../../architecture.md` / `../../testing.md` / 対象feature docs | 無関係Service | Controller / Action / Responder / Page / Test | props変更の責務配置を固定できない | `docker compose exec php-fpm php artisan test` / `docker compose run --rm npm npm run build` | props変更内容、対応テスト、UI確認 |
| コード変更後のコメント・アノテーション追従確認 | 実装変更に対してコメント、PHPDoc、JSDoc、型アノテーション、props契約説明が古くないか確認する | ../../commenting.md / ../../operations/sensors.md / ../../operations/pr-review-strength.md / 対象feature docs | 無関係feature docs / コメント追加目的の周辺探索 | 変更ファイルと関連コメント / PHPDoc / JSDoc / 型 / props契約説明 | 仕様変更やテスト不足をコメント追加で隠す必要が出る | 作業種別に応じた確認コマンド | SENS-016の確認結果、追従更新した説明または不要理由 |
| Responder変更 | 出力整形やInertia propsを整理する | `../../architecture.md` / `../../frontend.md` / `../../testing.md` / 対象feature docs | Repository全体 | Responder / DTO / Page / Test | 業務判断がResponderへ入る | `docker compose exec php-fpm php artisan test` | props責務、表示条件、テスト結果 |
| Service変更 | 業務判断やドメインルールを変更する | `../../architecture.md` / `../../testing.md` / 対象feature docs | UI全体 | Service / Action / DTO / Test | DB直接操作やHTTP都合がServiceへ入る | `docker compose exec php-fpm php artisan test` | 変更した判断、影響範囲、テスト結果 |
| Repository変更 | DBまたは外部データソース境界を変更する | `../../architecture.md` / `../../testing.md` / 対象feature docs | 無関係Component | Repository / Model / Migration / Test | 業務判断や表示判断がRepositoryへ入る | `docker compose exec php-fpm php artisan test` | 取得条件、保存条件、テスト結果 |
| Migration変更 | DBスキーマを変更する | `../../architecture.md` / `../../testing.md` / `../../operations/command-registry.md` / 対象feature docs | 無関係UI | Migration / Model / Repository / Test | rollback方針や本番影響を説明できない | `docker compose exec php-fpm php artisan test` / `docker compose exec php-fpm php artisan migrate:status` | schema変更、rollback観点、Level 4理由 |
| 外部API連携追加 | 外部データ取得、失敗処理、保存境界を追加する | `../../architecture.md` / `../../testing.md` / `../../security.md` / `../../logging.md` / 対象feature docs | 無関係UI | Repository / Service / Action / Job / Command / Test | secrets、quota、失敗時挙動が不明 | `docker compose exec php-fpm php artisan test` | API名、取得データ、error/skipped、secrets扱い |
| Scheduler追加 | 定期実行の入口を追加する | `../../architecture.md` / `../../testing.md` / `../../operations/command-registry.md` / 対象feature docs | 無関係UI | `routes/console.php` / Command / Job / logs / Test | 実行間隔、本番影響、ログ確認先が不明 | `docker compose exec php-fpm php artisan test` / `docker compose exec php-fpm php artisan schedule:list` | Scheduler入口、Command名、確認結果 |
| Queue Job追加 | 非同期処理を追加する | `../../architecture.md` / `../../testing.md` / `../../operations/command-registry.md` / 対象feature docs | 無関係UI | Job / Action / Service / Repository / Test | 再実行、失敗、重複実行の扱いが不明 | `docker compose exec php-fpm php artisan test` | Job責務、失敗時挙動、queue影響 |
| Event / Listener追加 | 発火と副作用の責務を分ける | `../../architecture.md` / `../../testing.md` / 対象feature docs | 無関係UI | Event / Listener / Action / Service / Test | 副作用の責務や順序を説明できない | `docker compose exec php-fpm php artisan test` | Event目的、Listener責務、テスト結果 |
| Notification / Mail追加 | 通知またはメール送信を追加する | `../../architecture.md` / `../../testing.md` / `../../security.md` / 対象feature docs | 無関係UI | Notification / Mail / Action / Service / Test | 宛先、個人情報、再送条件が不明 | `docker compose exec php-fpm php artisan test` | 宛先条件、secret/個人情報確認、テスト結果 |
| Logging追加 | ログ分類、保存先、出力責務を追加する | `../../logging.md` / `../../architecture.md` / 対象feature docs | 無関係UI | logging呼び出し箇所 / Service / Job / Command / Test | error と skipped が曖昧 | `docker compose exec php-fpm php artisan test` | ログ分類、保存先、確認方法 |
| Production運用修正 | 本番影響のある手順や確認を修正する | `../../operations/command-registry.md` / `../../security.md` / 関連運用docs | 無関係featureコード | 運用docs / deploy関連docs | 本番コマンド、rollback、権限が未確認 | command-registry.mdで確認済みの範囲のみ | 本番影響、未確認コマンド、人間判断が必要な点 |
| Docker / nginx / Reverb変更 | 外側環境repoの構成を変更する | 外側repoのAGENTS / root docs / `../../operations/command-registry.md` | Laravel feature全体 | Docker / compose / nginx / Reverb設定 | アプリrepoと外側repoの境界が不明 | `docker compose config` / `docker compose ps` | 対象repo、外側repo差分、確認結果 |
| PRレビューのみ | 差分をレビューし、必要な指摘を出す | `md-router.md` / `../../operations/pr-review-strength.md` / `../../operations/command-registry.md` | レベル外の全量探索 | PR差分 / 直接依存先 / 対応Test | PR本文と差分が一致しない | PR差分とCI結果に応じる | レビュー強度、読んだ範囲、未確認事項 |
| 本番反映後確認 | 反映後の画面、ログ、状態を確認する | `../../operations/command-registry.md` / `../../security.md` / 対象feature docs | 無関係featureコード | 確認docs / logs / status確認 | 本番接続情報や手順が未確認 | 人間が提示した確認経路のみ | 確認したURL/時刻/ログ、未確認範囲 |

## 注意

- 各ケースは長くしすぎない
- 詳細ルールは既存の正本docsへ参照させる
- 存在しない確認コマンドを断定しない
- `../../operations/command-registry.md` にないコマンドを標準扱いしない
