# DanceShortsRadar

- Status: active
- Scope: DanceShortsRadar
- Last reviewed: 2026-06-20
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

このドキュメントは、DanceShortsRadar固有の入口、取得条件、同期フロー、ランキング表示、テスト固定内容をまとめます。

共通の責務境界は `docs/architecture.md`、共通テスト方針は `docs/testing.md` に従います。

## 外部API Repository

YouTube API Repositoryは、YouTube Data APIとの通信境界を担当します。

- `search.list` の呼び出し
- `videos.list` の呼び出し
- 外部レスポンスからDTOへの変換
- API制約に合わせたリクエスト分割
- `search.list` のHTTP request 1回ごとにAPI連携ログを発火する
- `videos.list` の成功/失敗は `fetchVideoDetails()` / `fetchVideoDetailsResult()` 単位で1件の要約API連携ログに集約する
- 認証・quota・rate limit系のHTTP失敗とYouTube側5xxだけをERRORログへ残す

`videos.list` は、動画IDを50件単位に分割して取得し、結果DTOを集約します。
集約ログには対象動画ID数、API呼び出し回数、成功/失敗回数、取得詳細件数を残し、動画ID一覧、request query全文、response body全文、API key、token は残しません。部分chunk失敗時に同期結果へ反映する失敗対象件数は、ID一覧ではなく件数だけをResult DTOでActionへ返します。

Repositoryは次を判断しません。

- Shortsとして保存するか
- 必須項目を満たすか
- 業務上の同期対象か
- ランキングへ表示するか

## 検索キーワード

検索範囲は `dance_short_search_keywords` の設定で管理します。

- `search_scope`: `standard` / `expanded`
- `max_search_pages`: 取得する最大ページ数
- `active`: 同期対象か

通常同期はactive keywordのpage1を対象にします。

page2同期は、次の条件を満たすkeywordだけを対象にします。

- active
- `search_scope = expanded`
- `max_search_pages >= 2`

Repositoryは対象レコードの取得を担当し、ページ番号と `nextPageToken` の進行はActionが担当します。

## 通常同期

入口:

```text
dance-short:sync
    ↓
SyncDanceShortVideosJob
    ↓
SyncDanceShortVideosAction
```

実行条件:

- `DANCE_SHORT_SYNC_ENABLED` が有効な環境だけで動作する
- 3時間ごとに実行する
- JP / US / KR各3件、合計9キーワードを対象にする
- 1日8回の実行で `search.list` は最大72回/日に収める

通常同期は、active keyword全件のpage1を検索します。

## page2同期

入口:

```text
dance-short:sync-page2
    ↓
SyncDanceShortPage2VideosJob
    ↓
SyncDanceShortPage2VideosAction
```

実行条件:

- 06:30 / 18:30 の1日2回
- 通常同期の `0 */3 * * *` と重ならない
- `DANCE_SHORT_SYNC_ENABLED` gateを維持する
- `withoutOverlapping()` を維持する

page2 Actionは、expanded keywordのpage2以降の動画ID収集を担当します。

動画詳細取得後は、通常同期と同じ保存処理へ委譲します。

- `PersistDanceShortVideoDetailsAction`
- Shorts判定
- 必須項目判定
- video upsert
- snapshot作成
- cleanup

page2同期でも検索順は通常同期と同じ `relevance` を使い、`order=date` や `order=viewCount` は導入しません。

## snapshot専用同期

入口:

```text
dance-short:sync-snapshots
    ↓
SyncDanceShortVideoSnapshotsJob
    ↓
RefreshDanceShortVideoSnapshotsAction
```

実行条件:

- `DANCE_SHORT_SYNC_ENABLED` が有効な環境だけで動作する
- `15,45 * * * *` により毎時15分・45分に実行する
- Schedulerの `withoutOverlapping()` を維持する
- Jobは `ShouldBeUnique` と固定値 `dance-short-video-snapshots-refresh` により、snapshot専用同期全体の同時実行を防ぐ
- Jobのunique lockは1800秒とする

snapshot専用同期は、保存済み動画の継続観測だけを担当します。

- `search.list` は呼ばない
- tracking statusがactiveの保存済みvideo-region関係だけを対象にする
- activeの意味判断はServiceが行い、Repositoryは渡されたtracking status条件で取得する
- snapshot専用同期Actionは対象動画ID一覧を `fetchVideoDetailsResult()` へ渡し、`videos.list` の50件単位分割、ログ集約、chunk失敗件数の集計はRepositoryに任せる
- 1回の最大対象件数は `snapshot_refresh.max_videos_per_run` で管理し、現在の初期値は8000件とする
- snapshotはJSTの `00:00-11:59` / `12:00-23:59` の12時間枠で扱う
- 同じ12時間枠に既存snapshotがある場合は最新レコードを更新し、ない場合は新規作成する
- `collected_at` とRepositoryへ渡す期間境界はアプリ標準 timezone（JST / Asia/Tokyo）で扱う

## ランキング表示

ランキング表示はStrategy / Factoryで取得差分を選択します。

主な区分:

- `RISING`
- `ALL`
- 地域別ランキング

表示時のランキングは snapshot 履歴から再計算しません。通常同期、page2同期、snapshot専用同期の完了後に `DanceShortRankingReadModelRefreshRequested` を発火し、Listener が固定 uniqueId の `BuildDanceShortRankingReadModelsJob` をdispatchします。Job は `BuildDanceShortRankingReadModelsAction` を呼び、read model build を一括生成します。

read model 生成は `build_id` 単位で行います。新しい build の全patternが生成できた後に active build を切り替え、旧buildのrowsを削除します。生成途中で失敗した場合は旧active buildを維持し、表示は直前のread modelを読み続けます。

生成対象:

- 通常ランキング: `ALL` と active region 全件を対象に、許可された比較日数 x sort key 全patternを生成する
- `RISING`: 許可された比較日数ごとに生成し、`sort_key` は `null` に固定する

表示側 Repository は active build の read model row から window / selected video rank / total count を取得するだけです。window切り出しや選択カード前後の調整はStrategyと `DanceShortDisplayCardWindowService` が担当します。

### RISING / 上昇候補の責務境界

RISING は `dance_short_regions` の地域ではなく、表示専用タブです。

上昇候補は、US / KR などの source region 側で伸びていて、JP 側が未観測または source 側より伸びが小さい動画を継続観測候補として扱うための区分です。

read model 生成側の Repository / Strategy は RISING タブ用の source / JP / previous snapshot をDB上で結合し、read model row へ prefilter します。

Repositoryが扱うこと:

- active動画、active region、最新snapshot、previous snapshot のDB取得条件
- source region を US / KR に限定する条件
- source側の増加量が正である候補行への prefilter
- JP側が未観測、またはJP側の増加量がsource側より小さい候補行への prefilter
- 同じYouTube動画が複数source regionに出た場合の代表行選択
- RISING固有の固定順で read model row を生成するための候補取得

Repositoryが扱わないこと:

- 上昇候補の業務上の意味づけ
- JP比較状態の値や意味の定義
- 表示ラベル、観測メモ、空状態文言
- Inertia / React props生成
- 選択カード前後のwindow切り出し

Service は上昇候補の意味と JP比較状態を定義します。

`DanceShortRisingCandidateService::japanComparisonStatusForCandidate()` は、source側の増加量、JP current snapshot の有無、JP側の増加量から次の状態を返します。

- `unobserved`: source側は増加していて、JP側の current snapshot がない
- `smaller_delta`: source側は増加していて、JP側の増加量がsource側より小さい
- `null`: source側が増加していない、source deltaを算出できない、またはJP側の比較deltaを算出できない

Service は null metric を 0 へ潰しません。`view_count_delta`、`view_growth_rate`、`views_per_hour` の null は「算出不可」として保持し、0とは区別します。

Strategy は Repository row を表示カード用DTOへ詰め替えます。JP比較状態の値は Service の状態定義を使い、Strategy自身では `unobserved` や `smaller_delta` の意味を定義しません。

window切り出しは `DanceShortDisplayCardWindowService` へ委譲します。選択カードがない通常windowでは active read model のlookahead行から表示分と pagination を作り、選択カードがある場合は read model 上の順位から選択カード前後の最大5件を切り出します。

Responder は確定済みDTOを Inertia / React 用の snake_case props と表示ラベルへ変換します。候補判定、JP比較状態の再定義、metric再計算は行いません。

DTO は比較済みの値を運ぶデータキャリアです。DB取得、上昇候補判定、Inertia props生成、表示文言生成は持ちません。

`selectedVideoId` が指定されたdisplay-card-windowでは、次の順序で処理します。

1. 選択中タブ、比較日数、並び順でランキング全体順を確定する
2. 選択カードの順位を特定する
3. 選択カードの前後を含む最大5件を `DanceShortDisplayCardWindowService` で切り出す

Repositoryはランキング全体のread model取得を担当し、選択カード探索やwindow表示判断は行いません。

## テストで固定する仕様

### Migration / Enum / Seeder

- `search_scope` と `max_search_pages` が追加カラムとして存在する
- enum値は `standard` / `expanded` から変わらない
- Seederは3件を `expanded / 2`、残り6件を `standard / 1` とする

### YouTube API Repository

- `videos.list` のIDは50件単位に分割する
- 重複ID・空IDを送らない
- 空配列の場合はHTTP通信しない
- `nextPageToken` と `pageToken` を扱える

### keyword Repository

page2同期対象として、次だけを取得します。

- active
- expanded
- `max_search_pages >= 2`

inactive、standard、1ページ設定は除外します。

### 通常同期Action

- active keyword全件のpage1だけを検索する
- 保存判断・Shorts判定をRepositoryへ置かない

### page2 Action

- page1からtokenを取得する
- expanded keywordのpage2以降だけを候補にする
- `max_search_pages` を超えない
- 動画IDの重複を除外する
- 共通保存処理へ正しく渡す

### snapshot専用同期Action

- tracking statusがactiveの保存済み動画だけを対象にする
- `search.list` を呼ばず、`videos.list` だけを呼ぶ
- 動画ID一覧を `fetchVideoDetailsResult()` へ1回渡し、Repository内で50件単位に分割する
- `videos.list` の一部chunk失敗は、正常chunkで詳細が返らない動画とは区別し、Repositoryから渡された失敗対象件数だけを `failedCount` へ反映する
- `videos.list` 成功ログがchunk数ぶん出ず、処理単位の要約ログに集約される
- 取得対象が空の場合は外部API通信しない
- view countがない動画はsnapshot保存をskipする
- JST12時間枠をServiceで決定する
- 同じ枠では最新snapshotを更新し、存在しない場合だけ作成する
- activeの意味判断をRepositoryへ置かない

### Artisan Command / Job

- `dance-short:sync-page2` のArtisan CommandはJobをdispatchするだけで、同期本体を直接実行しない
- page2 Jobは `SyncDanceShortPage2VideosAction` を呼ぶ
- page2 Jobは通常同期Jobと同じtimeout / triesを持つ
- `dance-short:sync-snapshots` のArtisan Commandはsnapshot専用Jobをdispatchするだけで、同期本体を直接実行しない
- snapshot専用Jobは `RefreshDanceShortVideoSnapshotsAction` を呼ぶ
- snapshot専用Jobは固定uniqueIdで同期全体の同時実行を防ぐ

### Scheduler

- `DANCE_SHORT_SYNC_ENABLED=true` の場合だけ通常同期・page2同期・snapshot専用同期をdispatchする
- falseの場合は同期Jobをdispatchしない
- page2 Artisan Commandとsnapshot専用Artisan Commandは通常同期と別名にする
- 各同期入口は `withoutOverlapping()` とenv gateを持つ
- snapshot専用同期は毎時15分・45分に実行し、通常同期の00分とpage2同期の30分を避ける

### ランキング

- Strategyごとの取得条件
- comparisonDays / sort条件
- 同期完了後に read model refresh event が発火し、Listener が ranking read model build Job をdispatchする
- build Job は固定uniqueIdで同時生成を防ぐ
- read model は `ALL` + active region の全comparisonDays / sortKey pattern と、`RISING` のcomparisonDays patternを生成する
- read model 生成成功時だけ active build を切り替え、失敗時は旧active buildを維持する
- 表示は active read model から取得し、snapshot履歴削除後も直前のranking cardを返せる
- `selectedVideoId` を基準にした全体順位
- 最大5件のdisplay-card-window
- RISING 生成側 Repository / Strategy はsource / JP / previous snapshot をDB上で結合し、read model row へ prefilterする
- RISING Repositoryは上昇候補の意味づけ、JP比較状態、表示文言、Inertia props生成を持たない
- `DanceShortRisingCandidateService::japanComparisonStatusForCandidate()` がJP比較状態を定義する
- Serviceは null metric を0へ潰さない
- StrategyはRepository rowをDTOへ詰め替え、JP比較状態はServiceの定義を使う
- window切り出しは `DanceShortDisplayCardWindowService` へ委譲する
- Responderは確定済みDTOをsnake_case propsと表示ラベルへ変換する
- DTOは比較済みの値を運ぶデータキャリアに留める

## 変更時の確認

この機能を変更する場合は、最低限次を確認します。

- API quotaへ影響しないか
- API連携ログへAPI key、Authorization、response body全文を保存していないか
- YouTube HTTP 400 / 404 などを不用意にERRORログ対象へ広げていないか
- 通常同期・page2同期・snapshot専用同期の役割が混ざっていないか
- Repositoryへ保存判断・表示判断・tracking statusの意味判断が入っていないか
- 表示Action/APIがsnapshot履歴からランキングを再計算していないか
- read model 生成失敗時に旧active buildを消していないか
- RISING 生成側 Repository / Strategyへ上昇候補の意味定義、JP比較状態、表示文言、Inertia props生成が入っていないか
- RISING Serviceが上昇候補の意味、JP比較状態、null metricの扱いを持っているか
- RISING StrategyがDTO詰め替えとwindow取得委譲に留まり、JP比較状態の意味定義を持っていないか
- RISING Responderがprops変換と表示ラベル生成に留まり、候補判定やmetric再計算をしていないか
- RISING DTOがデータキャリアに留まり、DB取得、候補判定、props生成、表示文言生成を持っていないか
- 共通保存処理を重複実装していないか
- Schedulerの実行時刻が競合しないか
- snapshot・ranking・window表示の既存テストを壊していないか
- この文書と現在のコード・テストが一致しているか
