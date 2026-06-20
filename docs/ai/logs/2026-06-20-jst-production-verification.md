# JST本番反映後確認

- Status: active
- Scope: UTC to JST統一後の本番確認
- Base branch: main
- Base commit: 0f0e839f032d404863b1c13fe65650bebd782875
- Created at: 2026-06-20
- Related PR: #86
- Invalid when:
  - 本番反映先が変わった
  - timezone / config の扱いを再変更した
  - queue / scheduler のサービス定義を変更した
  - Project Hub logs、DanceShortsRadar、DanceShortsAnalyzer、API Catalog、QuakeWave の時刻表示を変更した

## 目的

PR #86 で UTC to JST 統一対応は merge / deploy 済みです。

この文書は、本番反映後に実施した読み取り専用の確認結果を記録します。コード、`.env`、DB、migration、Docker構成、外部APIの更新・削除処理は変更していません。

## 確認対象

本番で確認した画面:

- `https://ada-works.dev/`
- `https://ada-works.dev/projects`
- `https://ada-works.dev/projects/logs`
- `https://ada-works.dev/api-catalog`
- `https://ada-works.dev/dance-shorts-radar`
- `https://ada-works.dev/dance-shorts-analyzer?keyword=dance`
- `https://ada-works.dev/quakewave-preview/map`

今回含めないもの:

- MySQL / Redis の外部公開ポート閉じ
- DB変更
- Docker Compose変更
- 本番 `.env` 変更
- migration
- 破壊的なDockerコマンド
- 外部APIの更新・削除系処理

## 確認結果

再チェック時点で、確認対象の本番画面は HTTP 200 を返しました。Cloudflare 502 の再発は確認されませんでした。

画面から取得できる本番データでは、次のJST基準の時刻を確認しました。

- Project Hub API連携ログ: `2026-06-20 16:16`, `2026-06-20 15:45`, `2026-06-20 15:15`, `2026-06-20 15:00`
- Project Hub エラーログ: `2026-06-20 01:24`
- API Catalog sync status: `2026-06-20T03:00:42+09:00`, `2026-06-20T03:00:44+09:00`
- DanceShortsRadar collected time: `2026-06-20 16:15`
- DanceShortsRadar previous collected time: `2026-06-19 14:45`
- DanceShortsAnalyzer 検索結果: `2026-06-20 14:30`, `2026-06-20 14:09`, `2026-06-20 13:43`
- QuakeWave map: `2026-06-19T20:39:00+09:00`, `2026-06-19T20:42:00+09:00`

`2026-06-20 16:16` のAPI連携ログと `2026-06-20 16:15` の DanceShortsRadar collected time は初回の反映後確認より後に表示されたため、queue / scheduler 実行後に保存・表示される時刻も、公開画面データ上はJST基準に見えます。

確認した画面範囲では、日付境界の前日・翌日ずれ、ログ時刻の9時間ずれ、ログ並び順の違和感は確認されませんでした。

## 内部サーバー確認

`43.206.39.254` のSSHホストキーを一時 `known_hosts` に固定して接続を試しましたが、手元の鍵では認証できませんでした。

```text
ubuntu@43.206.39.254: Permission denied (publickey).
```

そのため、この確認では次の内部コマンドは未実行です。

- `php artisan tinker`
- `config('app.timezone')`
- `date_default_timezone_get()`
- `now()->format('P')`
- `docker compose ps`
- `docker compose logs --tail=50 php-fpm`
- `docker compose logs --tail=50 queue`
- `docker compose logs --tail=50 scheduler`
- `docker compose logs --tail=50 nginx`
- `curl -I http://127.0.0.1/`

ただし、前段の人間確認として、本番 `src/.env` の `APP_TIMEZONE=Asia/Tokyo` 変更、Laravel config cache更新、関連サービス再起動、tinkerでの `Asia/Tokyo / Asia/Tokyo / +09:00` 確認は完了済みです。

## 502再発時の初動

Cloudflare 502 が再発した場合は、原因を断定する前に実行結果を記録します。

```bash
cd /var/www/api-discovery-hub
docker compose ps
docker compose logs --tail=100 nginx
docker compose logs --tail=100 php-fpm
curl -I http://127.0.0.1/
```

nginx / php-fpm の upstream 接続状態が怪しい場合だけ、nginx restart を検討します。

nginx restart で復旧した場合も、記録は次に留めます。

```text
nginx再起動で復旧した。
確定原因とは断定しない。
```

追加証拠なしに、nginx を確定原因として扱いません。

## 反省

`.env`、Laravel config、php-fpm restart を伴う本番反映では、次回から nginx も再起動・確認対象に含めます。

今回、php-fpm / queue / scheduler 再起動後に Cloudflare 502 が発生し、nginx 再起動で復旧しました。これは「nginx再起動で復旧した」という確認済み事実であり、確定原因ではありません。
