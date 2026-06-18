# Application Logs

- Status: active
- Scope: Project Hub logs
- Last reviewed: 2026-06-18
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

Project Hub の `logs` 入口、API連携ログとERRORログのDB保存、表示、対応済み管理の仕様をまとめます。

共通責務は `docs/architecture.md`、共通ログ方針は `docs/logging.md`、共通テスト方針は `docs/testing.md` に従います。

## 機能概要

`logs` は Project選択画面の独立した選択肢です。

`/projects/logs` では、同じ表示Field内に次の2タブを置きます。

- API
- ERROR

APIタブは `application_integration_logs` を表示します。

ERRORタブは `application_error_logs` を表示します。

どちらも一覧表は「時間」「内容」の2列に留め、詳細分析用の多列管理表にはしません。

logs閲覧は公開ポートフォリオ上の確認画面として扱い、ログイン機能は追加しません。

## 保存先

保存先は用途ごとに分けます。

- API連携ログ: `application_integration_logs`
- ERRORログ: `application_error_logs`

API連携ログには対応済み概念を持たせません。

ERRORログだけ、未対応ログを対応済みにできます。対応済み時は `resolved_at` と `resolved_by` を保存します。対応済み解除はPR1では扱いません。

ERRORログの対応済み操作は、ERROR行クリック後の詳細モーダル内で行います。モーダル内の confirmation 入力が `config/application_logs.php` の `resolve_confirmation_keyword` と一致した場合だけPOSTします。

現在の confirmation keyword は `resolve` です。この値は秘密情報ではなく、公開ポートフォリオ上の軽い誤操作防止用です。認証・認可・管理者確認としては扱いません。

confirmation keyword はENVへ置かず、`config/application_logs.php` に固定します。入力された confirmation はDB保存せず、アプリログにも記録しません。

## 保存フロー

API連携ログ:

```text
ApplicationIntegrationLogged
    ↓
StoreApplicationIntegrationLogListener
    ↓
ApplicationIntegrationLogRepository
    ↓
application_integration_logs
```

ERRORログ:

```text
ApplicationErrorOccurred
    ↓
StoreApplicationErrorLogListener
    ↓
ApplicationErrorLogRepository
    ↓
application_error_logs
```

Eventは発生した事実だけを表し、DB保存やUI都合を持ちません。

ListenerはEventをDTOへ移し、Repository経由でDB登録する副作用だけを担当します。

## 保存しない情報

次はDBへ保存しません。

- request payload全文
- response body全文
- API key
- token
- cookie
- session
- 個人情報
- stack trace全文

message、url、file は `ApplicationLogSanitizerService` で安全な範囲へ整形してから保存します。

## 表示

`ProjectLogsResponder` は `Projects/Hub` へ `applicationLogs` propsを渡します。

React側は `ProjectLogsField` でタブ切り替え、2列表、empty状態、ERROR対応済み操作を扱います。

ComponentはDB取得、保存可否判断、権限判断を持ちません。

ERRORタブでは行クリックで詳細モーダルを開きます。APIタブの行クリックでは対応済みモーダルを出しません。

## テストで固定する仕様

- Eventが発生事実だけを持つ
- ListenerがRepository経由でDB保存する
- level / statusの許可値をServiceで判定する
- secret、payload、token、cookie、session、stack trace全文を保存しない
- API連携ログとERRORログを別テーブルに保存する
- API連携ログに対応済み概念を持たせない
- ERRORログだけ confirmation keyword 一致時に対応済みにできる
- confirmationなし、不一致ではERRORログを対応済みにできない
- confirmation入力値を保存しない
- `/projects/logs` にAPI / ERRORタブと分離された行を渡す
- ERROR内容に file:line を含める
- React側の表は「時間」「内容」の2列で表示する
- ERROR行クリックで詳細モーダルを表示する

## 変更時の確認

- API連携ログとERRORログの保存先を混ぜていないか
- Listenerへユースケース本体を隠していないか
- Repositoryへ業務判断や表示判断を置いていないか
- Responderへ業務判断を置いていないか
- ComponentへDB操作や状態遷移可否判断を置いていないか
- confirmation を認証・認可・秘密情報として扱っていないか
- confirmation 入力値を保存、ログ出力していないか
- 表示を多列管理表へ広げていないか
- Reverb / Broadcasting / Echo / Slack / メール通知を混ぜていないか
- Docker / nginx / queue / scheduler / 親Git側へ差分を出していないか
