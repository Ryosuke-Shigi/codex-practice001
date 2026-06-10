# DanceShortsRadar

- Status: active
- Scope: DanceShortsRadar
- Last reviewed: 2026-06-10
- Canonical source: current code, migrations, configuration, and successful tests

## このドキュメントの目的

このドキュメントは、DanceShortsRadar固有の入口、取得条件、同期フロー、ランキング表示、テスト固定内容をまとめます。

共通の責務境界は `docs/architecture.md`、共通テスト方針は `docs/testing.md` に従います。

## 外部API Repository

YouTube API Repositoryは、YouTube Data APIとの通信境界を担当します。

- `search.list` の呼び出し
- `videos.list` の呼び出し
- 外部レスポンスからDTOへの変換
- API制約に合わせたリクエスト分割

`videos.list` は、動画IDを50件単位に分割して取得し、結果DTOを集約します。

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

## ランキング表示

ランキング表示はStrategy / Factoryで取得差分を選択します。

主な区分:

- `RISING`
- `ALL`
- 地域別ランキング

`selectedVideoId` が指定されたdisplay-card-windowでは、次の順序で処理します。

1. 選択中タブ、比較日数、並び順でランキング全体順を確定する
2. 選択カードの順位を特定する
3. 選択カードの前後を含む最大5件をServiceで切り出す

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

### Command / Job

- `dance-short:sync-page2` はJobをdispatchするだけで、同期本体を直接実行しない
- page2 Jobは `SyncDanceShortPage2VideosAction` を呼ぶ
- page2 Jobは通常同期Jobと同じtimeout / triesを持つ

### Scheduler

- `DANCE_SHORT_SYNC_ENABLED=true` の場合だけ通常同期・page2同期をdispatchする
- falseの場合は同期Jobをdispatchしない
- page2 commandは通常同期と別名にする
- `withoutOverlapping()` とenv gateを持つ

### ランキング

- Strategyごとの取得条件
- comparisonDays / sort条件
- `selectedVideoId` を基準にした全体順位
- 最大5件のdisplay-card-window
- RepositoryとServiceの責務境界

## 変更時の確認

この機能を変更する場合は、最低限次を確認します。

- API quotaへ影響しないか
- 通常同期とpage2同期の役割が混ざっていないか
- Repositoryへ保存判断・表示判断が入っていないか
- 共通保存処理を重複実装していないか
- Schedulerの実行時刻が競合しないか
- snapshot・ranking・window表示の既存テストを壊していないか
- この文書と現在のコード・テストが一致しているか
