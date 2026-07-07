# LumiLabo docs

- Status: active
- Scope: LumiLabo
- Last reviewed: 2026-07-07
- Canonical source: LumiLabo固有の画面方針、IDEA BOARD、MOCKの入口

## 目的

LumiLaboは上位プロダクト / 上位ドメインとして扱う。
最初に扱うサブシステムは案件システムとし、現在のIDEA BOARDは、案件システムの目的、価値、流れ、構造、画面候補をお客様向けに説明する資料として扱う。
現在のMOCKは、TOP → 選択 → 案件TOP の初期導線から、案件システムの画面確認を小さく始める。

## 文書

| 文書 | 対象 |
|---|---|
| [ui-design-guideline.md](ui-design-guideline.md) | LumiLaboの画面設計、表示方針、操作方針、レスポンシブ方針 |
| [project-idea-board.md](project-idea-board.md) | LumiLabo 案件システム IDEA BOARD の目的、上位タブ、薄いファイルタグ、フロー、図解、グラフ、画面候補、対象外 |
| [project-mock.md](project-mock.md) | LumiLabo 案件システム MOCK の初期導線、画面範囲、戻る導線、対象外 |

## 現在のIDEA BOARD

- 画面: `/lab/lumilabo-project-idea-board`
- 上位タブ: 概要 / フロー / 機能説明 / 画面候補 / 図解 / グラフ / code
- 初期表示: 概要
- 薄いファイルタグ: 選択中タブ内の説明を切り替えるために使う
- 中心: LumiLaboが上位プロダクトであり、最初のサブシステムが案件システムであることを説明する
- 対象外: MOCK / PRODUCT / DB / Migration / Backend本実装 / Docker / 本番反映

## 現在のMOCK

- 画面: `/lab/lumilabo-project-mock`
- 初期導線: TOP → Start → 選択 → 案件 → 案件TOP。選択からTOPへ戻る導線も持つ
- 全体タブ: TOP / 選択
- 案件TOP導線: 登録 / 一覧 / 戻る
- TOP: LumiLaboアイコン、LumiLaboタイトル、Startボタンだけを見せる
- 選択: Primaryの案件ボタン / 案件カードと、SecondaryのTOPへ戻るボタンを見せる
- 案件TOP: 案件タイトル、登録 / 一覧 の選択、選択画面へ戻るボタンを見せる
- 対象外: IDEA BOARDへの通常リンク / 案件詳細 / 工程デッキ / 工程カード / DB / Backend本実装 / API通信
