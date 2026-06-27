# Feature Doc Template

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-27

## このテンプレートの目的

このテンプレートは、新しい `docs/features/*` を作る時の型です。

Featureが増えても、目的、段階、Route、DB、API、責務、テスト、ログ、運用の粒度がばらつかないようにします。

既存feature docsを置き換えるものではありません。新規Feature追加時、または既存feature docsを大きく整理する時に参照します。

## 使用ルール

- Feature docsは願望ではなく、現在の仕様、意図、責務境界を残す
- 現在挙動の最終事実は code / Migration / 設定 / 成功テストで確認する
- Feature docsは共通ルールを上書きできない
- 仕様と現在コードが矛盾する場合は停止して報告する
- 不明な項目は推測で埋めず、未確認として扱う

## テンプレート項目

新しいfeature docsでは、必要に応じて次の項目を使います。

```md
# <Feature名>

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / <対象Feature>
- Last reviewed: YYYY-MM-DD

## 目的

- <このFeatureが解決すること>
- <対象ユーザーまたは利用場面>

## 現在の段階

- 段階: IDEA BOARD / MOCK / PROTOTYPE / PRODUCT
- 現在この段階として扱う理由:

## 主な入口

- 主なRoute:
- 主な画面:
- 主なArtisan Command:
- Scheduler入口:

## 主なデータ

- 主なテーブル / Migration:
- 主なModel:
- 主な外部入力:
- 主な出力:

## 責務配置

- 主なAction:
- 主なService:
- 主なRepository:
- 主なDTO / ListDTO:
- 主なResponder:
- React Page:
- Feature Component:
- Common Component:

## 外部連携・非同期処理

- 外部APIを使うか:
- Schedulerを使うか:
- Queueを使うか:
- Event / Listenerを使うか:
- Notification / Mailを使うか:

## ログ方針

- 記録するログ:
- skipped と error の区別:
- ログ保存先:

## secrets / config

- secrets / .env の扱い:
- config の扱い:
- .env.example の更新有無:

## テスト方針

- Feature Test:
- Unit Test:
- Frontend Test:
- 固定する仕様:

## 完了条件

- <このFeatureが完了したと判断する条件>

## 変更時の注意

- <壊しやすい導線、状態、責務境界>

## 移植時の注意点

- <Feature Module移植時に確認する対象>
- <移植しない対象>
```

## 外部API / Scheduler / Queue を使う場合の最小確認欄

外部API / Scheduler / Queue を使うFeatureでは、詳細実装テンプレートを作り込まず、少なくとも次を確認します。

| 項目 | 記録すること |
|---|---|
| 外部API名 | 利用するAPI名、サービス名 |
| 取得データ | 取得する主なデータ |
| 取得タイミング | 手動、Scheduler、Queue、画面操作など |
| Scheduler入口 | `routes/console.php` など、確認済みの入口 |
| Artisan Command名 | 確認済みのCommand名 |
| Queue Job有無 | Jobを使うか、使わないか |
| skipped と error の区別 | 想定どおり処理しない状態と異常の区別 |
| ログ保存先 | DB、Laravel log、外部ログなど |
| secrets / config / .env.example | secret名は実値を書かず、設定の有無だけ記録 |
| テスト方針 | API失敗、skipped、error、再実行条件など |

## 注意

このテンプレートでは、外部API / Scheduler / Queueの詳細実装テンプレートまでは作りません。

詳細な外部連携テンプレートが必要になった場合は、別PRで `docs/templates/external-integration-feature-template.md` を検討します。
