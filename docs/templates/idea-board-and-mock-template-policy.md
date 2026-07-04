# IDEA BOARD / MOCK 作成ルール

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / IDEA BOARD / MOCK docs template
- Last reviewed: 2026-07-05
- Canonical source: IDEA BOARD / MOCK のテンプレート作成時の共通ルール

## このドキュメントの目的

このドキュメントは、IDEA BOARD と MOCK を作る前に、役割、画面構造、タブ、タブ内インデックス、内容表示エリア、スクロール方針を固定するための共通ルールです。

LumiLaboで確認した「上にタイトル、次にタブ、次にタブ内インデックス、下に内容表示エリア」という構造を、今後のLab系機能でも迷わず再利用できるようにします。

このドキュメントは、React Component、共通UI Component、Page実装、Backend実装を作るための仕様書ではありません。作業時の型、Markdown、判断基準を固定するためのdocsです。

## 関連テンプレート

| テンプレート | 用途 |
|---|---|
| [idea-board-template.md](idea-board-template.md) | IDEA BOARD を作る時のMarkdownテンプレート |
| [mock-template.md](mock-template.md) | MOCK を作る時のMarkdownテンプレート |

## IDEA BOARD と MOCK の違い

| 項目 | IDEA BOARD | MOCK |
|---|---|---|
| 主役 | 構想、目的、利用者、導線、責務、未確定事項 | 実際の画面イメージ、レイアウト、操作感、状態表示 |
| 表現 | 文字、簡単な表、Mermaidなどのフローチャート中心 | 固定データ、カード、フォーム、一覧、詳細、ボタン中心 |
| 目的 | 次工程へ渡す判断材料を整理する | UI契約と見た目を確認する |
| 作り込み | UIを作り込みすぎない | 説明文を最小限にし、UIを優先する |
| 確定しないもの | 完成仕様、本番構成、DB構造、本番API、本番業務判断 | 本番保存、本番API通信、正式な業務判断、権限判断 |

## 共通画面構造

IDEA BOARD / MOCK は、次の順序を基本構造にします。

```text
コンパクトなタイトル
  ↓
上位タブ
  ↓
選択中タブ内のインデックス
  ↓
内容表示エリア
```

共通ルール:

- タイトル、タブ、インデックスは大きくしすぎない。
- 内容表示エリアを主役にする。
- 内容表示エリアだけを `overflow-y-auto` のスクロール対象にする。
- 「内容表示エリアだけをスクロール対象にする」は、内容を小さい箱へ押し込める意味ではない。
- 内容表示エリアは、選択中タブ・インデックスの内容を読むための主領域として十分な高さを確保する。
- タイトル、タブ、インデックス、補足説明、余白で画面上部を圧迫し、内容表示エリアが1行〜数行しか見えない状態にしてはならない。
- スマートフォン縦表示でも、まとまった本文、カード、表、フローチャート、UI要素を確認できる高さを残す。
- `overflow-y-auto` は、十分な高さを確保した内容表示エリアに対して使う。
- `overflow-y-auto` を指定していても、親要素の高さ設計や `flex-1` / `min-h-0` 不足によりスクロール領域が潰れている場合は失敗とする。
- 内容表示エリアが潰れる場合は、タイトル、タブ、インデックス、余白、補足説明の量を減らし、内容表示エリアを優先する。
- ページ全体を長く縦スクロールさせない。
- タブ内の内容が複数ページに分かれる場合は、タブ直下のインデックスで選択できるようにする。
- インデックスで選択した内容だけを内容表示エリアに表示する。
- すべての説明やUI状態を同時に縦長表示しない。
- タブやインデックスは、選択肢として分かればよい。
- タブやインデックスが横に収まらない場合は、必要に応じて横スクロールを許容する。

## レスポンシブ確認順

確認順はモバイルファーストにします。

1. スマートフォン縦
2. スマートフォン横
3. タブレット
4. PC

スマートフォン横はPC扱いにしません。縦幅が小さい独立した表示条件として確認します。

## 表示対象の切り替え

表、グラフ、Mermaid、カレンダー例、一覧、詳細、フォーム、状態表示を常時すべて表示しません。

選択中の上位タブと、選択中のタブ内インデックスに対応する内容だけを表示します。

IDEA BOARDでは、説明、表、フローチャートを切り替えて整理します。

MOCKでは、カード、フォーム、一覧、詳細、状態表示を切り替えて確認します。

## 共通化について

今回のテンプレート整備は、Reactの共通Componentを作る作業ではありません。

「IDEA BOARD / MOCK のテンプレートを作る」とは、作業時の型、Markdown、判断基準を作ることです。各アプリを横断する共通UI部品へまとめる作業ではありません。

LumiLabo、収支カード、工事発注などを無理に1つの共通Componentへまとめません。

実装共通化は、複数画面で実際に同じ責務、同じ見た目、同じ操作が繰り返し出てから、別PRで判断します。

## 責務境界

IDEA BOARD / MOCK は、Lab / 構想 / UI確認の段階として扱います。

PRODUCTの責務境界は、この段階では実装しません。

PRODUCT化時に必要な候補として、次の名前を出してよいものとします。

- Controller
- Request
- Action
- Service
- Repository
- DTO
- Responder
- Event
- Listener
- Job
- Strategy
- Read Model
- Projection

ただし、候補を出すだけで、実装済みや確定仕様として断定しません。

IDEA BOARD / MOCKでは、Backend層へ進みません。MOCKの固定データを、本番DTOやRepositoryの代替として扱いません。

## 作らないもの

このテンプレート群の作業では、次を作りません。

- React Component
- 共通UI Component
- Page実装
- Hook
- TypeScript型
- Laravel Controller
- Request
- Action
- Service
- Repository
- DTO
- Responder
- Model
- Migration
- Seeder
- Factory
- Job
- Command
- Scheduler
- API通信
- DB保存
- 本番用業務ロジック
- 本番画面
- 認証・認可
- Docker変更
- nginx変更
- queue / scheduler変更
- 本番反映
- 外部API連携
- secrets / `.env` / APIキー / token / cookie / session / 個人情報を含む内容

## PR前確認

- IDEA BOARDとMOCKの役割の違いが明確か。
- IDEA BOARDは文字、表、フローチャート中心になっているか。
- MOCKはUI、固定データ、状態表示中心になっているか。
- タイトル、タブ、タブ内インデックス、内容表示エリアの構造が明記されているか。
- 内容表示エリアだけをスクロール対象にしているか。
- 内容表示エリアが1行〜数行しか見えない状態を失敗として扱っているか。
- スマートフォン縦表示でも、まとまった本文、カード、表、フローチャート、UI要素を確認できる高さを残しているか。
- `overflow-y-auto`、親要素の高さ設計、`flex-1`、`min-h-0` の確認観点があるか。
- 選択中タブと選択中インデックスの内容だけを表示する方針になっているか。
- DB / Migration / API / PRODUCT実装 / 共通Component化へ進まないことが明記されているか。
- docsのみの変更になっているか。
- secretsや個人情報が混入していないか。

## PR Summary に残す Sensors

docsのみの変更であれば、PRレビュー強度は原則 Level 1 です。ただし、索引やテンプレート導線を変更する場合は、docsルーティングへの影響を確認します。

PR Summaryには、少なくとも次を確認結果として残します。

- `SENS-001`: `git diff --check`
- `SENS-002`: docs更新要否チェック
- `SENS-003`: PR Summary必須項目チェック
- `SENS-006`: md-router参照漏れチェック
- `SENS-010`: secrets / `.env` / config チェック
- `SENS-017`: branch / commit granularity チェック
