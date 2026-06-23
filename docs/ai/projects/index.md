# Project Docs

- Status: active
- Scope: project-specific docs index

## 役割

このファイルは、プロジェクト固有ルールや機能固有docsへの索引です。

既存の `docs/features/` は意味変更リスクを避けるため今回移動せず、ここから参照します。

| Path | 対象 |
|---|---|
| [../../features/api-discovery-hub.md](../../features/api-discovery-hub.md) | API Discovery Hubの同期、検索、保存メモ、テスト固定仕様 |
| [../../features/dance-shorts-analyzer.md](../../features/dance-shorts-analyzer.md) | DanceShortsAnalyzerの保存済み動画検索、Analyze表示、snapshot計算、テスト固定仕様 |
| [../../features/dance-shorts-radar.md](../../features/dance-shorts-radar.md) | DanceShortsRadarの同期、ランキング、テスト固定仕様 |
| [../../features/japan-quake-wave-map.md](../../features/japan-quake-wave-map.md) | Japan Quake Wave Mapのfeed、XML、map pin、status API |
| [../../features/application-logs.md](../../features/application-logs.md) | Project Hub logsのAPI連携ログ、ERRORログ、対応済み管理、テスト固定仕様 |

## 配置ルール

- 新しいプロジェクト固有の作業索引や注意点は、この配下に追加する。
- 既存feature docsの本文は、分類に迷う場合は移動しない。
- 機能固有仕様の正本は、引き続き `../../features/` の該当MDと成功テストで確認する。
