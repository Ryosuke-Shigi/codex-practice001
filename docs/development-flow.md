# Development Flow

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## このドキュメントの目的

このドキュメントは、発想から本実装までの段階、各段階の完成条件、次へ進む条件、Product実装の基本手順を定めます。

MOCK / Prototypeのディレクトリ、Route、削除、Productとの物理的分離は `docs/prototype-policy.md` を正本とします。

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

各段階は目的が異なります。前段階のコードをそのまま次段階へ昇格させず、確認できた内容を仕様として抽出して進めます。

## IDEA BOARD

発想、目的、想定利用者、未確定事項、調査対象を整理する段階です。

扱う内容:

- 解決したいこと
- 想定利用者と利用場面
- 必要そうな画面・機能
- 外部APIやデータ候補
- 技術的な確認事項
- 未確定事項・採用しない可能性がある案

この段階では完成仕様や本番構成を断定しません。

次へ進む条件:

- 利用目的を説明できる
- 最初に確認したい画面やUIが決まっている
- 何を見れば採否を判断できるか分かる

## MOCK

固定データでUI部品、レイアウト、状態表示、操作感を確認する段階です。

扱ってよいもの:

- Card、Button、Field、Modal
- Tab、Navigation、Swipe、Auto Play
- loading、error、empty、selected
- モバイル縦、モバイル横、タブレット、PC
- 背景エフェクト

扱わないもの:

- DB保存
- 本番API通信
- 業務判断・権限判断
- 正式な状態遷移
- 本番用Action、Service、Repository

MOCKの完成条件:

- 情報の優先順位と見た目を判断できる
- 主要操作と状態表示を確認できる
- 各表示幅で破綻しない
- 固定データだけで成立する

## PROTOTYPE

MOCKで確認したUIを使い、画面遷移、操作手順、簡易的なデータの流れを検証する段階です。

扱ってよいもの:

- MOCKと同じUI、Common Component
- 仮データ・簡易通信
- 検証用Route / Controller
- 簡易的な状態変化
- 画面遷移・操作フロー

扱わないもの:

- 本番業務ロジック
- 正式なDB設計
- 本番データ更新
- 本番APIへの更新・削除
- Productと同等の完成判定

速度を優先して一気に作ってよいのはPrototypeまでです。ただし、速く作れたことを完成の根拠にしません。

Prototypeの完成条件:

- 画面遷移と操作順を確認できる
- 必要な入力・出力・失敗条件を抽出できる
- Product化する単位へ分割できる
- 仮処理と正式仕様を区別できる

## PRODUCT

仕様・責務・データ境界・テストを固定した、長く保守する本実装です。

Product化前に固定するもの:

- 目的
- 入力・出力
- 画面導線
- 成功条件・失敗条件
- バリデーション
- 業務ルール・権限
- 実装しないこと
- 責務境界
- テスト観点

基本単位:

```text
1目的
1機能または1ユースケース
必要なレイヤー一式
1ブランチ
1Pull Request
必要なテスト
必要なdocs更新
```

同じ目的を成立させるために不可分なAction、Service、Repository、DTO、Responder、Component、Testは同じPRへ含めてよいものとします。複数目的は混ぜません。

## Product実装の基本手順

```text
AGENTS.md / docs/index.mdで作業分類
    ↓
必要な共通docs・feature docs・対象コードを確認
    ↓
目的・入力・出力・実装しないことを固定
    ↓
成功条件・失敗条件・責務境界を固定
    ↓
重要な境界をテストで固定
    ↓
DTOでレイヤー間のデータ構造を固定
    ↓
ADR Pattern / レイヤード構成で実装
    ↓
実装内容に合わせて必要な共通docs・feature docsを更新
    ↓
対象テスト → 関連テスト → 全体テスト → build
    ↓
Pull Request・CI・差分・責務レビュー
    ↓
理解再起動用まとめへ圧縮
```

## UI共有

MOCK、Prototype、Productは、同じ業務非依存のCommon ComponentやEffectsを利用してよいものとします。

共有しないもの:

- MOCKの固定データ
- Prototypeの簡易処理
- Productの業務判断
- API通信・DB操作
- 権限判断・状態遷移判断

具体的な配置と削除境界は `docs/prototype-policy.md`、Commonの責務は `docs/ui.md` に従います。

## テストとレビュー

共通テスト方針は `docs/testing.md` に従います。

重要な境界は実装前または実装と同時に固定し、並び順、pagination props、表示補助データ、モバイル固有操作等は挙動が明確になった後に固定してよいものとします。

テスト成功だけで責務分離が正しいとは判断せず、差分レビューで不要な依存、責務混在、過剰な抽象化を確認します。

## ハーネスエンジニアリング

AIへ自由に実装させるのではなく、AIが速く動いても壊れにくく、間違いを検知しやすい環境を作ります。

主なガードレール:

- `AGENTS.md` と `docs/index.md` による入口固定
- 共通docsとfeature docsによる責務・仕様の分離
- 指示用まとめによる対象・成功条件・失敗条件の固定
- DTOによるデータ契約
- Action / Service / Repository / Responder / Componentの責務分離
- テストによる実行可能な仕様
- Pull RequestとCIによる差分検証
- 理解再起動用まとめによる次回作業の入口固定
- 人間による完成判定・merge・本番反映判断

## 関連文書

- MOCK / Prototypeの配置・削除: `docs/prototype-policy.md`
- 責務境界: `docs/architecture.md`
- テスト: `docs/testing.md`
- UI: `docs/ui.md`
- フロントエンド: `docs/frontend.md`
- コンテキスト管理: `docs/context-management.md`
