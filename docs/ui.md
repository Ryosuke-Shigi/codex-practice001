# UI

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、このプロジェクトにおけるUIの見た目、操作、レスポンシブ表示、共通Component配置の基準を明文化するためのものです。

React / Inertia / TypeScriptの実装責務は `docs/frontend.md`、UIの見た目と操作基準はこのドキュメントで扱います。

## 基本方針

- UIはモバイルファーストで設計する
- 見た目より、情報の優先順位、視認性、操作性を優先する
- UI Componentに業務判断、DB操作、外部API判断を持たせない
- 共通UIと機能固有UIを分離する
- 背景・演出と操作UIを分離する
- ラフ画像は見た目の参考に限定し、実装仕様は指示用まとめを優先する

## UIディレクトリ構成

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
│   ├── ApiCatalog/
│   ├── DanceShortsRadar/
│   └── QuakeWave/
├── Layouts/
├── Pages/
└── theme/
```

- `Components/Common` は複数機能で使用する業務非依存UIを置く
- `Components/<Feature>` は機能固有UIを置く
- `Components/Effects` は背景・水面・波紋・パーティクル・光などの演出を置く
- `Layouts` は複数ページで共通する配置と枠組みを置く
- `Pages` はページ全体の組み立てとページ固有のUI状態を扱う
- `theme` は共通の色、余白、文字サイズ、角丸、影などの定義を置く

## Commonへ入れる条件

次の条件を満たすものだけを `Components/Common` に置きます。

- 複数画面または複数機能で実際に使用する
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

- API保存可否を判断するButton
- 地域別ランキング専用Card
- 地震震度を判定するBadge
- 工程状態を変更するModal
- Laravel側の業務ステータスを解釈するComponent

見た目が似ているだけで目的や操作が異なるものは、無理にCommon化しません。

## Commonの責務境界

Common Componentは次だけを扱います。

- 見た目
- 汎用的な操作
- disabled、loading、error、selectedなどの表示状態
- 子要素や表示文字の受け取り
- 汎用イベントの通知

Common Componentは次を扱いません。

- API通信
- Inertiaによる画面遷移先の決定
- DB由来データの取得・保存
- 権限判断
- 状態遷移の可否判断
- 機能固有のURL生成
- 業務ステータスの解釈

機能固有Componentが業務データを受け取り、Common Componentへ表示用propsとイベントを渡します。

## ADR・レイヤードとの接続

フロントエンドでは次の流れを基準にします。

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

- Serviceは業務判断を行う
- RepositoryはDB操作や外部データ取得を行う
- DTO / ListDTOはレイヤー間のデータ構造を固定する
- ResponderはInertia propsへ整形する
- Pageは画面全体を組み立てる
- Feature Componentは機能固有の表示・操作を扱う
- Common Componentは業務非依存の表示・操作だけを扱う

Common Componentを追加すること自体がADRではありません。責務と依存方向を守ることで、フロント側もレイヤード構成として扱います。

## モバイルファースト

確認順は次を基本とします。

1. スマートフォン縦向き
2. スマートフォン横向き
3. タブレット
4. PC

最低限、次を確認します。

- 意図しない横スクロールがない
- 操作対象が画面外へ隠れない
- 文字、カード、画像が潰れない
- 固定要素が本文やボタンを覆わない
- タップ対象が重ならない
- 縦向きと横向きの両方で操作できる
- 1画面に収める仕様では不要なページスクロールがない

スマートフォン横向きはPC表示として扱わず、縦幅が小さい独立した条件として設計します。

## 共通UIの状態

共通UIは必要に応じて次の状態を持ちます。

- default
- hover
- focus
- active / selected
- disabled
- loading
- error
- empty

状態は色だけで表現せず、文言、アイコン、枠、aria属性なども組み合わせます。

## Button

- 操作要素は `button` または適切なInertia `Link` を使う
- クリック可能な `div` を標準にしない
- disabled時は操作不能であることを見た目と属性で示す
- loading時は重複実行を防ぐ
- destructive操作は通常操作と区別する
- アイコンだけのButtonには識別可能なラベルを付ける
- タップ領域が小さくなりすぎないようにする

## Card

- Cardは情報のまとまりを表示する
- Card内に業務判断を持たせない
- selected / activeは枠、背景、ラベルなどで明示する
- Card全体が操作対象の場合は、内部ButtonやLinkとの競合を避ける
- モバイルでは情報の優先順位に応じて縦積みする
- 固定高さによって文字や操作を切り捨てない

## Field

- label、入力、補足、エラーの関係を明示する
- placeholderだけをlabel代わりにしない
- 必須・任意を画面上で判別できるようにする
- エラーは対象Fieldの近くへ表示する
- フロントの入力確認だけで完結せず、Laravel側でも検証する
- Select、Checkbox、Radioは選択状態が視覚的に分かるようにする

## Modal

- Modalを開いた理由と操作対象を明確にする
- 閉じる操作を用意する
- 背景側の誤操作を防ぐ
- destructive操作では対象と結果を表示する
- モバイル縦・横で内容やButtonが画面外へ出ないようにする
- 長い内容ではModal内部のスクロール範囲を明確にする

## Loading・Empty・Error

- 通信中は処理中であることを表示する
- loading中の重複操作を防ぐ
- データが0件の場合は故障表示にせずEmpty状態を表示する
- エラー時は再試行可能か、操作を止めるべきかを区別する
- 技術的な例外メッセージをそのまま利用者へ表示しない

## スワイプ・自動送り・スクロール

- スワイプとページスクロールを競合させない
- Button、Link、Input上のスワイプを誤検知しない
- 自動送りには停止手段を用意する
- 画面タップやクリックで停止する仕様では、対象範囲を明確にする
- 先頭・末尾・ループの仕様を実装前に固定する
- 追加データ取得を伴う場合は、表示移動と通信処理を分離する

## 背景エフェクトとの境界

- Effectsは操作UIより背面に置く
- pointer eventで主要操作を妨げない
- 常時激しく動く演出を避ける
- モバイルで発熱、電池消費、描画負荷を確認する
- エフェクト切替で既存レイアウトを変更しない
- 重い演出は必要に応じて遅延読み込みする
- 視認性を下げる場合はUI側の可読性を優先する

## ラフ画像の扱い

- ラフ画像は色味、光、密度、余白感などの参考に限定する
- ラフ画像内のUI、文言、Button、Cardを実装仕様と解釈しない
- 背景ラフは背景だけ、UIなし、文字なしを基本とする
- 実装対象、成功条件、失敗条件、変更しない範囲は指示用まとめに書く

## アクセシビリティ

- セマンティックなHTML要素を優先する
- キーボードフォーカスを失わせない
- focus状態を視覚的に確認できるようにする
- 色だけで状態やエラーを伝えない
- 画像には用途に応じた代替テキストを設定する
- aria属性は標準HTMLだけでは関係を表せない場合に使用する
- 自動アニメーションや自動送りを停止できるようにする

## 共通化の判断手順

1. そのUIが現在、複数機能で使われているか確認する
2. 業務固有props、条件分岐、URL生成が入っていないか確認する
3. Commonへ移すことで利用側が複雑にならないか確認する
4. 見た目が似ているだけなら機能別Componentのままにする
5. Common化後もFeature Componentが業務固有責務を保持しているか確認する

将来使うかもしれないという理由だけで、先にCommon化しません。

## 変更時の確認項目

- Commonへ業務固有の条件分岐を入れていないか
- Feature ComponentとCommon Componentの責務が分かれているか
- Pageへ細かな共通UI実装を直接書きすぎていないか
- Effectsが操作UIへ依存していないか
- モバイル縦・横・PCで表示と操作を確認したか
- disabled、loading、error、empty状態を確認したか
- タップ、クリック、スワイプ、スクロールが競合していないか
- ラフ画像から仕様外UIを追加していないか
- 既存のCommon Componentを再利用できないか確認したか
- 無理な共通化でpropsや分岐が肥大化していないか
