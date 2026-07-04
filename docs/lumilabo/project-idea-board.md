# LumiLabo 案件システム IDEA BOARD

- Status: active
- Scope: LumiLabo / 案件システム IDEA BOARD
- Last reviewed: 2026-07-04
- Canonical source: この文書と `/lab/lumilabo-project-idea-board` のタブ構成

## 目的

LumiLaboの最初の実作業として、案件システム IDEA BOARD を作る。
LumiLaboは案件管理機能そのものではなく、上位プロダクト / 上位ドメインとして扱う。
最初のサブシステムを案件システムとし、案件作成を中心タブに置く。

## 画面構成

IDEA BOARD画面は次のタブを必須にする。

1. TOP
2. 案件
3. 案件作成
4. 案件一覧
5. Coding

初期表示はTOPとする。
表示中タブの内容だけを表示し、全内容を1枚に縦並びで表示しない。

## TOP

TOPでは次を示す。

- LumiLaboが上位プロダクト / 上位ドメインであること
- 最初の対象が案件システムであること
- IDEA BOARDであり、MOCK / PRODUCTではないこと
- 案件作成を起点に、案件一覧、案件詳細、工程へつなげる構想整理であること
- DB / Backend本実装 / カレンダーを扱わないこと

## 案件

案件タブでは、案件システムの位置づけと導線を整理する。

```text
LumiLabo Hub
  ↓
案件システム
  ↓
案件作成
  ↓
案件一覧
  ↓
案件詳細
  ↓
工程デッキ / 工程カード
```

案件作成を中心に置き、案件一覧以降は後続扱いとする。
LumiLaboを単なる案件管理機能として扱わない。

## 案件作成

案件作成は中心タブとする。

入力させる候補:

- 会社名
- 担当者名
- 住所
- メモ

表示する候補:

- 登録日表示
- ステータス表示

登録日は入力欄にしない。
将来のPRODUCTでは `created_at` 表示相当として扱う。
ステータス初期表示は「進行中」候補として扱う。

入力させないもの:

- 登録日
- 案件名
- 郵便番号 / 都道府県 / 市区町村などへ分割した住所
- 工程カード情報
- カレンダー情報
- 完了判定に関わる情報

入力フォーム風の見せ方をする場合でも、保存可能フォームやMOCKとして扱わない。

## 案件一覧

案件一覧は後続タブとして扱う。
案件作成後の確認先として位置づける。
一覧画面そのものや固定データMOCKは作らない。

将来表示する候補は概念としてのみ整理する。

- 会社名
- 担当者名
- ステータス
- 登録日

詳細画面への遷移実装、案件詳細、工程詳細は扱わない。

## Coding

Codingタブでは、実装境界を明記する。

読むMD:

- `AGENTS.md`
- `docs/index.md`
- `docs/ai/workflows/md-router.md`
- `docs/ai/rules/agent-working-policy.md`
- `docs/ai/rules/responsibility-boundaries.md`
- `docs/lumilabo/ui-design-guideline.md`
- `docs/ui-development-flow.md`
- `docs/frontend.md`
- `docs/ui.md`

実装対象:

- LumiLabo 案件システム IDEA BOARD画面
- TOP / 案件 / 案件作成 / 案件一覧 / Coding のタブUI
- 表示中タブだけを表示する構成
- docs導線
- Project Hubからの最小導線

対象外:

- MOCK
- PRODUCT
- 保存可能な入力フォーム
- DB
- Migration
- Model
- Controller
- Request
- Action
- Service
- Repository
- DTO
- Event
- Listener
- Job
- Scheduler
- API通信
- Docker変更
- npm install
- shadcn/ui導入
- Storybook導入
- カレンダー
- 案件詳細
- 工程詳細
- 工程デッキ実装
- 工程カード実装

## カレンダー

カレンダーは扱わない。
カレンダータブ、カレンダーMOCK、日付別カードカレンダーは作らない。
カレンダーは、案件、工程、入金、出金、請求などの各カードが定義された後に扱う。

## 責務境界

IDEA BOARDは設計・構想整理のための表示であり、業務ロジックを持たせない。
React Componentに完了判定や業務判断を入れない。
Backend層は作らない。

将来PRODUCT化する場合は、Controller / Request / Action / Service / Repository / DTO / Presenter の責務分離を前提にする。
DTOは判断本体ではなく、確定済み値の受け渡し境界として扱う。
状態判断や完了判定は将来Service側で扱う。

## 確認観点

- 必須5タブがあること
- 初期表示がTOPであること
- 表示中タブだけが表示されること
- 案件作成が中心として整理されていること
- 登録日を入力欄にしていないこと
- 案件名を初期項目へ追加していないこと
- 住所を勝手に分割していないこと
- カレンダー、案件詳細、工程詳細を作り込んでいないこと
- DB / Migration / Backend本実装へ踏み込んでいないこと
