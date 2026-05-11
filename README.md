# Laravel Portfolio - API Discovery Hub / QuakeWave Preview

このリポジトリは、Laravel 11 + Docker + Inertia + React + TypeScript を使ったポートフォリオアプリです。

現在は、APIs.guru の公開APIカタログを扱う `API Discovery Hub` と、気象庁XMLを取得・保存・地図可視化する `QuakeWave Preview` を実装しています。

- 公開URL: https://ada-works.dev
- できること: API一覧検索、provider / domain 絞り込み、詳細確認、調査メモ保存、手動同期、外部API確認、UIモック確認、気象庁XMLの取得・保存・地図可視化
- 技術スタック: Laravel 11, Docker, Inertia, React, TypeScript, MySQL, Redis
- 設計上の見どころ: ADRパターン、レイヤードアーキテクチャ、DTO、Repository、Service、Action、Responder、Queue
- AI駆動開発の位置づけ: 仕様決定や完成判定は人間が行い、ChatGPT / CodexApp は設計整理・レビュー観点整理・既存コード確認・差分作成の補助として使う

## プロジェクト概要

このリポジトリは、Laravel 11 + Docker + Inertia + React + TypeScript を使ったポートフォリオアプリです。AI駆動開発・仕様駆動開発の学習兼ポートフォリオとして作成しています。

実装済みの主な機能は、公開APIを検索・保存・調査する `API Discovery Hub` と、気象庁XMLを取得・保存・地図可視化する `QuakeWave Preview` です。

公開APIを調べるときは、API 名、提供元、OpenAPI 定義 URL、更新日、関連検索を行き来することが多くなります。API Discovery Hub では、その調査の入口として、公開APIカタログの検索、絞り込み、詳細確認、調査メモ保存までを小さく確認できるようにしています。

QuakeWave Preview では、気象庁の地震火山情報 Atom feed を取得し、地震情報 entry をDBへ保存し、個別XMLから地図表示用の pin を生成する流れを確認できます。

このポートフォリオは AWS Lightsail で外部公開し、Cloudflareで取得した正式ドメイン `https://ada-works.dev` を導入済みです。

## 公開URL

- https://ada-works.dev

ローカル確認 URL は次のとおりです。

- Laravel: http://localhost:8080
- Vite: http://localhost:5173
- Mailpit: http://localhost:8025
- Adminer: http://localhost:8081

## できること

### API Discovery Hub

- APIs.guru `list.json` から公開APIカタログを取得
- `api_catalog_cache` への同期キャッシュ保存
- APIs.guru から消えた API を `is_active=false` として扱う差分同期
- API 一覧のキーワード検索、provider 絞り込み、domain 絞り込み
- 更新日時や名称など、このアプリ内の指標による並び替え
- URL query による検索条件、並び順、ページ番号の保持
- API 詳細でのキャッシュ済みメタ情報表示
- Google 検索リンクの表示時生成
- API ごとの調査メモ保存、更新、削除
- Queue による手動同期開始
- Scheduler による定期同期 Job 投入
- API Preview での外部 API 疎通確認
- モック画面での UI 確認

### QuakeWave Preview

- 気象庁の地震火山情報 Atom feed を取得
- 地震情報 entry の抽出
- `earthquake_feed_entries` への保存
- entry_id を基準にした insert / update / skip の差分同期
- 保存済み feed entry から個別 XML を取得
- 個別 XML から震源座標・最大震度・マグニチュード・深さを抽出
- 地図表示用 pin の生成・保存
- Queue による地震 feed 取込と map pin 生成
- 同期ステータスのポーリング表示
- 水面上に日本地図と地震ピンを表示する UI モック

React 画面は、同期 Job の登録と同期ステータス確認の導線を持っています。同期失敗ログや同期履歴表示としての整理は、今後追加予定です。

## 画面導線とスクリーンショット

短時間で見る場合は、まず `/` から全体の入口を確認し、次に `/lab` から実験画面と本番画面の関係を見ると流れを追いやすいです。

- `/`: ポートフォリオ入口。アプリ全体の起点として見る画面です。
 <img width="975" height="959" alt="Welcome画面" src="https://github.com/user-attachments/assets/996061ae-cb83-49a7-b4af-ab0003a9d7df" />
- `/lab`: 実験・機能一覧。API Preview、API Discovery Hub、QuakeWave Preview への導線をまとめています。
 <img width="955" height="891" alt="Lab画面" src="https://github.com/user-attachments/assets/facd87a9-7f27-4f65-a5fe-c81d155ac4ac" />
- `/api-preview`: 外部API確認用画面。APIs.guru の実取得、成功モック、エラーモックの入口です。
 <img width="961" height="961" alt="API Preview画面" src="https://github.com/user-attachments/assets/269f445f-b15c-4a44-be2b-cc395a656432" />
- `/api-catalog`: API Discovery Hub の本番一覧。公開APIカタログの検索、絞り込み、並び替え、同期開始を確認できます。
 <img width="955" height="957" alt="API Catalog一覧画面" src="https://github.com/user-attachments/assets/4b5a1f7f-f2f7-4600-9f67-306b6633b1a9" />
- `/api-catalog/{apiKey}`: API詳細。提供元、preferred version、OpenAPI URL、更新日時、調査メモの保存・更新・削除を確認できます。
 <img width="955" height="953" alt="API Catalog詳細画面" src="https://github.com/user-attachments/assets/b7a93dbb-b29c-4fba-8b33-ff1b50d37645" />
- `/api-catalog/mock`: UI確認用モック一覧。外部APIや同期キャッシュに依存せず、一覧UIの見た目と導線を確認できます。
 <img width="957" height="515" alt="API Catalogモック画面" src="https://github.com/user-attachments/assets/cef2175f-5788-47d5-911b-357312d7a4e1" />
- `/quakewave-preview`: 気象庁XMLの取得・保存・地図表示用データ生成を確認する地震波可視化プレビュー画面です。
- `/quakewave-preview/map`: 水面上の日本地図と地震ピン表示を確認する画面です。
- `/quakewave-preview/xml`: 気象庁 Atom feed と個別 XML の取得・解析を確認する画面です。

補助的なルートとして、`/api-preview/apis-guru`、`/api-preview/apis-guru/mock`、`/api-preview/apis-guru/mock-error`、`/api-catalog/sync`、`/api-catalog/sync/status`、`/api-catalog/mock/{apiKey}`、`/api-catalog/{apiKey}/notes`、`/quakewave-preview/feed-entries/sync`、`/quakewave-preview/feed-entries/sync/status`、`/quakewave-preview/map-pins/sync`、`/quakewave-preview/map-pins/sync/status` があります。

## 技術スタック

- Backend: PHP 8.3, Laravel 11
- Frontend: Inertia, React 19, TypeScript, Vite, Tailwind CSS, motion
- Database / Queue: MySQL 8.0, Redis
- Infrastructure: Docker Compose, nginx, php-fpm, AWS Lightsail
- Development tools: Composer, npm, PHPUnit, Laravel Pint, Mailpit, Adminer

## 設計方針

このポートフォリオは、ADR パターンとレイヤードアーキテクチャを基準にしています。ここでの ADR は Action-Domain-Responder の考え方を指します。

- Controller は HTTP 入口に限定する
- Request は入力バリデーションに限定する
- Action は 1 ユースケースの手順を担当する
- Command は登録、更新、削除、同期開始など状態変更を扱う
- Query は一覧、詳細、検索など状態を変えない取得を扱う
- Service は同期時の業務ルールや状態判断を担当する
- Repository は DB 取得・保存、Eloquent クエリ、外部 API 通信の境界を担当する
- DTO はレイヤー間のデータ受け渡しに使う
- Responder は Inertia props など出力形式の整形を担当する
- Factory は DTO 生成や Strategy / Responder 選択を担当する
- Strategy は処理差分やアルゴリズム差分を担当する
- Event / Listener は発生した事実と、その後の副作用を分けて扱う

API Preview と API Discovery Hub 本体は分離しています。Preview 側の Repository / DTO / Responder は、本体側に流用しない方針です。

QuakeWave Preview でも同じ設計思想を使い、外部データ取得、XML解析、DB保存、画面表示用データ生成を分離しています。これにより、異なるドメインでも ADR パターン・レイヤードアーキテクチャを再利用できることを示しています。

## 設計判断

### Queue を使う理由

外部データの取得・同期処理をバックグラウンドで実行し、ユーザーの閲覧体験を妨げないために使用しています。

### DB にキャッシュする理由

外部データをその場で毎回取得するのではなく、取得済みデータをDBに保持し、一覧表示・検索・過去情報の参照に利用できるようにするためです。

### 差分判定を行う理由

外部データを無条件に保存し続けるとデータ量が増えすぎるため、変更がある場合のみ更新・追加する構成にしています。

### 同じ設計思想で複数機能を作る理由

API Discovery Hub と QuakeWave Preview は異なるドメインですが、外部データ取得、変換、保存、表示という流れは共通しています。

同じ ADR パターン・レイヤードアーキテクチャを使うことで、設計が場当たりではなく、別ドメインにも再利用可能であることを示しています。

## AI駆動開発の方針

このリポジトリでは、AI に仕様決定や完成判定を任せません。

- 人間が仕様、責務、境界、DB 設計、テスト観点を先に決める
- ChatGPT は設計整理、責務分離の壁打ち、レビュー観点整理に使う
- CodexApp は既存コード確認、差分作成、実装補助、README 整理に使う
- 最終判断、仕様確定、レビュー、本番反映判断は人間が行う

「AIが自律的に作ったアプリ」ではなく、「人間が設計判断を持ち、AIを補助として使った開発ポートフォリオ」として扱っています。

## テスト・エラー処理

実装済みの Feature テストでは、API Discovery Hub、API Preview、QuakeWave Preview の主要導線を確認しています。

- `ApiCatalogSyncTest`: 同期 Job の Queue 投入、同期開始レスポンス、return_url の制限、同期ステータス、失敗状態の扱いを確認
- `ApiCatalogNoteTest`: API詳細表示 props、保存メモの保存・更新・削除、別APIメモの更新防止、モック詳細で保存しないことを確認
- `ApiPreviewTest`: API Preview 一覧、APIs.guru の実取得時 props、エラーレスポンス時 props、成功モック、エラー確認用モックを確認
- `QuakeWavePreviewFeedEntrySyncTest`: 気象庁 Atom feed の取得、地震情報 entry の抽出、DB保存、insert / update / skip、Queue 投入、同期ステータス、失敗状態を確認
- `QuakeWavePreviewXmlPreviewTest`: 気象庁XML取得プレビューと、XML解析結果の表示導線を確認

外部API取得では、成功レスポンスだけでなく、失敗レスポンスや固定エラー表示の確認導線も用意しています。外部通信に依存しないモック画面により、UI とエラー表示を切り分けて確認できます。

今後予定として、Service / Action / Repository の Unit テスト拡充、同期失敗ログ、同期履歴表示、失敗通知の整理を追加していきます。

テスト実行コマンド:

```bash
docker compose run --rm artisan test
docker compose run --rm npm run build
