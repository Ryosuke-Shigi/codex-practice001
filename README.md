# Laravel Portfolio - codex-practice001

Laravel 11 + Inertia + React + TypeScript + Docker で構築している、外部API連携・同期処理・分析UI・運用ログ・docs / test / PR運用まで含めたポートフォリオアプリです。

公開URL: https://ada-works.dev

## このポートフォリオで伝えたいこと

このリポジトリは、画面を並べるだけのサンプルではなく、変更に強いWebアプリをどう設計・検証・運用するかを示すための実装例です。

- Laravel + Inertia + React + TypeScript によるフルスタック実装
- Action - Domain - Responder を軸にした責務分離
- Controller / Request / Action / Service / Repository / DTO / Responder / Component の境界設計
- Event / Listener / Job / Scheduler / Queue による副作用と非同期処理の整理
- Strategy / Factory による処理差分の切り替え
- Feature / Unit / React test による仕様固定
- Pull Request / CI / docs による変更管理
- AI支援を使いながら、人間が仕様・責務境界・完成判定を握る開発プロセス

レビュー漏れを減らすための検出観点も用意していますが、READMEでは詳細を複製せず、必要な人がdocs側で確認できる構成にしています。

## Highlights

- **外部APIと保存データの両立**: YouTube Data API、APIs.guru、気象庁XMLを扱い、取得・保存・表示責務を分離しています。
- **同期と分析の分離**: Scheduler / Queue / Job でデータを集め、表示側は保存済みsnapshotやread modelを参照します。
- **ログと運用の見える化**: API連携ログとエラーログを保存し、公開ポートフォリオ上で確認できるようにしています。
- **段階的な開発**: IDEA BOARD / MOCK / PRODUCT を分け、構想やUI確認と本実装を混ぜないようにしています。
- **外部向けdocs導線**: READMEは概要に絞り、詳細な設計・テスト・機能仕様はdocsへ分離しています。

## Main Projects

### DanceShorts

YouTube Shorts のダンス動画を保存・観測し、伸び方や地域別候補を確認するProjectです。

- **Radar**: 保存済みsnapshotから地域別ランキング候補や上昇候補を表示します。
- **Analyzer**: 保存済み動画を検索し、選択したShortsのsnapshotを横比較します。

見どころ:

- YouTube Data API連携、動画保存、snapshot保存
- Queue / Scheduler による通常同期、page2同期、snapshot専用同期
- ranking read model と ECharts による表示
- Strategy / Factory / Responder によるランキング条件と表示整形の分離
- 保存済みデータを使う分析画面として、YouTube APIを追加で呼ばない設計

### API Discovery Hub

APIs.guru の公開APIカタログを取得し、検索・詳細確認・調査メモ保存ができるProjectです。

見どころ:

- `list.json` の同期キャッシュ
- insert / update / skip の差分同期
- `payload_hash` による変更検知
- provider / domain / keyword 検索
- APIごとの調査メモCRUD
- Repository / Service / DTO / Action / Responder の責務分離

### Japan Quake Wave Map

気象庁の地震火山情報Atom feedと個別XMLを取得し、保存済みの震源・震度・波紋を地図上で確認するProjectです。

見どころ:

- Atom feed取得、entry保存、個別XML解析
- 震源座標、最大震度、マグニチュード、深さの抽出
- 緯度・経度・最大震度を持つデータだけをmap pin化
- 座標なし、震度なし、XML取得失敗、XML解析失敗の扱いを分離
- 15分ごとの更新入口とstatus API

### Project Logs / アプリログ

アプリ内で保存したAPI連携ログとエラーログを確認するためのProjectです。

見どころ:

- API連携ログとエラーログを別テーブルで保存
- Event / Listener / Repository でログ保存の副作用を分離
- 成功ログを大量化させず、処理単位や分類ごとの要約ログへ集約
- エラーログの詳細表示と対応済み管理

### Operations / Notification

運用確認のための通知・リアルタイム基盤も段階的に整えています。

- Laravel Reverb / Broadcasting の設定を持つ、リアルタイム通知基盤の準備
- Daily Server Health Report のメール通知
- Scheduler、Command Action、Notification、Queue を分けた運用処理

現時点のREADMEでは、個別Broadcast EventやReact通知UIが完成済みであるとは扱いません。

### 工事発注管理 IDEA / MOCK

案件、作業カード、見積、請求、領収の流れを、現場向けの入力体験として整理するProjectです。

このProjectは **IDEA BOARD / MOCK段階** です。固定データでCSV投入、案件詳細、帳票プレビューなどのUIを確認する段階であり、PRODUCT完成済みの業務システムとしては扱っていません。

## Tech Stack

### Backend

- PHP 8.3
- Laravel 11
- Inertia Laravel
- MySQL
- Redis
- Laravel Queue / Scheduler / Notification
- Laravel Reverb
- Flysystem AWS S3 Adapter

### Frontend

- React 19
- TypeScript
- Inertia.js
- Vite
- Tailwind CSS
- ECharts
- Vitest
- motion
- lucide-react

### Infrastructure / CI

- Docker Compose
- nginx
- php-fpm
- AWS Lightsail
- Cloudflare
- GitHub Actions

ローカル開発では MinIO、Mailpit、Adminer なども使いますが、これらは開発確認用であり、本番公開対象ではありません。

## Architecture / Design Policy

このプロジェクトでは、Action - Domain - Responder をADR Patternとして扱います。

```text
Controller / Request
        ↓
Command Action / Query Action
        ↓
Service / Repository / DTO / Strategy / Factory
        ↓
Responder
        ↓
React / Inertia
```

設計で重視していること:

- ControllerはHTTP入口、Requestは入力形式の検証に寄せる
- Actionは1ユースケースの手順を扱う
- Serviceは業務判断、RepositoryはDBや外部データソースとの境界を扱う
- DTO / ListDTOはレイヤー間のデータキャリアとして扱う
- ResponderはInertia propsやJSONなどの出力整形を担当する
- React Componentは表示、操作、UI状態を扱い、業務判断を再構築しない

詳細は [Architecture](docs/architecture.md)、[Frontend](docs/frontend.md)、[UI](docs/ui.md) を参照してください。

## Testing / CI / Review

テストは、後から変更しても壊してはいけない仕様を固定する実行可能な仕様として扱います。

- Laravel Feature / Unit test
- React utility / component test
- Responder / Inertia props の確認
- Job / Artisan Command / Scheduler の実行境界
- CIでの Laravel Pint check、frontend build、Laravel tests、Vitest

docs-onlyの変更ではアプリテストを必須にせず、`git diff --check` とMarkdown差分の確認を中心にしています。詳細は [Testing](docs/testing.md) と [PR Review Strength](docs/operations/pr-review-strength.md) を参照してください。

## Documentation

READMEは外部閲覧者向けの概要です。内部の作業ルールや詳細仕様は、用途ごとのdocsへ分離しています。

- [AGENTS.md](AGENTS.md): 作業時の入口
- [Documentation Index](docs/index.md): docs全体の案内と用途別の正本
- [Feature Docs](docs/features/): 機能固有仕様、UI契約、テスト固定内容
- [Architecture](docs/architecture.md): ADR Patternとレイヤー責務
- [Testing](docs/testing.md): テスト方針
- [Development Flow](docs/development-flow.md): IDEA BOARD / MOCK / PROTOTYPE / PRODUCT
- [Feature Module Portability](docs/feature-module-portability.md): 別Laravelプロジェクトへの移植観点

詳細なAI運用、docs運用、PR運用、検出観点はREADMEへ複製せず、docs側を正本として扱います。

## Local Development / Notes

ローカル環境はDocker Composeを前提にしています。Laravelアプリ本体はこのリポジトリ、Docker / nginx / php-fpm / MySQL / Redis などの外側構成は別の管理領域として扱います。

実行コマンドやDocker serviceの詳細は [Docker Command Registry](docs/operations/command-registry.md) を参照してください。READMEには認証値や本番接続情報を載せません。
