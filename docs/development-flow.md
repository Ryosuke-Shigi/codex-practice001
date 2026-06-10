# Development Flow

## このドキュメントの目的

このドキュメントは、このプロジェクトにおけるアイデア整理、UI確認、操作検証、本実装までの段階と、AIを安全に使うための開発手順を明文化するためのものです。

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

各段階は目的が異なります。前段階のコードをそのまま次段階へ昇格させるのではなく、確認できた内容を仕様として抽出して進めます。

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

IDEA BOARDでは完成仕様を断定しません。実装開始条件が揃っていない内容をProductへ直接持ち込みません。

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
- 本番用のAction / Service / Repository

MOCKはUIの種類や目的ごとにタブで整理し、対象UIを見つけやすくします。

タブ例:

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

機能別にタブを分けすぎず、UIの種類や目的で分類します。機能単位の処理検証はPrototypeで扱います。

## PROTOTYPE

PROTOTYPEは、MOCKで確認したUIを使い、画面遷移、操作手順、簡易的なデータの流れを動かして検証する段階です。

扱ってよいもの:

- MOCKと同じUI、デザイン、Common Component
- 仮データ
- 簡易的な状態変化
- 検証用ルート
- 検証用Controller
- 簡易通信
- 画面遷移
- 操作フロー

扱わないもの:

- 本番業務ロジック
- 正式なDB設計
- 本番データの更新
- 本番APIへの更新・削除
- Productと同等の完成判定

速度を優先して一気に作ってよいのはPrototypeまでです。ただし、プロトタイプを完成コードとして扱わず、そのままProductへ昇格させません。

## PRODUCT

PRODUCTは、仕様・責務・データ境界・テストを固定した本実装です。

Product化する前に、Prototypeから次の内容を抽出します。

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
1ユースケース
1つの責務境界
1ブランチ
1Pull Request
必要なテスト
必要なドキュメント更新
```

複数の目的を1つの差分へ混ぜません。

## MOCK・PROTOTYPE・PRODUCTのUI共有

MOCK、Prototype、Productは、同じ見た目やCommon Componentを使用してよいものとします。

ただし、共有するのは業務非依存のUIだけです。

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

MOCKの固定データ、Prototypeの簡易処理、Productの本処理をCommon Componentへ入れません。

## Product実装の基本手順

```text
目的・仕様を固定
    ↓
入力・出力・制約を固定
    ↓
責務と変更範囲を決定
    ↓
必要なテストと失敗条件を定義
    ↓
DTOでレイヤー間のデータ構造を固定
    ↓
ADR / レイヤード構成で実装
    ↓
テスト・ビルド・差分確認
    ↓
Pull Request・CI・レビュー
    ↓
必要なガイドとドキュメントを更新
    ↓
次の1機能へ進む
```

## ハーネスエンジニアリング

このプロジェクトでは、AIへ自由に実装させるのではなく、AIが速く動いても壊れにくい開発環境を作ります。

主なガードレール:

- AGENTS.mdと各docsによる作業範囲の固定
- 指示用まとめによる目的・成功条件・変更対象の固定
- DTOによるレイヤー間契約の固定
- Action / Service / Repository / Responder / Componentの責務分離
- テストによる既存仕様と失敗条件の固定
- Pull RequestとCIによる差分検証
- 人間による完成判定と本番反映判断

ガイドやテストは一度作って終わりではありません。実装中に曖昧さや破壊されやすい境界を発見した場合は、実装と一緒にガイド・テスト・レビュー観点を強化します。

## ADR・レイヤード・テストの扱い

- ADRは重要な設計判断と責務境界に使う
- すべての小変更にADR文書を作らない
- レイヤード化そのものを目的にしない
- 単純処理へ不要なService、Factory、Strategyを増やさない
- テスト数を成果にしない
- 仕様境界、失敗条件、レイヤー間契約、既存機能の破壊検知を優先する

## 完了判定

Productの完了は、コードが動いたことだけでは判断しません。

最低限、次を確認します。

- 目的と成功条件を満たしている
- 失敗条件が扱われている
- 責務境界が崩れていない
- DTOとpropsの構造が明確である
- 必要なテストが成功している
- 既存仕様を壊していない
- 差分が説明可能である
- 不要な変更が混ざっていない
- rollbackまたは修正範囲を判断できる
- 必要なdocsが更新されている

## 参照ドキュメント

- アーキテクチャ: `docs/architecture.md`
- テスト: `docs/testing.md`
- フロントエンド: `docs/frontend.md`
- UI: `docs/ui.md`
- プロトタイプ: `docs/prototype-policy.md`
- 指示用まとめ: `docs/templates/instruction-summary.md`
- PR用まとめ: `docs/templates/pr-summary.md`
