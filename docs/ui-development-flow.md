# MOCK / PROTOTYPE / PRODUCT UI作成工程

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-12

## このドキュメントの目的

このドキュメントは、MOCK / PROTOTYPE / PRODUCT の各段階でUIをどのように作り、どの内容を次段階へ引き継ぐかを定めます。

MOCKを見た目の参考資料として扱わず、PRODUCTへ引き継ぐUI契約として扱うことで、AIやCodexAppが画面構造、Field構成、導線、スクロール範囲を勝手に作り直すことを防ぎます。

開発段階全体の完成条件は `docs/development-flow.md`、MOCK / PROTOTYPE の配置とProductとの物理的分離は `docs/prototype-policy.md`、UI部品とCommon Componentの責務は `docs/ui.md` を正本とします。

## 基本方針

MOCK / PROTOTYPE / PRODUCT は、次の役割で分けます。

```text
IDEA BOARD
    ↓
MOCK       画面単体のUIを作る
    ↓
PROTOTYPE  画面同士の接続、導線、状態変化を作る
    ↓
PRODUCT    UI契約と振る舞いを引き継ぎ、本データと責務分離へ接続する
```

PRODUCT化とは、MOCKやPROTOTYPEで確認したUIを捨てて作り直すことではありません。

PRODUCT化とは、画面単体のUI契約と画面間の導線を維持したまま、固定データ、仮データ、仮通信、仮ロジックを、本番用のprops、Backend、Repository、Service、Responder、DTO、Testへ置き換えることです。

PRODUCTで引き継ぐのは、MOCK / PROTOTYPE のコードそのものではありません。引き継ぐのは、UI契約、振る舞い、状態、導線であり、PRODUCTの責務に合わせて再実装します。

## UI契約

UI契約とは、MOCK / PROTOTYPE で確認し、PRODUCT化しても勝手に変えてはいけない画面仕様です。

UI契約に含めるもの:

- Page構成
- Field構成
- Component構成
- 入力欄
- ボタン
- カード
- 表
- グラフ枠
- サムネイル
- 導線
- クリック / タップ / スワイプなどの主操作
- selected / loading / empty / error などの状態表示
- スクロール構造
- 表示順
- 余白
- 画面密度
- 上詰め / 中央寄せ
- 空状態や仮表示
- Productで置き換えるprops
- 本データ接続点
- Responder / Componentの責務境界
- PROTOTYPEで確認した振る舞い

UI契約に含めないもの:

- MOCKの固定データ
- PROTOTYPEの仮データ
- 仮の画像URL
- 仮の数値
- 仮通信
- 仮ロジック
- 本番未接続の一時的な状態管理

UI契約は、UIの見た目だけではなく、画面の使い方、情報の並び、操作の意味、次画面への渡し方を含みます。

## IDEA BOARD の役割

IDEA BOARDでは、作りたい機能、利用場面、画面候補、確認したい操作を整理します。

この段階では、UI契約を固定しません。

扱うもの:

- 目的
- 想定利用者
- 使う場面
- 必要そうな画面
- 必要そうなField
- 調査事項
- 採用しない可能性がある案

次へ進む条件:

- 最初にMOCK化する画面が決まっている
- その画面で何を確認したいか説明できる
- まだ未確定のことを未確定として扱えている

## MOCK の役割

MOCKでは、画面を1つずつ作ります。

目的は、画面単体のUI構造を確認し、PRODUCTへ引き継ぐUI契約を作ることです。

MOCKで固定するもの:

- Page構成
- Field構成
- Component構成
- layout
- className
- spacing
- scroll構造
- 表示順
- 入力欄
- ボタン
- カード
- 表
- グラフ枠
- サムネイル
- loading / empty / error / selected
- モバイル縦
- モバイル横
- タブレット
- PC

MOCKで扱わないもの:

- DB取得
- DB保存
- 本番API通信
- 外部API呼び出し
- 業務計算
- 権限判断
- 正式な状態遷移
- 本番用Action
- 本番用Service
- 本番用Repository
- 本番用Responder

MOCKは、固定データだけで成立する必要があります。

MOCKが完成した時点で、「この画面にはどのFieldがあり、どの操作があり、どの状態表示があり、どのスクロール範囲を持つか」を説明できる状態にします。

## PROTOTYPE の役割

PROTOTYPEでは、MOCKで作った画面同士をつなぎます。

目的は、画面間の導線、状態の受け渡し、操作フロー、簡易的なデータの流れを確認することです。

PROTOTYPEで確認するもの:

- 画面遷移
- タブ切り替え
- 選択状態の受け渡し
- 入力から次画面までの流れ
- 一覧から詳細への流れ
- 検索から分析への流れ
- 戻る導線
- 画面間で必要なprops候補
- loading / empty / error の流れ
- PR分割できる単位

PROTOTYPEで使ってよいもの:

- MOCKと同じUI構造
- MOCKと同じField / Component
- 仮データ
- 簡易通信
- 検証用Route
- 検証用Controller
- 簡易的な状態変化

PROTOTYPEで扱わないもの:

- 本番業務ロジック
- 正式なDB設計
- 本番データ更新
- 本番APIへの更新・削除
- Productと同等の完成判定

PROTOTYPEは、完成コードではありません。

PROTOTYPEで確認した仮通信、仮状態、雑な処理コードをそのままPRODUCTへ昇格しません。

ただし、PROTOTYPEで確認した画面間の導線、状態の受け渡し、画面構成は、PRODUCT化時に引き継ぐUI契約として扱います。

## PRODUCT の役割

PRODUCTでは、MOCK / PROTOTYPEで確認したUI契約を、本番用の責務分離と本データに接続します。

PRODUCT化で行うこと:

- MOCKで作った画面単体のUI構造を引き継ぐ
- PROTOTYPEで作った画面間の導線を引き継ぐ
- MOCK / PROTOTYPEのPage、Field、Component構造を確認する
- PROTOTYPEで確認した振る舞い、状態、導線を確認する
- PRODUCTで守るべき振る舞いを先にTestへ記述する
- PRODUCTの責務に合わせてPage、Field、Componentを再実装する
- ダミーデータをpropsへ置き換える
- propsをBackendから渡す
- DB取得をRepositoryへ置く
- 業務判断と計算をServiceへ置く
- ユースケース手順をActionへ置く
- 表示用整形をResponder / Presenterへ置く
- レイヤー間のデータをDTO / ListDTOで固定する
- 重要な画面契約をテストで固定する

PRODUCT化で避けること:

- UIをゼロから作り直す
- MOCKにないFieldを追加する
- MOCKで決めたFieldを削る
- PROTOTYPEで確認した導線を削る
- ダミーデータを残す
- 仮通信を残す
- Frontendへ業務計算を置く
- FrontendへDB取得や外部API呼び出しを置く
- 次PRの機能を混ぜる

## PRODUCT化の標準手順

PRODUCT化では、次の順で進めます。

```text
MOCKで画面単体のUI契約を確認
    ↓
PROTOTYPEで画面間の導線、状態受け渡し、振る舞いを確認
    ↓
PRODUCT化する1目的・1ユースケースを決める
    ↓
引き継ぐUI契約、振る舞い、状態、導線を列挙
    ↓
PRODUCTで守るべき仕様をTestへ記述
    ↓
PRODUCTの責務に合わせてComponent / Action / Service / Repository / DTO / Responderを再実装
    ↓
固定データ・仮データ・仮通信・仮ロジックを削除
    ↓
propsの形をDTO / Responderで固定
    ↓
Repository / Service / Actionへ責務分離
    ↓
Reactは表示、操作、UI状態へ寄せる
    ↓
Testを通す
    ↓
UI契約が壊れていないかMOCK / PROTOTYPEと比較
```

再実装時に参照するもの:

- Pageの骨格
- Fieldの構成
- Componentの分割
- layout
- className
- spacing
- scroll構造
- 汎用的なUI状態
- 業務非依存のCommon Component

引き継がないもの:

- 固定データ配列
- 仮データ
- 仮通信
- 雑な仮ロジック
- Product専用ではない検証用Route
- 検証用Controller
- console.logなどの検証残骸
- 本番仕様として未確定の条件分岐

## PRODUCT化時に先にTestで固定するもの

PRODUCT化では、実装を先に作らず、PROTOTYPEで確認済みの振る舞いからPRODUCTで守る仕様を先にTestへ記述します。

先に固定するもの:

- 選択したデータだけが対象になること
- 本番APIを追加呼び出ししないこと
- 保存済みデータを使うこと
- Serviceの業務判断
- Repositoryの取得条件
- Responderのprops構造
- UIで必要な状態
- loading / empty / error / selected などの状態
- 画面遷移や導線
- 壊してはいけない表示仕様

## コードコピー禁止と共通Component化

MOCK / PROTOTYPE のコードをそのままPRODUCTへ貼り付けません。

PRODUCTでは、MOCK / PROTOTYPE のUI契約、振る舞い、状態、導線を参照し、PRODUCTの責務に合わせて再実装します。

共通Component化は、CodexAppやAIの自己判断だけで確定しません。次のいずれかを満たす場合に、人間がレビューできる形で提案します。

- 人間が明示的に共通Component化を許可している
- PR本文に理由、共有する画面、props設計、本データ接続点、影響範囲、代替案を書いている

共通Component化の最低条件:

- 共通Componentとして切り出す理由がある
- MOCK専用の仮データや仮処理が残っていない
- Product責務に合っている
- props型が明確
- 本データ接続点が明確
- テストまたはPR本文で影響範囲を説明している

## 責務分離の原則

Frontendに置くもの:

- 画面表示
- ユーザー操作
- UI状態
- selected / loading / empty / error の表示
- propsを使った描画
- 業務非依存のイベント通知

Frontendに置かないもの:

- DB取得
- DB保存
- 外部API呼び出し
- 業務計算
- 権限判断
- 永続化
- 本番URL生成
- グラフoption生成
- Repository相当の絞り込み
- Service相当の状態判断

Backendの責務:

- Request: 入力形式の検証
- Action: 1ユースケースの手順
- Repository: DB取得、保存、検索条件、外部データ取得
- Service: 業務判断、計算、状態判断
- DTO / ListDTO: レイヤー間のデータ構造
- Responder / Presenter: Inertia props、表示用配列、URL、グラフ用データの整形
- Test: 画面契約、props、責務境界の固定

React側で表示しやすい形は、Responder / Presenter で作ります。

React側でDBや業務ルールを解釈して帳尻を合わせません。

## MOCKから削ってはいけないもの

PRODUCT化で、次を勝手に削りません。

- Page構成
- Field構成
- Component構成
- 入力欄
- ボタン
- カード
- 表
- グラフ枠
- サムネイル
- 導線
- selected状態
- 選択解除
- 最大選択数
- loading / empty / error
- スクロール範囲
- 表示順
- 上詰め / 中央寄せなどの配置意図
- モバイル縦・横で成立していた操作
- 次画面へ進むための主操作

PRを分ける場合でも、同じUI契約に属する不可分な導線は分断しません。

後回しにしてよいもの:

- DB接続
- 外部API接続
- 重い計算処理
- グラフ生成
- 表示データの詳細化
- UI微調整
- Serviceの詳細計算
- 追加テスト

後回しにしてはいけないもの:

- 画面導線の成立に必要なField
- 主操作
- 選択状態
- 選択解除
- 上限件数
- 表示対象が何か分かる状態
- 次段階へ渡すための土台
- MOCKで確認した操作契約

## PRODUCT化で置き換えるもの

PRODUCT化では、次を置き換えます。

| MOCK / PROTOTYPE | PRODUCT |
|---|---|
| 固定配列 | Repository取得結果 |
| 仮データ | DB / API由来データ |
| 仮の状態変化 | Action / Serviceで定義した状態 |
| 仮の表示整形 | Responder / Presenter |
| 仮の型 | DTO / ListDTO |
| 仮通信 | 本番Route / Request / Action |
| 仮のグラフ値 | Service / Responderで作るグラフ用props |
| 仮URL | Responder / Presenterで生成するURL |

置き換え対象はデータと責務です。

画面構造、主操作、導線を別物に置き換えることではありません。

## レビュー観点

PRでは、次を確認します。

- MOCKで確認したPage / Field / Component構成を維持しているか
- PROTOTYPEで確認した導線を維持しているか
- UIをゼロから作り直していないか
- MOCKにないFieldを勝手に追加していないか
- MOCKにあったFieldを勝手に削っていないか
- ダミーデータが残っていないか
- 仮通信や検証用RouteがProductへ混入していないか
- FrontendがDB取得、外部API、業務計算を持っていないか
- Responder / Presenterが表示用propsを作っているか
- Serviceに業務判断が置かれているか
- RepositoryにDB取得が閉じているか
- テストで重要なpropsと導線が固定されているか
- モバイル縦、モバイル横、タブレット、PCで破綻していないか
- 次PRの機能を混ぜていないか

## 悪い進め方

次は禁止します。

- MOCKを見ずにPRODUCTを作る
- MOCKを参考程度に扱う
- UIをゼロから作り直す
- Field名を勝手に変える
- MOCKにないFieldを増やす
- MOCKにあるFieldを削る
- 導線を勝手に変える
- 画面配置を勝手に変える
- スクロール範囲を勝手に変える
- ダミーデータを残したままPRODUCT化する
- PROTOTYPEの仮通信を本番実装として残す
- Frontendに計算責務を寄せる
- FrontendでURL生成やグラフoption生成を行う
- 次PRの機能を混ぜる
- 案件固有のField名を共通ルールへ大量に入れる

## 案件別補足の扱い

共通ルールには、特定プロジェクト固有のField名、Component名、画面名を大量に入れません。

案件固有のUI契約は、必要に応じて `docs/features/` または `docs/projects/` などの個別文書へ分離します。

共通ルールに置くもの:

- MOCK / PROTOTYPE / PRODUCT の工程
- UI契約の考え方
- 責務分離
- 悪い進め方
- レビュー観点

案件別文書に置くもの:

- 機能固有のField名
- 機能固有の導線
- 機能固有の選択上限
- 機能固有のカード構造
- 機能固有の分析画面
- 機能固有のprops名

## まとめ

MOCKでは、画面を1つずつ作り、画面単体のUI契約を固定します。

PROTOTYPEでは、画面同士の接続、導線、状態の受け渡しを確認します。

PRODUCTでは、MOCK / PROTOTYPEで確認したUI契約、振る舞い、状態、導線を引き継ぎ、固定データ、仮データ、仮通信、仮ロジックを本データ接続と責務分離へ置き換えます。

PRODUCT化とは、UIを捨てて作り直すことではありません。

PRODUCT化とは、UI契約を維持したまま、データと責務を本実装へ差し替えることです。
