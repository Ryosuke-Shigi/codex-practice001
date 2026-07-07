# LumiLabo 案件システム MOCK

- Status: active
- Scope: LumiLabo / 案件システム MOCK
- Last reviewed: 2026-07-07
- Canonical source: `/lab/lumilabo-project-mock` の初期導線と画面範囲

## 目的

LumiLabo 案件システム MOCK は、お客様に実際の画面導線を見てもらうための仮UIとして扱う。

IDEA BOARDは機能説明資料、MOCKは画面確認であり、MOCK側へIDEA BOARDの通常リンクや説明資料への戻り導線を置かない。

現在のMOCKでは、最初から詳細画面や工程系を増やさず、TOPから案件システムへ入る最小導線を確認する。

## 現在の導線

```text
TOP
  ↓ Start
選択
  ├ 案件 → 案件TOP
  └ TOPへ戻る → TOP
```

## 画面構成

全体タブ:

- TOP
- 選択

案件内タブ:

- TOP
- 登録
- 一覧

案件詳細、工程デッキ、工程カード、カレンダーは、ユーザーが明示した段階で追加する。現在の標準タブには含めない。

## TOP

TOPでは、LumiLaboの入口だけを見せる。

見せるもの:

- LumiLaboアイコン
- LumiLaboタイトル
- Startボタン

置かないもの:

- 案件説明
- IDEA BOARDリンク
- 登録 / 一覧 / 詳細への直接導線
- 実データに見える数値や進捗

## 選択

選択では、LumiLabo配下のサブシステムを選ぶ。

現在見せるもの:

- Primaryの案件ボタン / 案件カード
- SecondaryのTOPへ戻るボタン

現在は、案件以外のサブシステムを増やさない。
TOPへ戻るはMOCK内のUI状態をTOPへ戻すだけで、DB保存、API通信、Inertia遷移、route追加は行わない。

## 案件TOP

案件TOPでは、案件システムに入ったことと、案件内で確認する画面を見せる。

見せるもの:

- 案件アイコン
- 案件タイトル
- TOP / 登録 / 一覧 の画面選択
- 選択画面へ戻るボタン

戻るボタンは案件TOPに置く。登録や一覧など個別画面の戻る導線は、画面内容を作る段階で必要性を判断する。

## 登録 / 一覧

現在の初期MOCKでは、登録 / 一覧は案件内の画面選択として扱う。

入力フォーム、一覧データ、絞り込み、詳細ボタン、状態表示は、ユーザーがその画面内容の作成を指示した段階で追加する。

## 作らないもの

- IDEA BOARDへの通常リンク
- 案件詳細
- 工程デッキ
- 工程カード
- カレンダー
- DB / Migration / Model
- Controller / Request / Action / Service / Repository / DTO の本実装
- API通信
- 保存可能フォーム
- 実データに見える数値、件数、進捗

## 確認観点

- TOP → Start → 選択 → 案件 → 案件TOP の導線になっていること
- 選択で案件とTOPへ戻るを選べること
- 選択のTOPへ戻るでTOPへ戻れること
- TOPは LumiLabo / Start の入口だけになっていること
- 選択はPrimaryの案件ボタン / 案件カードとSecondaryのTOPへ戻るボタンだけになっていること
- 案件内タブが TOP / 登録 / 一覧 であること
- 案件TOPに選択へ戻るボタンがあり、選択へ戻れること
- 案件詳細や工程系を標準タブにしていないこと
- IDEA BOARDへの通常リンクをMOCK内に置いていないこと
- スマホ横置きで案件TOPの選択へ戻る導線が画面下で見切れないこと
- DB / Backend本実装 / API通信へ踏み込んでいないこと
