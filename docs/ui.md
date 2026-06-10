# UI

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、UIの見た目、操作、レスポンシブ表示、Common Component配置の基準を定めます。

React / Inertia / TypeScriptの実装責務は `docs/frontend.md` に従います。

## 基本方針

- モバイルファーストで設計する
- 見た目より情報の優先順位、視認性、操作性を優先する
- UI Componentへ業務判断、DB操作、外部API判断を持たせない
- Common UIとFeature UIを分離する
- 背景・演出と操作UIを分離する
- ラフ画像は見た目の参考に限定し、実装仕様は指示用まとめを優先する

## ディレクトリ構成

```text
resources/js/
├── Components/
│   ├── Common/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Field/
│   │   ├── Modal/
│   │   └── Loading/
│   ├── Effects/
│   └── <Feature>/
├── Layouts/
├── Pages/
└── theme/
```

- `Components/Common`: 複数機能で使用する業務非依存UI
- `Components/<Feature>`: 機能固有UI
- `Components/Effects`: 背景、水面、波紋、パーティクル、光等
- `Layouts`: ページ間で共通する配置と枠組み
- `Pages`: ページ全体の組み立てとページ固有状態
- `theme`: 色、余白、文字サイズ、角丸、影等の共通定義

## Commonへ入れる条件

次を満たすものだけをCommonへ置きます。

- 複数画面または複数機能で実際に使う
- 特定機能のDTO、業務用語、状態遷移に依存しない
- propsが見た目、操作、汎用状態に限定されている
- 利用側が業務データを表示用propsへ変換して渡せる

Commonへ入れてよい例:

- Button
- Card
- Field
- Modal
- Loading
- EmptyState
- ErrorMessage
- Pagination

Commonへ入れない例:

- 業務上の保存可否を判断するButton
- 特定ランキング専用Card
- 業務値を判定するBadge
- 工程状態を変更するModal
- Laravel側の業務ステータスを解釈するComponent

見た目が似ているだけで目的や操作が異なるものを、無理にCommon化しません。

## Commonの責務

扱ってよいもの:

- 見た目
- 汎用的な操作
- disabled、loading、error、selected等の表示状態
- 子要素、表示文字
- 汎用イベント通知

扱わないもの:

- API通信
- Inertiaの遷移先決定
- DB由来データの取得・保存
- 権限判断
- 状態遷移の可否判断
- 機能固有URL生成
- 業務ステータスの解釈

Feature Componentが業務データを受け取り、Commonへ表示用propsとイベントを渡します。

## バックエンドとの接続

```text
Service / Repository
        ↓
DTO / ListDTO
        ↓
Responder
        ↓
Page
        ↓
Feature Component
        ↓
Common Component
```

Common Componentを追加すること自体がADR Patternではありません。責務と依存方向を守ることで、フロント側でも境界を明確にします。

## モバイルファースト

確認順:

1. スマートフォン縦
2. スマートフォン横
3. タブレット
4. PC

最低限確認すること:

- 意図しない横スクロールがない
- 操作対象が画面外へ隠れない
- 文字、Card、画像が潰れない
- 固定要素が本文やButtonを覆わない
- タップ対象が重ならない
- 縦向きと横向きの両方で操作できる
- 1画面に収める仕様では不要なページスクロールがない

スマートフォン横向きはPC扱いにせず、縦幅が小さい独立条件として設計します。

## 共通UIの状態

必要に応じて次の状態を扱います。

- default
- hover
- focus
- active / selected
- disabled
- loading
- error
- empty

状態は色だけで表現せず、文言、アイコン、枠、aria属性等も組み合わせます。

## Button

- `button` または適切なInertia `Link` を使う
- クリック可能な `div` を標準にしない
- disabled状態を見た目と属性で示す
- loading中の重複実行を防ぐ
- destructive操作は通常操作と区別する
- アイコンだけの場合は識別可能なラベルを付ける
- タップ領域を小さくしすぎない

## Card

- 情報のまとまりを表示する
- 業務判断を持たせない
- selected / activeを枠、背景、ラベル等で明示する
- Card全体が操作対象の場合、内部ButtonやLinkとの競合を避ける
- モバイルでは情報の優先順位に応じて縦積みする
- 固定高さで文字や操作を切り捨てない

## Field

- label、入力、補足、エラーの関係を明示する
- placeholderだけをlabel代わりにしない
- 必須・任意を判別できるようにする
- エラーは対象Fieldの近くへ表示する
- Select、Checkbox、Radioの選択状態を視覚的に示す
- フロントの入力確認だけで完結せず、Laravel側でも検証する

## Modal

- 開いた理由と操作対象を明確にする
- 閉じる操作を用意する
- 背景側の誤操作を防ぐ
- 重要操作では対象と結果を表示する
- モバイル縦・横で内容やButtonが画面外へ出ないようにする
- 長い内容はModal内部のスクロール範囲を明確にする

## Loading / Empty / Error

- 通信中であることを表示する
- loading中の重複操作を防ぐ
- 0件を故障表示にせずEmpty状態として表示する
- 再試行可能か、操作を止めるべきかを区別する
- 技術的な例外メッセージをそのまま利用者へ表示しない

## スワイプ・自動送り

- スワイプとページスクロールを競合させない
- Button、Link、Input上の操作を誤検知しない
- 自動送りに停止手段を用意する
- 停止対象範囲を明確にする
- 先頭、末尾、ループの仕様を実装前に固定する
- 表示移動と追加通信を分離する

## Effects

- 操作UIより背面に置く
- pointer eventで主要操作を妨げない
- 常時激しく動く演出を避ける
- モバイルの発熱、電池消費、描画負荷を確認する
- 切り替えで既存レイアウトを変更しない
- 重い演出は必要に応じて遅延読み込みする
- 視認性が下がる場合はUIの可読性を優先する

## ラフ画像

- 色味、光、密度、余白感等の参考に限定する
- 画像内のUI、文言、Button、Cardを実装仕様と解釈しない
- 背景ラフは背景だけ、UIなし、文字なしを基本とする
- 実装対象、成功条件、失敗条件、変更しない範囲は指示用まとめへ書く

## アクセシビリティ

- セマンティックなHTMLを優先する
- キーボードフォーカスを失わせない
- focus状態を視覚的に確認できるようにする
- 色だけで状態やエラーを伝えない
- 画像へ用途に応じた代替テキストを設定する
- aria属性は標準HTMLだけでは関係を表せない場合に使う
- 自動アニメーションや自動送りを停止できるようにする

## 共通化の判断

1. 現在、複数機能で実際に使われているか確認する
2. 業務固有props、条件分岐、URL生成が入っていないか確認する
3. Commonへ移すことで利用側が複雑にならないか確認する
4. 見た目が似ているだけではないか確認する
5. 必要な状態とイベントを最小限のpropsで表せるか確認する

共通化によって条件分岐が増える場合は、用途別Componentとして分けます。
