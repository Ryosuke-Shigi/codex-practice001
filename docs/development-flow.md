# Development Flow

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、アイデア整理、UI確認、操作検証、本実装までの段階と、AIを安全に使うための開発手順を明文化します。

AIで一気に完成させることを目的にせず、速く試す段階と、品質を固定する段階を分離します。

## 全体フロー

```text
IDEA BOARD
    ↓
MOCK
    ↓
PROTOTYPE
    ↓
PRODUCT
```

各段階は目的が異なります。

前段階のコードをそのまま次段階へ昇格させるのではなく、確認できた内容を仕様として抽出して進めます。

## IDEA BOARD

IDEA BOARDは、まだ実装対象として確定していない発想を整理する段階です。

扱う内容:

- 何を解決したいか
- 想定利用者
- 必要そうな機能
- 画面イメージ
- 外部APIやデータ候補
- 未確定事項
- 実現可能性を確認するための論点

IDEA BOARDでは完成仕様を断定しません。

次へ進む条件:

- 利用目的を説明できる
- 最初に確認したい画面・UIが決まっている
- 何を見れば採否を判断できるか分かる

## MOCK

MOCKは、UI部品、レイアウト、状態表示、操作感を確認するためのデモです。

扱ってよいもの:

- 固定データ
- Card、Button、Field、ModalなどのUI部品
- タブ、スワイプ、自動送りなどの操作感
- loading、error、empty、selectedなどの状態表示
- スマートフォン縦向き・横向き・PCのレイアウト
- 背景エフェクトや視覚表現

扱わないもの:

- DB保存
- 本番API通信
- 業務判断
- 権限判断
- 正式な状態遷移
- 本番用Action / Service / Repository

MOCKはUIの種類や目的ごとにタブで整理します。

```text
Layout
Card
Field
Modal
Navigation
Swipe / Auto Play
Loading / Error / Empty
Effects
```

機能名だけで分類せず、再利用可能なUIの種類・目的から探せる構成を優先します。

MOCKの完成条件:

- 見た目と情報の優先順位を確認できる
- 主要操作を確認できる
- loading / error / emptyを確認できる
- モバイル縦・横・PCで破綻しない
- 固定データだけで成立している

## PROTOTYPE

PROTOTYPEは、MOCKで確認したUIを使い、画面遷移、操作手順、簡易的なデータの流れを動かして検証する段階です。

扱ってよいもの:

- MOCKと同じUI、デザイン、Common Component
- 仮データ
- 簡易的な状態変化
- 検証用Route / Controller
- 簡易通信
- 画面遷移
- 操作フロー

扱わないもの:

- 本番業務ロジック
- 正式なDB設計
- 本番データ更新
- 本番APIへの更新・削除
- Productと同等の完成判定

速度を優先して一気に作ってよいのはPrototypeまでです。

ただし、速く作れたことを完成判定に使いません。

Prototypeの目的は、完成コードを作ることではなく、Productで正式に作る仕様と機能分割を確認することです。

Prototypeの完成条件:

- 画面遷移と操作順を確認できる
- 必要な入力・出力が見える
- 成功条件・失敗条件を抽出できる
- Product化する単位へ分割できる

## PRODUCT

PRODUCTは、仕様・責務・データ境界・テストを固定した本実装です。

Product化する前に、Prototypeから次を抽出します。

- 目的
- 入力
- 出力
- 画面導線
- 成功条件
- 失敗条件
- バリデーション
- 業務ルール
- 権限
- 実装しないこと
- テスト観点

Productは1機能・1ユースケースずつ追加します。

基本単位:

```text
1目的
1ユースケース
1つの責務境界
1ブランチ
1Pull Request
必要なテスト
必要なドキュメント更新
```

同じ目的を成立させるために不可分なDTO、Service、Repository、Responder、Component、Testは同じPRへ含めてよいものとします。

複数目的は混ぜません。

## UI共有

MOCK、Prototype、Productは、同じ見た目やCommon Componentを使用してよいものとします。

共有するのは業務非依存UIだけです。

```text
Common UI
    ↑
MOCK Feature Component
    ↑
固定データ
```

```text
Common UI
    ↑
Prototype Feature Component
    ↑
仮データ・簡易フロー
```

```text
Common UI
    ↑
Product Feature Component
    ↑
Responder / DTO / Action / Service / Repository
```

Commonへ入れないもの:

- MOCKの固定データ
- Prototypeの簡易処理
- Productの業務判断
- API通信
- DB操作
- 権限判断
- 状態遷移の可否判断

## Product実装の基本手順

```text
AGENTS.md / docs/index.mdで作業分類
    ↓
必要な共通docs・feature docs・対象コードだけを読む
    ↓
目的・仕様・実装しないことを固定
    ↓
入力・出力・制約を固定
    ↓
責務と変更範囲を決定
    ↓
必要なテストと失敗条件を定義
    ↓
DTOでレイヤー間のデータ構造を固定
    ↓
ADR Pattern / レイヤード構成で実装
    ↓
対象テスト・関連テスト・全体テスト・build
    ↓
Pull Request・CI・責務レビュー
    ↓
必要な共通docs・feature docsを更新
    ↓
理解再起動用まとめへ圧縮
    ↓
次の1機能へ進む
```

## ADR PatternとDecision Record

このプロジェクトのADR PatternはAction - Domain - Responderを指します。

設計判断の記録は `Decision Record` または `設計判断記録` と呼びます。

Decision Recordを検討する対象:

- 責務境界を変更する
- 永続化方式を変更する
- 外部API境界を変更する
- 将来影響の大きい案を選ぶ
- 却下理由を残さないと同じ議論を繰り返す

すべての小変更に設計判断記録を作りません。

## コンテキスト管理

AIへ毎回リポジトリ全体、全docs、長い会話履歴を渡しません。

作業開始時:

```text
AGENTS.md
    ↓
docs/index.md
    ↓
今回の段階・目的・対象機能を特定
    ↓
必要な共通docsとfeature docsだけを確認
    ↓
名前・Route・Class・Testで検索
    ↓
対象ファイルと依存先だけを確認
```

作業後は会話履歴をそのまま引き継がず、検証済み事実へ圧縮します。

詳細は `docs/context-management.md` に従います。

## 理解再起動用まとめ

最低限、次を残します。

```text
Base branch:
Base commit:
Created at:
Related PR:
Invalid when:
現在地:
目的:
完了済み:
未完了:
入口:
主要責務:
処理フロー:
変更ファイル:
テストで固定した仕様:
確認結果:
次に読む場所:
注意点:
次の作業:
```

古いまとめを現在の仕様として使わないため、基準commitと無効になる条件を残します。

長期保存するGPT情報源には一時的なcommit SHAを入れません。

## ハーネスエンジニアリング

AIへ自由に実装させるのではなく、AIが速く動いても壊れにくい環境を作ります。

主なガードレール:

- `AGENTS.md` と `docs/index.md` による入口固定
- 共通docsとfeature docsによる責務・仕様の分離
- コンテキスト管理による読み込み範囲の限定
- 指示用まとめによる目的・成功条件・変更対象の固定
- DTOによるレイヤー間契約の固定
- Action / Service / Repository / Responder / Componentの責務分離
- テストによる仕様と失敗条件の固定
- Pull RequestとCIによる差分検証
- 理解再起動用まとめによる次回作業の入口固定
- 人間による完成判定・merge・本番反映判断

ガイドやテストは一度作って終わりではありません。

実装中に曖昧さや壊れやすい境界を見つけた場合は、実装と一緒にガイド・テスト・レビュー観点を強化します。

## レイヤード・テストの扱い

- レイヤード化そのものを目的にしない
- 単純処理へ不要なService、Factory、Strategyを増やさない
- テスト数を成果にしない
- 仕様境界、失敗条件、レイヤー間契約、既存機能の破壊検知を優先する
- テスト成功だけで責務が正しいとは判断しない
- 機能固有条件を共通docsへ書き込みすぎない

## Product完了判定

最低限、次を確認します。

- 目的と成功条件を満たしている
- 失敗条件が扱われている
- 責務境界が崩れていない
- DTOとpropsの構造が明確
- 必要なテストが成功している
- CIが成功している、またはCIがないことを明示している
- 既存仕様を壊していない
- 差分と影響範囲を説明できる
- 不要な変更が混ざっていない
- rollbackまたは修正範囲を判断できる
- 必要な共通docs・feature docsが更新されている
- 次回の理解再起動に必要な情報が残っている

## 参照ドキュメント

- 文書索引: `docs/index.md`
- コンテキスト管理: `docs/context-management.md`
- アーキテクチャ: `docs/architecture.md`
- テスト: `docs/testing.md`
- フロントエンド: `docs/frontend.md`
- UI: `docs/ui.md`
- プロトタイプ: `docs/prototype-policy.md`
- 機能固有仕様: `docs/features/`
- 指示用まとめ: `docs/templates/instruction-summary.md`
- PR用まとめ: `docs/templates/pr-summary.md`
