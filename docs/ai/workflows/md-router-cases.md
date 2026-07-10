# MD Router Cases

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-10

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
| docs運用最適化 | AGENTS / docs索引 / MDルーターの導線を整理する | ../../../AGENTS.md / ../../index.md / md-router.md / ../../context-management.md / work-result-feedback-loop.md。AI docsの索引を変える場合だけ ../index.md、実例を変える場合だけ md-router-cases.md、Git / 責務 / PR強度の正本を変える場合だけ各正本 | 無関係feature docs / アプリコード / Docker構成 / CI設定 / ローカル環境固有情報の内容 | AGENTS.md / docs索引 / docs/ai/workflows | ローカル環境固有情報がGit差分に入る、正本を判断できない、アプリコード変更が必要になる | git diff --check / git diff --name-only | 変更した入口、条件付き参照、docs以外を触っていないこと |
| Product Design Guide追加・修正 | IDEA BOARD / MOCK / Coding の境界とCoding前ゲートを整理する | ../../product-design/index.md / ../../index.md / md-router.md / ../../development-flow.md / ../../ui-development-flow.md / ../../templates/idea-board-and-mock-template-policy.md | 無関係feature docs / アプリコード / Backend責務docsの全文 / ローカル環境固有情報の内容 | docs/product-design / docs索引 / MDルーター / 必要なテンプレ導線 | Product Design GuideがADR Pattern、レイヤード、UI責務を上書きする、毎回全文読む運用に戻る、MOCK未確認範囲をCodingで補完してよい内容になる | git diff --check / git diff --name-only | 追加・更新したMD、読むタイミング、読まないタイミング、docs-onlyであること |
| Frontend画面種別選定 | UI作成前に System UI / Graphic Web UI / Graphic Builder UI のどれとして扱うか決める | `../../guides/frontend-screen-types.md` / `../../frontend.md` / `../../ui.md` | 無関係feature docs / Repository / Migration / Docker構成 | docs / Page / Component / hooks / type | 画面種別を決められない、Builder UI実装が必要になる、D&Dで直接JSXや業務データを変更する前提になる | `git diff --check` / UI変更時は作業種別に応じる | 画面種別、責務境界、Builder UIやD&Dを実装しない場合の対象外理由 |
| Sensors台帳追加・修正 | PR前確認、AIレビュー、スクリプト、CI fail候補として育てる検出項目を追加・更新する | `../../index.md` / `../../operations/sensors.md` / `md-router.md` / `md-router-cases.md` / `work-result-feedback-loop.md` / `../../templates/pr-summary.md` | 無関係feature docs / アプリコード / CI実装 / Docker構成 | docs/operations / docs/ai/workflows | CI実装やアプリコード変更が必要になる、既存docsの全文複製になる | `git diff --check` | 追加・修正したSensor、CI fail化しない範囲、Laravel test / npm build未実行理由 |
| React UIだけ修正 | 画面表示、操作、UI状態を修正する | 対象feature / project docs / 対象Page・Component・Hook・Type・Test。責務や共通方針を変える場合だけ関連frontend / UI docs | 無関係feature docs / Backend共通docs / Repository / Migration | Page / Component / Hook / Type / Test | 対象画面の固定仕様を確認できない、propsやDB条件の変更が必要になる | `docker compose run --rm npm npm run build` | UI影響範囲、確認した固定仕様、条件付きで読んだ共通docs、build結果 |
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

## Loop Engineering関連ケース

Loop Engineeringは、実行、確認、修正、再確認、記録、次回改善までを反復可能にする仕組みとして扱います。人間が目的、境界、合格条件を設計し、AIがその内側で反復します。

| ケース | 目的 | 読むMD | 読まないMD | 確認すること | 停止条件 | 記録先 |
|---|---|---|---|---|---|---|
| Loop Engineering運用を追加・修正する | 既存の実運用docsからLoop Engineeringへ自然に辿れるようにする | `md-router.md` / `md-router-cases.md` / `loop-engineering.md` / `work-result-feedback-loop.md` / `../../operations/pr-review-strength.md` / `../../operations/sensors.md` / `../../templates/pr-summary.md` | 無関係feature docs / アプリコード / Docker構成 / CI設定 / Sensors本文の詳細複製 | 必読化していないか、詳細を重複展開していないか、変更対象docsの責務に収まるか | Sensors本文やlogs本文の変更が必要になる、`loop-engineering.md` 本文を書き換えないと成立しない | PR本文 / `../../templates/pr-summary.md` / 必要な対象docs |
| 指示作成ループを使う | 作業前に目的、対象、読むMD、読まないMD、停止条件、確認コマンドを固定する | `md-router.md` / `loop-engineering.md` / `../rules/agent-working-policy.md` / `../../templates/pr-summary.md` | 無関係feature docs / 作業対象外コード / ローカル環境固有情報 | 作業条件が実行前に固定されているか、人間判断が必要な範囲を残しているか | 作業種別、変更対象、停止条件を確定できない | 指示用まとめ / PR本文の確認範囲 / 次スレッド引き継ぎまとめ |
| 実装ループを使う | 目的と責務境界に沿って差分を作り、確認後に必要なら修正して再確認する | `md-router.md` / `loop-engineering.md` / `../rules/responsibility-boundaries.md` / 対象feature docs / 対象テスト方針 | 無関係feature docs / レベル外の全量探索 / 目的外の代替実装 | 差分、責務混在、目的外変更、確認コマンド結果 | 責務配置を固定できない、対象外ファイル変更が必要になる | PR本文 / 対象feature docs / 必要なテストやコメント |
| PR確認ループを使う | PR差分を単発の目視で終えず、レビュー強度に応じて確認、修正、再確認する | `md-router.md` / `loop-engineering.md` / `../../operations/pr-review-strength.md` / `../../operations/sensors.md` / `../../templates/pr-summary.md` | レベル外の全量探索 / 指示用まとめ全文 / 無関係feature docs | 差分、目的外変更、確認コマンド、未実行理由、docs更新要否、該当Sensors、停止条件 | PR本文と差分が一致しない、確認していないSENS IDを書きそうになる | PR本文 / レビューコメント / `../../templates/pr-summary.md` |
| docs更新ループを使う | 実装差分や運用変更とdocsのズレを最小範囲で直す | `md-router.md` / `loop-engineering.md` / `work-result-feedback-loop.md` / `../../index.md` / 対象docs | 無関係feature docs / アプリコード / 正本でない一時メモ | 正本docsの責務、リンク、重複、docs更新要否 | 同じ詳細ルールを複数docsへ全文複製しそうになる | 対象docs / PR本文のdocs更新要否 |
| 失敗再発防止ループを使う | 失敗、確認結果、レビュー観点をdocs / Sensors / logsへ還元するか判断する | `loop-engineering.md` / `work-result-feedback-loop.md` / `../../operations/sensors.md` / `../logs/index.md` / 必要に応じて `../rules/agent-working-policy.md` | Sensors本文の未確定追加 / logs本文の不要な増量 / 無関係feature docs | 一時メモ、PR本文、logs候補、Sensors候補、MD Router候補のどれか | 新Sensor IDやlogs本文追加が別PR判断なしに必要になる | PR本文 / logs候補 / Sensors昇格候補 / MD Router昇格候補 |
| 理解再起動ループを使う | 次回作業者やAIが目的、変更済み内容、未完了、注意点を掴めるようにする | `loop-engineering.md` / `../../context-management.md` / `work-result-feedback-loop.md` / 対象feature docs | 会話ログ全文 / ローカル個人メモ / 無関係feature docs | 次回の現在地、未完了、注意点、読ませるdocs、読ませないdocs | context-management本文を大改修しないと成立しない、未確認事実を正本化しそうになる | 次スレッド引き継ぎまとめ / PR本文 / 必要なfeature docs |

## 注意

- 各ケースは長くしすぎない
- 詳細ルールは既存の正本docsへ参照させる
- 存在しない確認コマンドを断定しない
- `../../operations/command-registry.md` にないコマンドを標準扱いしない
