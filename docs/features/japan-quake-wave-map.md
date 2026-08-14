# Japan Quake Wave Map

- Status: active
- Scope: Japan Quake Wave Map
- Last reviewed: 2026-08-14
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

Japan Quake Wave Map固有のAtom feed取得、XML解析、保存、map pin生成、status API、テスト固定内容をまとめます。

共通責務は `docs/architecture.md`、共通テスト方針は `docs/testing.md` に従います。

## 機能概要

気象庁の地震火山情報Atom feedと個別XMLを取得し、地震情報を保存・解析・地図表示する機能です。

主な処理:

```text
Atom feed取得
    ↓
feed entry抽出
    ↓
保存済みentryの最新updated_at_from_feedを境界に差分選別
    ↓
entry保存・更新・重複回避
    ↓
insert / updateされたentry IDだけ個別XML取得
    ↓
震源・震度等を抽出
    ↓
map pin生成条件を判定
    ↓
保存・status更新
    ↓
一時失敗IDだけを有限回数でQueue retry
```

## feed entry

主な仕様:

- Atom feedからentryを抽出する
- `entry_id` を識別子として扱う
- 保存済みentryの有効な `updated_at_from_feed` 最大値を差分境界にする
- 境界時刻と同時刻のentryを含め、境界以後のentryだけをinsert / update / skip判定へ渡す
- `updated` が欠落・空・解釈不能なentryは取りこぼし防止のため差分対象に残す
- 有効な境界が存在しない場合は、抽出済みentry全件を安全に判定する
- insert / update / skipを分ける
- 同じentryを重複保存しない
- insert / updateされた保存済みentry IDだけを個別XML・map pin段階へ渡す
- 1 feed内の保存はatomicにし、一部entry失敗時に新しいcutoffだけが保存される状態を残さない
- insert / updateが0件なら、個別XML取得とmap pin生成を実行せず両runを完了扱いにする
- 取得失敗・解析失敗を成功扱いしない
- 気象庁XML feed取得は単発取得としてAPI連携ログを発火し、map pin生成run内の個別XML取得は成功・skipped・failed分類ごとにAPI連携ログを集約する
- 取得先エラーのログは、本文全文ではなく「XMLファイルが見つからない」「取得先サーバー障害」などの短い理由を付ける

Repositoryは取得・保存を担当し、差分や処理結果の意味づけはService / Action側へ置きます。

## 個別XML解析

個別XMLから取得する主な情報:

- 震源座標
- 最大震度
- マグニチュード
- 深さ
- 発生日時
- 対象地域等の表示情報

長いXML fixtureは必要に応じて `tests/Fixtures` へ分離します。

## map pin生成条件

map pinは、少なくとも次を満たすデータだけを対象にします。

- 緯度がある
- 経度がある
- 最大震度がある

対象外:

- 震度なし
- 座標なし
- map pinとして表示できない不完全データ

Serviceがpin生成可否を判断し、Repositoryは保存・更新・取得を担当します。

地図ピン対象外のXMLはERRORログに入れず、map pin同期結果の skippedCount に反映します。

ERRORとして扱うもの:

- 個別XML取得失敗
- XML構文破損
- 想定している地震XMLなのに解析不能

skippedとして扱うもの:

- 気象庁XML電文だが地図ピン情報がない
- 座標がない
- 最大震度がない
- 震源・震度系ではない電文

差分更新されたentryがXML URLなし、または地図ピン対象外になった場合は、同じ `source_entry_id` の古いpinを削除します。個別XMLの一時的な取得失敗・解析失敗では既存pinを削除しません。

限定retryの分類:

- retryable: HTTP 429、5xx、connection / DNS / TLS / timeout、404、空body、XML parse failure
- terminal skipped: XML URLなし、JMA以外のURL、正常解析後のnot-mappable
- terminal failed: 上記以外のHTTP error

retryableなentry IDはpublic status APIへ出さず、既存 `SyncEarthquakeMapPinsJob` のpayloadだけに保持します。1回目を60秒後、2回目を180秒後に対象IDだけ再処理し、成功済みやterminal対象は再取得しません。

## Job・処理状態

Jobでは同期処理を実行し、成功・失敗・部分失敗を区別します。

状態管理では、feed処理とmap pin処理を同一の成功扱いにまとめません。

例:

- feed completed
- map pin completed
- map pin failed
- partial failure

JobへXML解析や業務判断本体を詰め込まず、Action / Serviceへ委譲します。

Schedulerと画面の手動更新は同じ統合Jobを投入します。統合Jobには共有の重複実行防止キーを設定し、同時に実行される統合更新は1件だけにします。重なったJobは破棄せず30秒後に再試行し、重複待機のattempt回数では失敗させません。統合処理本体で例外が発生した場合は1回でfailedにします。

限定retry Jobも同じ共有キーを使い、Scheduler・手動更新・retry間で個別XML処理を同時実行しません。Queueの再配送はJob timeout後になるよう、Redis / database connectionの `retry_after` 既定値は720秒、Job timeoutは統合600秒・map pin 300秒とします。runtimeでenv overrideする場合も `retry_after` を対象Job timeoutより大きく保ちます。

## Artisan Command / Scheduler

`earthquake:refresh-map` は Japan Quake Wave Map の統合更新を開始する Artisan Command です。

Command は `StartEarthquakeMapRefreshAction` を呼び、feed entry 同期runと map pin 生成runのIDを表示します。XML取得、XML解析、DB保存、map pin生成本体は Command へ置かず、既存Action / Job / Service / Repositoryへ委譲します。

Scheduler では `earthquake-map-refresh` として `earthquake:refresh-map` を3分ごとに登録します。

Scheduler は3分ごとにCommandを呼ぶ入口だけを担当し、`EarthquakeFeedEntrySyncService` や `EarthquakeMapPinBuildService` を直接呼びません。

## PRODUCT画面

`/quakewave-preview/map` は通常利用を優先し、PRODUCT画面だけ次を適用します。

- 動的な共通背景effectを無効にし、静的な水色系gradient背景を使う
- 説明用の大見出し・DB説明文・更新アコーディオン・内部処理説明を表示しない
- 更新操作は通常時 `更新`、処理中 `更新中` のボタンと、必要最小限のエラー表示にする
- 選択した地震の詳細はmapと同じカード内の直下に表示し、その後に日付、震度、レイヤー、更新を配置する
- 開始日・終了日はスマホ幅を含め横並びにする
- 表示件数sliderはnative rangeの縦方向機能を使い、回転transformへ依存しない

地図pin、震度波紋、震度filter、日付filter、表示件数、詳細表示、Google Maps導線、既存status APIとQueue連携は維持します。MOCK / Lab / 共通背景の既存表示はPRODUCT専用指定の対象外です。

## status API

status APIは、画面が必要とするJSON shapeへ整形します。

確認対象:

- status
- 処理件数
- 成功・失敗情報
- 必要な日時
- errorの公開範囲

技術的な例外や秘密情報をそのまま返しません。

## Request

Request validationで固定する主な内容:

- 日付範囲
- limit
- 型
- 必須・任意
- 境界値
- 不正値

フロント側の入力確認だけで完結しません。

## テストで固定する仕様

### Feed / XML

- 気象庁XML Atom feedの取得・抽出
- 個別XMLの取得・解析
- entry_idによる重複回避
- insert / update / skip
- 境界時刻を含む差分選別
- `updated` 欠落・不正entryの安全な取込
- 差分0件時に個別XML・map pin生成を実行しない
- 解析対象外データ

### map pin

- 緯度・経度・最大震度がある場合だけ生成する
- 震度なしをpin化しない
- 座標なしをpin化しない
- 地図ピン対象外XMLをERRORログへ入れず skipped として数える
- XML取得失敗とXML構文破損はERRORログへ残す
- 保存・更新・重複回避
- insert / updateされたentry IDだけを後段処理する
- 更新後に地図対象外となったentryの古いpinを削除する
- 一時失敗したentryだけを有限retryし、成功済み・terminal対象を再取得しない

### Job / Action

- success
- failure
- partial failure
- feed completed / map pin failed等の状態管理
- 再実行時の安全性
- Schedulerと手動更新が重なっても統合Jobを同時実行しない
- retry Jobも統合Jobと同じlockを使い、最大2回のbackoffで終端状態になる
- `earthquake:refresh-map` が既存の統合更新Actionを呼び、Queue経由で一括更新Jobを投入する
- Scheduler の `earthquake-map-refresh` が3分ごとに `earthquake:refresh-map` を呼ぶ

### API / Request

- status APIのJSON shape
- Request validation
- 日付範囲
- limit
- 異常時のresponse

## 変更時の確認

- XML解析をControllerやJobへ直接書いていないか
- Repositoryへpin生成判断が入っていないか
- 震度なし・座標なしを誤ってpin化していないか
- feed成功とpin失敗を全成功として扱っていないか
- 外部XML全文や個人情報をログへ残していないか
- 気象庁XML取得ログにXML本文全文やsecret queryが混ざっていないか
- status APIのshapeを壊していないか
- この文書と現在のコード・テストが一致しているか
