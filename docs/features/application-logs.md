# Application Logs

- Status: active
- Scope: Project Hub logs
- Last reviewed: 2026-06-19
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

Project Hub の `logs` 入口、API連携ログとエラーログのDB保存、表示、対応済み管理の仕様をまとめます。

共通責務は `docs/architecture.md`、共通ログ方針は `docs/logging.md`、共通テスト方針は `docs/testing.md` に従います。

## 機能概要

`logs` は Project選択画面の独立した選択肢です。

`/projects/logs` では、同じ表示Field内に次の2タブを置きます。

- API連携
- エラー

APIタブは `application_integration_logs` を表示します。

エラータブは `application_error_logs` を表示します。

どちらも一覧表は「時間」「内容」の2列に留め、詳細分析用の多列管理表にはしません。

logs閲覧は公開ポートフォリオ上の確認画面として扱い、ログイン機能は追加しません。

## 保存先

保存先は用途ごとに分けます。

- API連携ログ: `application_integration_logs`
- エラーログ: `application_error_logs`

API連携ログには対応済み概念を持たせません。

エラーログだけ、未対応ログを対応済みにできます。対応済み時は `resolved_at` と `resolved_by` を保存します。対応済み解除はPR1では扱いません。

エラーログの対応済み操作は、エラー行クリック後の詳細モーダル内で行います。モーダル内の confirmation 入力が `config/application_logs.php` の `resolve_confirmation_keyword` と一致した場合だけPOSTします。

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

エラーログ:

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

## 接続済みの外部APIログ発火

既存API連携へ接続済みのAPI連携ログは、単発の外部API呼び出しでは1件の結果ログとして保存します。Job / Action / Service の同一実行単位で同じ意味の成功、skipped、想定内404、同種失敗が繰り返される場合は、個別対象ごとに保存せず、分類・件数・少数の代表URLが分かる要約ログへ集約します。

YouTube Data API `videos.list` は最大50件単位のchunk呼び出しを内部で行うため、成功ログはchunkごとに保存せず、`fetchVideoDetails()` / `fetchVideoDetailsResult()` の処理単位で1件の要約ログに集約します。要約には対象動画ID数、API呼び出し回数、成功/失敗回数、取得詳細件数を含め、動画ID一覧、request query全文、response body全文、API key、token は保存しません。同じ `videos.list` 処理内でchunk失敗が複数回起きた場合、ERRORログもHTTP分類ごとの要約に集約します。

気象庁XMLの個別XML取得は map pin 生成run内で多数発生するため、URLごとの成功・想定内404・空body・対象外URLを個別保存せず、成功 / skipped分類 / failed分類ごとのAPI連携ログに集約します。代表URLは少数に制限し、XML本文やURL一覧を大量にDB保存しません。

接続済みの外部APIログ対象:

- 気象庁XML 高頻度フィード取得
- 気象庁XML 個別XML取得
- YouTube Data API `search.list`
- YouTube Data API `videos.list`
- APIs.guru `list.json`

API連携ログは成功・失敗の両方を保存します。表示文は日本語で短くし、成功時は完了、失敗時は接続不可、取得先エラー、空レスポンス、JSON/XML解析不可などの理由が分かる文にします。HTTP status はDBへ保存しますが、通常の一覧文には出しません。

エラーログは、XML / JSON parse失敗、API key未設定、APIs.guru同期継続不能など、調査が必要な失敗に限定します。YouTube Data API のHTTP失敗は 401 / 403 / 429 と 5xx をERRORログ対象にし、400 / 404 などの通常のクライアント失敗までは広げません。気象庁XMLの個別XML取得失敗やXML構文破損はERRORログ対象にしますが、地図ピンに必要な座標や最大震度がないだけのXMLはERRORではなく skipped として同期結果へ反映します。例外がある失敗では、詳細で見直しに使える file:line も表示します。

## ログ発火箇所の棚卸し

2026-06-26 時点の棚卸し結果です。今回のPRは、全ログ基盤を作り直すものではなく、同じ実行内で大量に並びやすい気象庁XMLの map pin 生成runと YouTube Data API `videos.list` chunk処理を集約対象にします。

### ApplicationIntegrationLogged 発火箇所

- `app/Repositories/ApiCatalog/ApisGuruRepository.php`
  - APIs.guru `list.json` の単発取得結果を保存します。
  - 今回は維持します。1同期につき外部取得1回で、対象ごとの大量成功/skippedログではないためです。
- `app/Repositories/DanceShortsRadar/YouTubeVideoApiRepository.php`
  - YouTube Data API `search.list` は単発取得として維持します。
  - YouTube Data API `videos.list` は処理単位のAPI連携ログ1件に集約する既存方針を維持し、今回のPRではchunk失敗ERRORの集約を追加します。
- `app/Repositories/Earthquake/JmaEarthquakeXmlRepository.php`
  - 気象庁XMLの高頻度フィード取得は単発取得として維持します。
  - Preview用の個別XML取得は画面操作単位の単発取得として維持します。map pin 生成runの大量取得経路とは別のためです。
- `app/Services/ApplicationLog/ApplicationLogSummaryCollector.php`
  - 今回追加した集約Event発火箇所です。
  - `EarthquakeMapPinBuildService` から気象庁XMLの個別XML取得結果を成功 / skipped分類 / failed分類ごとにflushします。

### ApplicationErrorOccurred 発火箇所

- `app/Repositories/ApiCatalog/ApisGuruRepository.php`
  - APIs.guru取得失敗、JSON形式不正などをERRORとして保存します。
  - 今回は維持します。単発API取得の調査対象で、大量に同一ERRORが並ぶ経路ではないためです。
- `app/Repositories/DanceShortsRadar/YouTubeVideoApiRepository.php`
  - API key未設定、transport失敗、認証/quota/rate limit、YouTube側5xx、JSON形式不正をERRORとして保存します。
  - 今回は `videos.list` chunk処理内の同種ERRORだけを `ApplicationLogSummaryCollector` 経由で集約し、`search.list` の単発ERRORは維持します。
- `app/Services/Earthquake/EarthquakeFeedEntrySyncService.php`
  - 気象庁XML feedの解析失敗をERRORとして保存します。
  - 今回は維持します。feed同期run単位の異常で、個別対象ごとの大量ログではないためです。
- `app/Services/Earthquake/EarthquakeMapPinBuildService.php`
  - 個別XML取得失敗、通信失敗、429、5xx、XML構文破損などをERRORとして保存します。
  - 同一run内の同種失敗は既存の分類別要約を維持します。今回のPRでは同じrunのAPI連携ログ側も集約します。
- `app/Services/Earthquake/EarthquakeXmlPreviewService.php`
  - Preview画面でのXML解析失敗をERRORとして保存します。
  - 今回は維持します。ユーザー操作/確認単位の単発失敗で、map pin 生成runの大量ログとは別経路のためです。
- `app/Services/ApplicationLog/ApplicationLogSummaryCollector.php`
  - 今回追加した集約Event発火箇所です。
  - YouTube Data API `videos.list` chunk処理内の同種ERRORを分類ごとにflushします。

### 今回集約対象にしたもの

- 気象庁XML map pin 生成run内の個別XML取得API連携ログ
  - 成功
  - skipped: 想定内404、空body、対象外URL
  - failed: 429、5xx、通信失敗、その他HTTP失敗
- YouTube Data API `videos.list` chunk処理内の同種ERRORログ
  - transport失敗
  - 401 / 403 / 429
  - 5xx
  - JSON形式不正

### 今回維持したもの

- API連携ログとERRORログの保存責務
  - Event: 発生事実
  - Listener: 保存副作用
  - Repository: DB登録
- APIs.guru `list.json` の単発API連携ログとERRORログ
- YouTube Data API `search.list` の単発API連携ログとERRORログ
- YouTube Data API `videos.list` の処理単位API連携ログ
- 気象庁XMLの高頻度フィード取得ログ
- 気象庁XML Preview用の個別XML取得ログ
- 気象庁XML feed解析失敗、個別XML解析失敗、429、5xx、通信失敗など、人間が見るべきERRORログ

### 今回対象外にしたものと理由

- DBカラム追加 / Migration
  - 既存カラムの message、status、response_status、url で件数・分類・代表URLを表現できるためです。
- ログUI / React / TypeScript
  - 表示仕様ではなく保存粒度の整理が目的で、既存の2タブ表示で確認できるためです。
- Docker / nginx / queue / scheduler / 通知機能
  - ログ発火粒度とは別の実行基盤・運用通知の変更になるためです。
- 個別XML再取得抑制
  - ログ粒度整理ではなくデータ取得仕様の変更になるためです。
- APIs.guru と YouTube `search.list` の集約化
  - どちらも単発API取得で、同一run内に対象ごとの大量ログを作る経路ではないためです。
- 気象庁XMLの高頻度フィード取得とPreview用個別XML取得の集約化
  - 単発取得または画面確認単位のログで、map pin 生成runの大量個別XML取得とは性質が違うためです。
- `EarthquakeFeedEntrySyncService` / `EarthquakeXmlPreviewService` のERROR追加集約
  - 既にrun/画面確認単位の異常であり、今回の大量ログ問題の主経路ではないためです。

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

React側は `ProjectLogsField` でタブ切り替え、2列表、empty状態、エラー対応済み操作を扱います。

ComponentはDB取得、保存可否判断、権限判断を持ちません。

エラータブでは行クリックで詳細モーダルを開きます。APIタブの行クリックでは対応済みモーダルを出しません。

## テストで固定する仕様

- Eventが発生事実だけを持つ
- ListenerがRepository経由でDB保存する
- level / statusの許可値をServiceで判定する
- secret、payload、token、cookie、session、stack trace全文を保存しない
- API連携ログとエラーログを別テーブルに保存する
- API連携ログに対応済み概念を持たせない
- エラーログだけ confirmation keyword 一致時に対応済みにできる
- confirmationなし、不一致ではエラーログを対応済みにできない
- confirmation入力値を保存しない
- `/projects/logs` にAPI連携 / エラータブと分離された行を渡す
- エラー内容に file:line を含める
- React側の表は「時間」「内容」の2列で表示する
- エラー行クリックで詳細モーダルを表示する

## 変更時の確認

- API連携ログとエラーログの保存先を混ぜていないか
- Listenerへユースケース本体を隠していないか
- Repositoryへ業務判断や表示判断を置いていないか
- Responderへ業務判断を置いていないか
- ComponentへDB操作や状態遷移可否判断を置いていないか
- confirmation を認証・認可・秘密情報として扱っていないか
- confirmation 入力値を保存、ログ出力していないか
- 表示を多列管理表へ広げていないか
- Reverb / Broadcasting / Echo / Slack / メール通知を混ぜていないか
- Docker / nginx / queue / scheduler / 親Git側へ差分を出していないか
