# Storage

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / application storage boundary
- Last reviewed: 2026-07-09

## このドキュメントの目的

この文書は、既存のS3互換Storage基盤をアプリ側から使うときの共通方針を固定します。

ここで扱うのはStorage境界だけです。LumiLabo写真保存、案件ファイル添付、PDF保存、DB紐付け、アップロードCRUD、本番bucket作成は各Featureの別PRで扱います。

## 前提

- `league/flysystem-aws-s3-v3` は既に導入済みです。
- `config/filesystems.php` には `s3` disk が既にあります。
- `.env.example` にはローカルMinIO例と本番AWS S3向けの環境変数名が既にあります。
- Docker側のMinIO service は外側repoの責務であり、アプリ側PRでは重複追加しません。

## アプリ側の責務境界

Feature側から `Storage::disk('s3')` を直接呼びません。

アプリ側では次の共通境界を使います。

- `App\Services\Storage\ApplicationFileStorageService`
- `App\Repositories\Storage\FileStorageRepositoryInterface`
- `App\Repositories\Storage\LaravelFileStorageRepository`
- `App\DTO\Storage\StoredFileDTO`

Service は disk、prefix、visibility、path正規化、保存結果DTO化を担当します。

Repository は Laravel Storage との境界だけを担当します。

DTO は保存結果のデータキャリアに留め、DB操作、Storage操作、Feature固有判断、レスポンス生成を置きません。

## URL / temporary URL

保存結果DTOの `url` と `temporaryUrl` は必要な場合だけ生成します。

通常の保存結果ではどちらも `null` です。公開URLまたは一時URLが必要なFeatureは、共通Serviceの引数またはURL取得メソッドで明示的に要求します。

public公開前提のS3設定にはしません。visibility は原則 `private` から始め、Feature固有の公開要件がある場合だけ個別に判断します。

## テスト方針

自動テストでは実S3 / 実MinIOへ接続しません。

Storage境界のテストは `Storage::fake('s3')` を使い、AWS credentials、MinIOコンテナ起動、外部ネットワークに依存しない形で固定します。

`.env.example` のMinIO設定はローカル開発確認用であり、自動テストの接続先として扱いません。

## 秘密情報

本番S3 credentials、AWS access key、secret、bucket固有の秘密値、本番 `.env` の実値をGitへ入れません。

docs、コメント、PR本文には環境変数名と方針だけを書き、実値は書きません。
