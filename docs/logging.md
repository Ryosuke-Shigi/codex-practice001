# Logging

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、ログの分類、出力責務、保存先、記録項目、禁止事項を定めます。

ログは処理結果の確認、障害調査、外部API連携の追跡、運用判断に必要な事実を残すために使います。処理の正しさや業務判断をログで代替しません。

## 基本方針

- 開始、成功、失敗、対象件数、処理結果、実行時間等の検証可能な事実を残す
- 同じ事実を複数レイヤーから重複して出力しすぎない
- 正常系で大量の詳細ログを常時出力しない
- 検索・集計しやすいcontextを付ける
- 未確認内容、推測、将来予定を記録しない
- ログ追加のために責務境界を崩さない

## ログ分類

### sync

Job、Command、Scheduler等の同期・定期処理を記録します。

保存先の基本:

- `storage/logs/sync/`
- `daily` driver
- 保持日数は14日を初期値とする

主な項目:

- 処理名
- 開始・終了
- 対象件数
- insert / update / skip / failed件数
- 実行時間
- Job ID等の追跡情報

### external_api

外部APIとの通信結果を記録します。

保存先の基本:

- `storage/logs/external-api/`
- `daily` driver
- 保持日数は14日を初期値とする

主な項目:

- API名とendpointを識別できる名称
- HTTP method
- status code
- request ID等の追跡情報
- timeout、通信失敗、レスポンス不正

### error

例外、処理失敗、部分失敗等、調査が必要な事実を記録します。

保存先の基本:

- Laravel標準のエラーログまたは監視対象channel
- ファイル保存する場合は `daily` driver
- 保持日数は30日を初期値とする

主な項目:

- 処理名
- 例外クラスと安全なエラーメッセージ
- 対象を識別する安全なID
- 再実行判断に必要な状態
- Job ID、request ID等の追跡情報

### operation

利用者または管理者が行った重要操作を記録します。

対象例:

- 同期の手動開始
- 設定変更
- 出力処理
- 重要な登録・更新・取消操作

単なる画面閲覧や大量の通常操作を無条件に記録しません。

## レイヤーごとの責務

- Controller / Request: 原則として業務ログを出さない
- Action: ユースケース単位の開始・完了・部分失敗を記録する
- Service: 重要な業務判断結果を記録する必要がある場合に限定する
- Repository: 原則としてログを出さず、DB・外部データソース境界に集中する
- Job / Command / Scheduler: 実行入口、dispatch、再実行、失敗を記録する
- Listener: Event後の副作用としてログを扱う場合、同じ事実の重複を避ける

例外を捕捉したレイヤーと最終的に処理するレイヤーを確認し、同じ例外を何度も記録しません。

## context

文字列へ情報を埋め込むだけでなく、構造化contextを使います。

```php
Log::channel('sync')->info('dance short sync completed', [
    'processed_count' => $processedCount,
    'inserted_count' => $insertedCount,
    'updated_count' => $updatedCount,
    'failed_count' => $failedCount,
]);
```

contextには必要最小限の安全な値だけを入れます。

## 記録しない情報

- APIキー、Authorization header
- `.env` 実値、DBパスワード、SSH情報
- Cookie、Session、Token
- 個人情報
- 外部APIレスポンス全文
- 巨大payload、画像、バイナリ
- 未加工のRequest全文
- 復元可能性のある秘密値

必要な場合は件数、ハッシュ、安全な内部ID、status code等へ置き換えます。

## テストと確認

ログ追加時は次を確認します。

- 正しいchannelを使っている
- 成功・失敗・部分失敗を区別できる
- 秘密情報を含まない
- 同じ事実を重複記録していない
- 業務判断や処理結果をログだけに依存していない
- 大量実行時にログ量が過剰にならない
- 保持期間と保存先が設定に反映されている

機能固有のログ項目や処理名は、必要に応じて該当する `docs/features/` に記載します。
