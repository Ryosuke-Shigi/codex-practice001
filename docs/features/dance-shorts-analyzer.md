# DanceShortsAnalyzer

- Status: active
- Scope: DanceShortsAnalyzer
- Last reviewed: 2026-06-12
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, and successful tests for implemented behavior

## このドキュメントの目的

このドキュメントは、DanceShortsAnalyzer 固有の Search / Analyze 入口、保存済み動画と snapshot の扱い、テスト固定内容をまとめます。

共通の責務境界は `docs/architecture.md`、共通テスト方針は `docs/testing.md` に従います。

## Search 画面

入口:

```text
GET /dance-shorts-analyzer
```

Search 画面は保存済み `dance_short_videos` の検索と選択だけを担当します。

- keyword 未入力時は DB 全件取得しない
- 検索対象は `youtube_video_id` / `title` / `description` / `channel_title` / `tags`
- 20件ずつ取得し、追加取得は次ページだけを取得する
- 最大5件まで選択できる
- Searchカードクリックは選択 / 選択解除だけを行う
- Searchカードを YouTube リンク化しない
- Analyze へ渡す ID は `youtube_video_id` ではなく `dance_short_videos.id`

## Analyze 画面

入口:

```text
GET /dance-shorts-analyzer/analyze
```

query:

- `video_ids[]`: `dance_short_videos.id` の配列
- `active_video_id`: 表示中動画の `dance_short_videos.id`

Analyze 画面は、MOCK の UI 契約を引き継ぎ、選択済み動画の保存済み snapshot を横比較します。

- YouTube API は呼ばない
- 新規同期 Job / Scheduler は追加しない
- 派生値を DB 保存しない
- YouTube Shorts URL は Responder で生成する
- EChartsOption は Responder で生成する
- React は props 表示と metric / period タブの UI 状態だけを扱う
- 上部の小さいサムネイルは、クリックで YouTube Shorts を別タブ表示する
- MOCK にない大きな動画詳細カード、最新 snapshot カード、metric card、active region ボタンは Analyze 本体へ追加しない
- チャートは選択動画ごとの series を持つ
- 増加量表と 1時間あたり表は、選択動画をカラムにした横比較表にする
- 表は増加量表と 1時間あたり表を別 Field に分ける
- 背景は既存 `BackgroundTraceEffect`、グラフは既存 `EChartsViewer` を使う

## snapshot 計算

対象 snapshot は region ごとに分け、`collected_at asc, id asc` で扱います。

差分:

```text
delta = current - previous
```

経過時間:

```text
hours = previous.collected_at から current.collected_at までの秒数 / 3600
```

1時間あたり:

```text
per_hour = delta / hours
```

null 扱い:

- previous がない場合、delta / per_hour は null
- hours <= 0 の場合、per_hour は null
- like_count / comment_count が null の場合、その metric は計算不能として null
- 計算不能を 0 に丸めない

## region 扱い

`dance_short_video_snapshots` は `region_id` ごとに分かれます。

- 複数 region の snapshot を勝手に合算しない
- region ごとに分析グループを分ける
- region code / name を props に含める
- 横比較に使う region は、各動画の最新 snapshot がある region を優先する

## テストで固定する仕様

- `/dance-shorts-analyzer/analyze` が empty 状態で表示できる
- `video_ids[]` は最大5件まで
- 存在しない `video_ids[]` は validation で弾く
- YouTube URL は Responder が Shorts URL として生成する
- EChartsOption props は選択動画ごとの series を返す
- 増加量表と 1時間あたり表は別 props
- 増加量表と 1時間あたり表は選択動画ごとの columns / cells を返す
- snapshot なし動画は no snapshot message を返す
- 複数 region は合算せず別グループにする
- YouTube API Repository を呼ばない
- snapshot 計算不能値を 0 にしない
