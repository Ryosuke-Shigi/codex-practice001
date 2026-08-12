# Frontend Screen Types

- Status: active
- Scope: Laravel / Inertia / React UI
- Last reviewed: 2026-07-07
- Canonical source: frontend画面種別の選定と責務整理

## このガイドの目的

このガイドは、フロントエンド画面を作る前に、画面種別を `System UI` / `Graphic Web UI` / `Graphic Builder UI` のどれとして扱うか決めるための入口です。

画面種別を先に決めることで、Page、Hook、Component、Section、Visual、Builder、Renderer などの責務が混ざることを防ぎます。

このガイドは全UI作業で毎回全文読むdocsではありません。UI作成、UIレビュー、MOCK画面追加、Graphic Web UI作成、Builder UI検討など、画面種別の選定が必要なときだけ参照します。

React / Inertia / TypeScriptの責務は `docs/frontend.md`、UIの見た目と操作基準は `docs/ui.md`、MOCK / PROTOTYPE / PRODUCTの工程は `docs/ui-development-flow.md` を正本とします。

## 基本方針

- CodexAppへUI作業を依頼するときは、最初に画面種別を明記する
- 1つのプロダクト内で複数の画面種別が共存してよい
- ただし、1つの画面やComponent内で責務を混ぜない
- 画面種別は見た目の好みではなく、目的、入力、操作、データ責務で決める
- Graphic Web UIの表現力をSystem UIへ無理に持ち込まない
- Builder UIを検討しても、D&Dや自由配置を今すぐ実装する前提にしない
- D&Dで直接JSXや業務データを変更する設計にしない

## 3分類の早見表

| 種別 | 主な対象 | 主な目的 | 基本構成 |
|---|---|---|---|
| System UI | 登録、一覧、詳細、フォーム、管理画面、内部業務画面 | 正確性、入力しやすさ、一覧性、作業速度、保守性 | Page / Hook / Component / Field / Types / constants |
| Graphic Web UI | TOP、LP、紹介ページ、ブランド画面、IDEA BOARD表紙、MOCK開始画面 | 印象、概念説明、導線、ポートフォリオ性 | Page / Section / Block / Visual / Motion / Copy / Theme |
| Graphic Builder UI | D&D、自由配置、セクション編集、フィールド配置編集、ブロック編集 | ユーザーが見た目や配置を編集できること | Builder / Layout Schema / Renderer |

## System UI

System UIは、業務作業を正確に速く進めるための画面です。

### 対象

- 登録
- 一覧
- 詳細
- フォーム
- 業務操作
- 状態管理
- 管理画面
- 内部業務画面

### 目的

- 正確性
- 入力しやすさ
- 一覧性
- 作業速度
- 状態の見やすさ
- 保守性

### 基本構成

- Page
- Hook
- Component
- Field
- Types
- constants

### 責務

- Page: 画面構成、Feature構成、Inertia props受け取り
- Hook: 状態管理、イベント、表示用変換、操作整理
- Component: 表示、ユーザー操作、UI状態
- Field: 入力単位、label、help、error、required、disabled
- Types: props、view model、UIデータ境界
- constants: 文言、選択肢、表示定義

### 禁止事項

- Pageに状態管理や表示変換を集めない
- Componentに業務ルールを入れない
- 業務判定、ステータス確定、金額計算、完了判定をComponentへ入れない
- 業務判断、DB都合、権限判断、状態遷移判断をフロントへ押し込みすぎない
- 過度な装飾や演出を入れない

### レビュー観点

- PageがInertia props入口と全体接続に寄っているか
- HookがUI状態とイベント整理に留まっているか
- Field単位で入力、補足、エラー、必須状態を確認できるか
- Componentへ業務判断やDB都合を入れていないか
- Typesでprops境界が見えるか
- Common ComponentへFeature固有URLや業務ステータス解釈を入れていないか

## Graphic Web UI

Graphic Web UIは、見た人に印象や概念を伝え、次の導線へ進めるための画面です。

### 対象

- TOP
- LP
- 紹介ページ
- ポートフォリオ用の見せる画面
- IDEA BOARDの表紙
- MOCK開始画面
- 機能紹介
- ブランド画面

### 目的

- 印象を作る
- 概念を伝える
- 導線を作る
- 見た人に魅力を伝える
- ポートフォリオとして見せる

### 基本構成

- Page
- Section
- Block
- Visual
- Motion
- Copy
- Theme

### 責務

- Page: 全体の流れ、主要導線、画面全体の構成
- Section: 画面の章、意味の切り替わり
- Block: 小さい見せ場、カード、コピーとVisualのまとまり
- Visual: 図、装飾、イラスト的表現
- Motion: 動き、切り替え、視線誘導
- Copy: 見出し、本文、CTA文言
- Theme: 色、余白、角丸、影、雰囲気

### 禁止事項

- Form / Field中心で考えない
- 業務入力画面のように硬くしすぎない
- 見た目優先で責務を壊さない
- 業務ロジック、DB連携、本番API通信、フォーム責務を入れない
- Graphic Web UIの思想をSystem UIへ無理に持ち込まない

### レビュー観点

- Sectionごとの役割が分かれているか
- VisualやMotionが操作UI、業務処理、保存処理から分離されているか
- Copyが長すぎず、導線が分かるか
- Themeが画面単位の場当たり値だらけになっていないか
- 背景や演出が可読性、クリック、タップ、スクロールを妨げていないか
- 実装済みでないroute、API、画面を完成済みとして書いていないか

## Graphic Builder UI

Graphic Builder UIは、ユーザーが見た目や配置を編集できるようにするための画面です。

この種別は将来のD&Dや自由配置を扱うための設計分類です。現時点でBuilder UI、D&D、Rendererを実装する指示ではありません。

### 対象

- ドラッグアンドドロップ
- 自由配置
- セクション編集
- フィールド配置編集
- ブロック編集
- デザイン自由度を持つ編集画面

### 目的

- 見た目や配置をユーザーが編集できるようにする
- グラフィカルな自由度を持たせる
- 将来的に1フィールドや1ブロックをD&Dで移動する設計にも耐えられるようにする

### 重要方針

- D&Dで直接JSXや業務データを壊さない
- D&DはLayout Schemaを作るための操作にする
- RendererがLayout Schemaを読み取って表示する
- 配置情報と業務データを混ぜない
- 保存するのは配置の意味であり、画面上の一時DOM状態ではない

### 基本構成

- Builder
- Layout Schema
- Renderer

### 推奨する配置管理

- Section
- Slot
- Order
- Grid
- Breakpoint

### 避けるべき形

- `x` / `y` / `width` / `height` のpx固定絶対座標だけで保存する
- PCだけで成立し、スマホで破綻する構成にする
- Componentに状態を持たせすぎる
- Pageを巨大化させる
- 業務データと配置情報を同じ責務で扱う
- JSX文字列やComponent実装そのものをユーザー操作で直接書き換える

### レビュー観点

- Builderの操作対象がLayout Schemaになっているか
- Rendererが表示責務に留まり、編集UIや業務判断を持ちすぎていないか
- Layout Schemaが業務データ、権限判断、保存可否判断を含んでいないか
- Breakpointごとの表示が考慮されているか
- 将来実装の余地をdocsで残すだけに留まり、未実装機能を実装済みと書いていないか

## Common / Feature / Effectsの境界

画面種別に関係なく、次の境界は維持します。

- Common Component: 業務非依存の表示、汎用操作、汎用状態だけを置く
- Feature Component: 機能固有の表示、操作、UI状態を置く
- Effects: 背景、水面、波紋、パーティクル、光などの演出に限定する

Effectsは操作UIや業務処理から分離します。Graphic Web UIであっても、Effectsへ保存処理、API通信、権限判断を入れません。

## LumiLabへの適用例

次は分類例です。実装済みroute、実装済みディレクトリ、実装済み機能を示すものではありません。

- TOP / 紹介 / 導入画面: Graphic Web UI
- ログイン後 / MOCK内部 / 案件登録 / 案件一覧 / 案件詳細: System UI
- 将来的な配置編集や自由編集: Graphic Builder UI
- 現段階ではBuilder UIやD&Dを実装しない
- まずは作れる余地を設計に残す

想定route例:

```text
/lab/lumilab
/lab/lumilab/projects
/lab/lumilab/projects/create
/lab/lumilab/projects/{id}
```

推奨ディレクトリ例:

```text
resources/js/Features/LumiLab/Web/
resources/js/Features/LumiLab/Web/Pages/
resources/js/Features/LumiLab/Web/Sections/
resources/js/Features/LumiLab/Web/Blocks/
resources/js/Features/LumiLab/Web/Visuals/
resources/js/Features/LumiLab/Web/Copy/
resources/js/Features/LumiLab/Web/Theme/

resources/js/Features/LumiLab/System/
resources/js/Features/LumiLab/System/Pages/
resources/js/Features/LumiLab/System/Hooks/
resources/js/Features/LumiLab/System/Components/
resources/js/Features/LumiLab/System/Fields/
resources/js/Features/LumiLab/System/Types/
resources/js/Features/LumiLab/System/constants/

resources/js/Features/LumiLab/Builder/
resources/js/Features/LumiLab/Builder/Pages/
resources/js/Features/LumiLab/Builder/Components/
resources/js/Features/LumiLab/Builder/Renderer/
resources/js/Features/LumiLab/Builder/Hooks/
resources/js/Features/LumiLab/Builder/Types/
resources/js/Features/LumiLab/Builder/constants/
```

上記は設計例です。既存構成と衝突する場合は既存構成を優先し、docs内では例として扱います。今回のdocs追加だけで、このディレクトリを実装として作成する必要はありません。

## CodexAppへの短い指示例

System UI:

```text
画面種別: System UI
目的: 登録 / 一覧 / 詳細などの業務操作を正確に進める
責務: PageはInertia props入口、HookはUI状態とイベント、Componentは表示と操作、Fieldは入力単位
やらないこと: Componentへ業務判断、DB都合、権限判断、状態遷移判断を入れない
確認: docs/frontend.md、docs/ui.md、docs/guides/frontend-screen-types.mdのSystem UIを参照
```

Graphic Web UI:

```text
画面種別: Graphic Web UI
目的: TOP / 紹介 / ブランド画面として印象、概念、導線を作る
責務: Pageは全体の流れ、Sectionは章、Blockは見せ場、Visual / Motion / Copy / Themeを分ける
やらないこと: 業務ロジック、DB連携、本番API通信、フォーム責務を入れない
確認: docs/ui.md、docs/guides/frontend-screen-types.mdのGraphic Web UIを参照
```

Graphic Builder UI検討:

```text
画面種別: Graphic Builder UI検討
目的: 将来のD&Dや自由配置に備え、Builder / Layout Schema / Rendererの責務を整理する
重要方針: D&Dで直接JSXや業務データを変更しない。配置情報と業務データを分ける
やらないこと: 今回はBuilder UI、D&D、Rendererを実装しない
確認: docs/guides/frontend-screen-types.mdのGraphic Builder UIを参照
```

## 確認チェックリスト

- 画面種別を最初に明記したか
- 目的、対象画面、基本構成が種別と一致しているか
- Page / Hook / Component / Section / Visual / Builder / Rendererの責務が混ざっていないか
- Common Componentへ業務固有責務を入れていないか
- Effectsが操作UIや業務処理から分離されているか
- Builder UIを検討する場合、Layout SchemaとRendererの責務を分けているか
- D&Dで直接JSXや業務データを変更する前提になっていないか
- 未実装のroute、画面、ディレクトリ、Builder機能を実装済みとして書いていないか

## 関連文書

- `docs/frontend.md`: React / Inertia / TypeScript責務
- `docs/ui.md`: UIの見た目、操作、Common Component責務
- `docs/guides/ui-component-responsibility-rules.md`: Page / Layout / Section / Field / Parts / Hookの責務確認
- `docs/ui-development-flow.md`: MOCK / PROTOTYPE / PRODUCT UI作成工程
- `docs/prototype-policy.md`: MOCK / Prototypeの配置とProduct分離
