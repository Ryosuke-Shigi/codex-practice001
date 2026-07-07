# UI Component Responsibility Rules

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / Laravel / Inertia / React UI
- Last reviewed: 2026-07-07
- Canonical source: `docs/frontend.md`, `docs/ui.md`, `docs/guides/frontend-screen-types.md`, `docs/development-flow.md`, `docs/ui-development-flow.md`, `docs/prototype-policy.md`

## このガイドの目的

このガイドは、Inertia + React のUI実装で、Page / Layout / Section / Field / Parts / Hook の責務境界を軽く確認するための入口です。

既存実装の完了状態を保証する資料ではありません。画面追加やMOCK作成の前に、責務混在、Page肥大化、モバイル未考慮、外部UIライブラリの採用済み誤認を防ぐために使います。

詳細なReact / Inertia / TypeScript責務は `docs/frontend.md`、UIの見た目と操作基準は `docs/ui.md`、MOCK / PROTOTYPE / PRODUCTの工程は `docs/ui-development-flow.md` と `docs/development-flow.md` を正本とします。

System UI / Graphic Web UI / Graphic Builder UI の画面種別を先に選ぶ必要がある場合は、`docs/guides/frontend-screen-types.md` を参照します。このガイドでは、画面種別を決めた後のPage / Layout / Section / Field / Parts / Hook責務を軽く確認します。

## 01. 基本方針

- UIはモバイルファーストで考える。
- UI作成前に、必要に応じて System UI / Graphic Web UI / Graphic Builder UI の画面種別を明記する。
- Pageに文言、装飾、状態管理、カード構造、レスポンシブ調整を詰め込まない。
- 画面の意味単位、入力単位、小さな部品、UI状態整理を分ける。
- UI Componentへ業務判断、DB都合、権限判断、正式な状態遷移を押し込まない。
- MOCK、IDEA BOARD、PRODUCTの段階を混ぜない。
- 既存のTailwind / React / Inertia構成に沿って考え、未導入の外部UIライブラリを採用済み標準として扱わない。
- 実装済みと確認できないファイル、クラス、Component、Design Tokenを存在する前提で書かない。

## 02. UI責務レイヤー

### Page

Pageは画面入口です。

担当するもの:

- Inertia propsの受け取り
- Feature構成
- Layout / Section / Hook の接続
- ページ単位のtitleやmeta
- ページ全体で必要な最小限のUI状態

担当しないもの:

- 大量の表示文言
- 細かな装飾
- 複雑な状態管理
- カード構造の詳細
- レスポンシブ調整の詳細
- 業務判断

### Layout

Layoutは画面全体の枠組みを担当します。

担当するもの:

- header
- main
- footer
- navigation
- background
- 共通の余白や最大幅など、画面全体の配置

担当しないもの:

- Feature固有の業務判断
- Feature固有の状態遷移
- 入力値の解釈
- 保存可否の判断

### Section

Sectionは画面内の意味単位です。

担当するもの:

- 1つの説明ブロック
- 一覧ブロック
- フォームブロック
- ステータスブロック
- Pageより小さく、Partsより大きいUIまとまり

Sectionは、情報の優先順位、見出し、本文、操作の近さを整理します。業務判断やAPI通信を持たせません。

### Field

Fieldは入力UIの責務を持ちます。

担当するもの:

- 入力項目
- label
- placeholder
- help text
- error
- required
- disabled
- loading
- readonly
- validation error の表示

Fieldはバックエンドバリデーションの代替ではありません。フロントエンドの入力確認はUX改善であり、FormRequest / Request層の検証を省略しません。

### Parts

Partsは小さなUI部品です。

例:

- Button
- Badge
- Card
- Tag
- Panel
- EmptyState
- Loading
- Error
- Icon表示

Partsへ置くもの:

- 見た目
- 汎用操作
- disabled / loading / selected / active などの表示状態
- 汎用イベント通知

Partsへ置かないもの:

- 業務判断
- API通信
- DB都合
- 権限判断
- 状態遷移判断
- Feature固有URL
- 業務ステータス解釈

### Hook

HookはUI状態、表示補助、操作イベント整理を担当します。

担当するもの:

- フィルタ
- 選択状態
- 開閉状態
- タブ状態
- モーダル状態
- UI内イベント整理

Hookへ業務判断やAPI通信を押し込みすぎません。通信入口を持つHookは、何の通信入口か名前と責務で分かるようにします。

### Type / DTO

Type / DTOはpropsやUI表示データの境界を固定します。

- propsの形を明示する。
- UI表示用データとバックエンド内部データを混同しない。
- `any`で境界を曖昧にしない。
- Responderが作るInertia propsとTypeScript型の対応を崩さない。

### Utility

Utilityは表示変換、文字列整形、純粋処理を担当します。

- React状態を持たせない。
- DOMへ依存させない。
- Inertia通信や副作用を持たせない。
- format、sort、filter、軽い表示変換に限定する。

## 03. モバイルファースト基準

レスポンシブ確認は、モバイルファーストを基準にします。

主要確認順:

1. スマートフォン縦
2. スマートフォン横
3. タブレット縦
4. タブレット横
5. PC

確認幅の扱い:

- スマートフォン縦では `360px` を主要確認幅にする。
- `360px` は絶対最小幅ではなく、Android系スマートフォンで破綻しやすい下限寄りの実用確認幅として扱う。
- `320px` はアクセシビリティ、Reflow、横スクロール破綻検知のストレステストとして扱う。
- `375px` / `390px` / `412px` は主要スマートフォン幅の補助確認として扱う。

確認すること:

- どの幅でも意図しない横スクロールがない。
- 主要操作を見失わない。
- タップまたはクリック可能領域が小さすぎない。
- 文字量、カード密度、折り返し、余白、固定ヘッダー、モーダル高さが破綻しない。
- フォーム入力がしやすい。
- 重要操作は `360px` 幅でも見失わない。
- `320px` 相当でも情報欠落や不要な2方向スクロールが起きないか確認する。

スマートフォン横はPC扱いにしません。横幅よりも縦幅が不足しやすい独立条件として確認します。

タブレットはスマートフォンの拡大表示ではありません。余白、カード列数、ナビゲーション、フォーム横並び可否を再判断します。

PCは横に広げるだけで完成扱いにしません。情報階層、最大幅、余白、カード密度、視線移動、固定導線を確認します。

## 04. MOCK / IDEA BOARD / PRODUCT 境界

### IDEA BOARD

IDEA BOARDは構想と説明の段階です。

扱うもの:

- 機能説明
- 構想
- 利用者向け説明
- フローチャート
- 図
- グラフ
- 説明文
- 未確定事項

完成仕様や本番構成を断定しません。

### MOCK

MOCKは固定データで画面確認をする段階です。

扱うもの:

- 画面確認
- 固定データ
- 見た目
- 操作感
- loading / empty / error / selected などの状態表示
- モバイル縦、スマートフォン横、タブレット、PCでの破綻確認

扱わないもの:

- DB保存
- 本番API通信
- 正式な業務判断
- 権限判断
- 本番Service / Repository

### PRODUCT

PRODUCTは長く保守する本実装です。

固定するもの:

- Controller / Request / Action / Service / Repository / DTO / Responder / Component / Test の責務境界
- 本データとの接続
- バリデーション
- 業務判断
- 表示用props
- テストで守る仕様

MOCKの見た目をそのまま本番責務へ昇格しません。MOCKから引き継ぐのはUI契約、状態、導線であり、固定データや仮処理は引き継ぎません。

## 05. タグルール

- タグは画面上の現在位置、分類、状態、属性を軽く示すために使う。
- 無駄に高さを取る大きなインデックスUIにしない。
- ファイルタグのような薄い表示と、タブのような切替表示を用途に応じて分ける。
- タグに業務判断を詰め込まない。
- タグ文言は短く、視認性を優先する。
- タグの色だけで意味を伝えない。

## 06. 実装時チェックリスト

- Pageが画面入口と接続だけに寄っているか。
- Layoutが画面全体の枠組みに留まっているか。
- Sectionが意味単位として分かれているか。
- Fieldがlabel / help / error / required / disabled / loadingを分けているか。
- Partsへ業務判断、API通信、権限判断を入れていないか。
- HookがUI状態整理を超えて巨大化していないか。
- Typeでprops境界を固定し、`any`で逃げていないか。
- Utilityが純粋処理に留まっているか。
- loading / empty / error / disabled / selected などの状態を後回しにしていないか。
- `360px` 主要確認幅、`320px` ストレステスト、スマートフォン横、タブレット、PCを確認対象に入れているか。
- MOCK / IDEA BOARD / PRODUCT の責務が混ざっていないか。
- 外部UIライブラリを採用済み標準と断定していないか。

## 07. Codex指示例

UI作成や修正を依頼するときは、責務、段階、確認幅、変更禁止範囲を先に固定します。

```text
作業段階: MOCK
変更対象: resources/js/Pages/Mocks/... と必要なFeature Component
変更しない対象: app/ routes/ database/ 本番API
責務:
- PageはInertia props入口と全体接続だけ
- Sectionは画面内の意味単位
- Fieldは入力、label、help、errorを担当
- Partsへ業務判断を入れない
確認:
- スマートフォン縦 360px
- 320pxは横スクロール破綻検知
- スマートフォン横、タブレット縦横、PC
```

```text
作業段階: PRODUCT
目的: MOCKで確認したUI契約を本データへ接続する
先に固定すること:
- Controller / Request / Action / Service / Repository / DTO / Responder / Component / Test の責務
- Inertia propsの形
- バックエンドバリデーション
やらないこと:
- MOCK固定データの持ち込み
- Component内での業務判断
- Page肥大化
```

## 08. デザインベース

このプロジェクトでは、まず既存のTailwind / React / Inertia構成に沿って考えます。

- 既存の配置、命名、責務境界を優先する。
- 色、余白、角丸、影、文字サイズ、z-index、状態色を場当たりで増やさない。
- 外部UIライブラリや外部デザインガイドは、採用済み標準ではなく比較・参考として扱う。
- 見た目のコピーではなく、責務、状態、アクセシビリティ、部品分割の考え方を参考にする。

## 09. Design Tokens

Design Tokensは、UI判断を小さな単位として整理する考え方です。

整理対象:

- 色
- 余白
- 文字サイズ
- 角丸
- 影
- 境界線
- 状態表現
- レイヤー
- z-index

画面ごとに独自値を増やしすぎません。

このガイドではDesign Token実装ファイルの追加を扱いません。既存にtoken相当の仕組みがある場合でも、確認できないものを存在する前提で断定しません。

## 10. UI状態表現

UIでは、最低限次の状態を考えます。

- loading
- empty
- error
- disabled
- selected
- active
- inactive
- success
- warning
- pending
- readonly
- validation error

状態は色だけで伝えません。文言、アイコン、枠、位置、aria属性、disabled属性などを組み合わせます。

loading / empty / error は後回しにしません。MOCKでも最低限の状態例を考えます。

## 11. アクセシビリティ基準

- ボタン、リンク、入力、ラベル、エラー表示の意味を崩さない。
- クリック可能要素を `div` だけで雑に作らない。
- キーボード操作、`focus-visible`、aria属性、alt、見出し階層を必要に応じて確認する。
- 文字コントラスト、タップ領域、読み上げ順、エラー伝達を意識する。
- 縦スクロール中心の画面では、`320px` 相当でも情報欠落や不要な2方向スクロールが起きないか確認する。
- このガイドではaxeなどの自動検査ツール導入を扱わない。

## 12. Component-driven UI / Partsカタログ方針

- Parts / Field / Section が増えてから、カタログ化やStorybook導入を検討する。
- Componentを増やすこと自体を目的にしない。
- 責務を分けても、過剰分割で読みにくくしない。
- Partsカタログは実装済み標準ではなく、今後の整理方針として扱う。
- このガイドではStorybook導入を扱わない。

## 13. 外部UIライブラリを参考にする場合の扱い

shadcn/ui、Radix UI、Storybook、Material Design、Apple HIGなどは参考情報として扱います。

- 採用済み、必須、標準と断定しない。
- 見た目をコピーするのではなく、責務、状態、アクセシビリティ、部品分割の考え方を参考にする。
- 導入する場合は別PRで扱う。
- 導入前に、目的、影響範囲、依存追加、既存UIへの影響を確認する。

## 14. 余白・密度・情報階層

- 1画面に詰め込みすぎない。
- モバイルで重要情報が下に流れすぎないようにする。
- 見出し、補足、本文、カード、ボタンの優先順位を明確にする。
- セクションごとの余白を場当たりで変えない。
- PC表示だけを基準にカード数や横並びを決めない。
- タブレットでは、スマートフォンの縦積みを広げるだけにせず、情報階層と操作導線を再確認する。
- PCでは、最大幅、余白、カード密度、視線移動、固定導線を確認する。
- `360px` 幅で情報が読めることを主要確認基準に入れる。
- `320px` 幅では横スクロール破綻や情報欠落の有無を確認する。

## 15. 日本語UIライティング

- ボタン文言は短く、動詞を明確にする。
- 説明文を長くしすぎない。
- エラー文は原因と次の行動が分かるようにする。
- お客様向け画面では、開発都合の言葉を出しすぎない。
- 「しない」「さわらない」だけの細かい禁止説明を画面に大量に出さない。
- docsでは実装者向けに禁止事項を書くが、UI本文へそのまま出さない。

## 16. フォーム設計

- label、placeholder、help text、error、required、disabled、loadingを分けて考える。
- placeholderをlabel代わりにしない。
- 入力中、確認前、送信中、成功、失敗の状態を考える。
- スマートフォン縦ではフォームは基本的に縦積みを優先する。
- タブレット以上で横並びにする場合も、入力しやすさ、ラベルの読みやすさ、エラー表示の崩れを確認する。
- フロントエンドバリデーションはUX改善として扱う。
- バックエンドバリデーションの代替にしない。
- FormRequest / Request層でのバックエンド検証を最終防衛線として扱う。
- MOCKでは保存処理を実装しない。

## 17. やらないデザイン

- Pageにすべてを詰め込む。
- PC幅だけで完成判定する。
- `360px` 幅を見ない。
- `320px` 幅の破綻検知を完全に無視する。
- スマートフォン横をPC扱いする。
- タブレットをスマートフォン拡大表示として扱う。
- PCを横に広げるだけで完成扱いにする。
- 色だけで状態を伝える。
- 外部UIライブラリを採用済み標準と断定する。
- MOCKに本番API通信やDB保存を混ぜる。
- IDEA BOARDに完成仕様を断定的に書く。
- PRODUCTでMOCKの固定データ責務を残す。
- Componentへ業務判断を押し込む。
- Hookへ何でも押し込んで巨大化させる。
- Common ComponentへFeature固有URL、権限判断、業務ステータス解釈を入れる。
- token未整備のまま画面ごとに独自値を増やす。
- UI上に開発者向けの細かい禁止説明を大量表示する。

## 関連文書

- `docs/frontend.md`: React / Inertia / TypeScript責務
- `docs/ui.md`: UIの見た目、操作、Common Component責務
- `docs/guides/frontend-screen-types.md`: System UI / Graphic Web UI / Graphic Builder UI の画面種別選定
- `docs/development-flow.md`: IDEA BOARD / MOCK / PROTOTYPE / PRODUCTの全体工程
- `docs/ui-development-flow.md`: UI契約の引き継ぎ
- `docs/prototype-policy.md`: MOCK / PROTOTYPE の配置とProduct分離
- `docs/templates/idea-board-and-mock-template-policy.md`: IDEA BOARD / MOCK の共通構造
