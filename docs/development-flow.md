# Development Flow

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-13

## このドキュメントの目的

このドキュメントは、発想から本実装までの段階、各段階の完成条件、次へ進む条件、Product実装の基本手順を定めます。

MOCK / Prototypeのディレクトリ、Route、削除、Productとの物理的分離は `docs/prototype-policy.md` を正本とします。

MOCKで作る画面単体、PROTOTYPEで作る画面間の接続、PRODUCTへ引き継ぐUI契約は `docs/ui-development-flow.md` を正本とします。

IDEA BOARD / MOCK のMarkdownテンプレートと、タイトル / タブ / タブ内インデックス / 内容表示エリアの共通画面構造は `docs/templates/idea-board-and-mock-template-policy.md` を正本とします。

実装作法、型、命名、format / typecheck の確認は `docs/coding-standards.md` を正本とします。

MDルーターの詳細は `docs/ai/workflows/md-router.md` を正本とします。

開発フロー、docs構成、feature docs、運用手順が変わった場合は、作業後にMDルーターの追加・削除・修正が必要か確認します。

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

各段階は目的が異なります。前段階の仮データ、仮通信、仮ロジックをそのまま次段階へ昇格させず、確認できた内容を仕様として抽出して進めます。

ただし、MOCKで確認した画面単体のUI構造と、PROTOTYPEで確認した画面間の導線は、`docs/ui-development-flow.md` に従ってProductへ引き継ぎます。

## Project Select / Project Hub

既存TOPのSTART後の正規入口は Project Select です。

Project Select から各 Project の Project Hub へ入り、Project Hub で Project ごとの Stage / Module を確認します。

Project / Stage / Module の一覧は `resources/js/Components/ProjectHub/projectData.ts` の静的TypeScriptデータで管理し、Project Select / Project Hub はDB/APIへ接続しません。

現時点では PROTOTYPE stage は未作成のため表示しません。旧Lab入口、旧Project選択、旧MOCK選択は Project Select / Project Hub へ整理済みです。

現在作成中の新しい工事発注管理システムの IDEA BOARD / MOCK は削除対象ではなく、Project Hub から入る現行Moduleとして扱います。

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

IDEA BOARD作成時は `docs/templates/idea-board-template.md` を参照し、文字、表、フローチャート中心で整理します。

次へ進む条件:

- 利用目的を説明できる
- 最初に確認したい画面やUIが決まっている
- 何を見れば採否を判断できるか分かる

## MOCK

固定データでUI部品、レイアウト、状態表示、操作感を確認する段階です。

MOCKでは、画面を1つずつ作り、画面単体のUI契約を固定します。

MOCK作成時は `docs/templates/mock-template.md` を参照し、固定データでUI、状態表示、操作感を確認します。

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
- Productへ引き継ぐPage / Field / Component / layout / scroll構造を説明できる

## PROTOTYPE

MOCKで確認したUIを使い、画面遷移、操作手順、簡易的なデータの流れを検証する段階です。

PROTOTYPEでは、MOCKで作った画面同士の接続、導線、状態の受け渡しを確認します。

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
- 本番APIへの変更操作
- Productと同等の完成判定

速度を優先して一気に作ってよいのはPrototypeまでです。ただし、速く作れたことを完成の根拠にしません。

Prototypeの完成条件:

- 画面遷移と操作順を確認できる
- 必要な入力・出力・失敗条件を抽出できる
- Product化する単位へ分割できる
- 仮処理と正式仕様を区別できる
- Productへ引き継ぐ導線と状態受け渡しを説明できる

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
- 実装作法・型・コメント
- テスト観点
- MOCKから引き継ぐ画面単体のUI構造
- PROTOTYPEから引き継ぐ画面間の導線
- PROTOTYPEで確認した振る舞い
- PRODUCTで先にTestへ固定する仕様

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

## PRODUCT実装前の責務配置

PRODUCT実装では、コードを書き始める前に責務の置き場を固定します。

先に決めるもの:

- 入口はどこか
- Controller は何を受けるだけか
- Request は何を検証するか
- Action はどのユースケース手順を持つか
- Service はどの業務判断を持つか
- Repository は何を取得・保存するか
- DTO / ListDTO は何を運ぶか
- Responder は何を画面・API向けに整形するか
- Test は何を仕様として固定するか

ディレクトリやファイルは、責務の置き場を決めてから作成します。

ディレクトリを先に作るのではなく、責務配置を先に決めます。

## MOCK / PROTOTYPE では作りすぎない

MOCK段階では、Repository / Service / DTO / Responder を先に作り込みません。

MOCKは画面単体と導線確認を優先します。

PROTOTYPE段階では、画面間接続、props、fixture、操作感の確認を優先します。

ADR Pattern / レイヤードに沿った本格的なディレクトリ作成は、PRODUCT実装段階で行います。

## docs成長ルール

docsは実装と分離した古い説明書ではなく、使っていくうちに成長する保守資産として扱います。機能を追加、変更、削除した場合は、コードだけでなくdocs、ガイド、テスト、コメント、型も必要に応じて更新します。

### 追加時

追加時は、次を確認します。

- 新しい責務、入力、出力、状態、導線がどこに置かれるか
- バリデーション、業務判断、表示整形、UI状態の境界が既存docsと矛盾しないか
- feature docs、README、操作ガイド、Project Hub説明へ反映が必要か
- テストで固定すべきService判断、Request validation、DTO境界、Responder props、UI状態があるか
- PHPDoc、JSDoc、TypeScript型で意図と変更時の注意を回収できるか

### 変更時

変更時は、次を確認します。

- 既存docsと現在仕様が矛盾していないか
- 既存テストが古い仕様を固定していないか
- コメント、PHPDoc、JSDoc、TypeScript型が古くなっていないか
- フロントエンドとバックエンドの責務分担が崩れていないか
- 変更理由をコード、テスト、docsから回収できるか

### 削除時

削除時は、次を確認します。

- Route、Controller、Request、Action、Service、Repository、DTO、Responderへの参照
- Page、Feature Component、Common Component、Hook、Type、Utilityへの参照
- Test、feature docs、README、ガイド、Project Hub導線への参照
- unused import、command、scheduler、queue、configへの参照
- 削除した仕様を参照する古いコメントや型が残っていないか

## Product実装の基本手順

```text
AGENTS.md / docs/ai/index.md / docs/index.mdで作業分類
    ↓
必要な共通docs・feature docs・対象コードを確認
    ↓
UI作業では docs/ui-development-flow.md で引き継ぐUI契約を確認
    ↓
docs/coding-standards.md と docs/commenting.md で実装作法・型・コメント条件を確認
    ↓
目的・入力・出力・実装しないことを固定
    ↓
成功条件・失敗条件・責務境界を固定
    ↓
責務配置を固定
    ↓
PROTOTYPEで確認済みの振る舞いをPRODUCTで守る仕様として先にTestへ記述
    ↓
DTOでレイヤー間のデータ構造を固定
    ↓
ADR Pattern / レイヤード構成で実装
    ↓
実装内容に合わせて必要な共通docs・feature docsを更新
    ↓
対象テスト → 関連テスト → format check → TypeScript / TSX変更時に必要なtypecheck → 全体テスト → build
    ↓
Pull Request・CI・差分・責務レビュー
    ↓
必要なdocs、コメント、型、テストを更新し、次回読む場所を明確にする
```

作業中に対象ファイル、入口となる Route / Action / Component / Command、責務境界、確認コマンドを特定できない場合は、探索範囲を広げて試行錯誤しません。docs とコード、feature docs と共通docs、指示内容とPR差分に矛盾がある場合も、代替実装へ進まず停止して人間の判断を待ちます。

## UI共有

MOCK、Prototype、Productは、同じ業務非依存のCommon ComponentやEffectsを利用してよいものとします。

UI作業では、MOCKで画面単体を作り、PROTOTYPEで画面同士をつなぎ、PRODUCTでUI構造を引き継いだうえで本データと責務分離へ接続します。

共有しないもの:

- MOCKの固定データ
- Prototypeの簡易処理
- Productの業務判断
- API通信・DB操作
- 権限判断・状態遷移判断

具体的なUI契約の引き継ぎ方は `docs/ui-development-flow.md`、配置と削除境界は `docs/prototype-policy.md`、Commonの責務は `docs/ui.md` に従います。

## テストとレビュー

共通テスト方針は `docs/testing.md` に従います。

PRODUCT化では、PROTOTYPEで確認した振る舞いを先にTestへ固定します。並び順、pagination props、表示補助データ、モバイル固有操作等は挙動が明確になった後に固定してよいものとします。

テスト成功だけで責務分離が正しいとは判断せず、差分レビューで不要な依存、責務混在、過剰な抽象化を確認します。

UI作業では、MOCKで確認したPage / Field / Component構成、PROTOTYPEで確認した導線、Productで置き換えたpropsをレビュー対象に含めます。

実装作業では、型宣言、PHPDoc / JSDoc、nullable、`any`、型アサーション、format / typecheck の確認結果もレビュー対象に含めます。

PR確認時のレビュー強度は `docs/operations/pr-review-strength.md` に従い、作業種別、影響範囲、失敗時の危険度から先に判定します。

## ハーネスエンジニアリング

作業者や支援ツールが自由に変更を広げるのではなく、速く動いても壊れにくく、間違いを検知しやすい環境を作ります。

主なガードレール:

- `AGENTS.md`、`docs/ai/index.md`、`docs/index.md` による入口固定
- `docs/ai/workflows/md-router.md` による作業種別ごとの参照範囲固定
- 共通docsとfeature docsによる責務・仕様の分離
- 明示された作業条件による対象・成功条件・失敗条件の固定
- DTOによるデータ契約
- MOCK / PROTOTYPE / PRODUCTのUI契約
- Action / Service / Repository / Responder / Componentの責務分離
- Coding Standardsによる実装作法・型・命名の固定
- テストによる実行可能な仕様
- format check / TypeScript / TSX変更時に必要なtypecheck / buildによる機械確認
- Pull RequestとCIによる差分検証
- docs、コメント、型、テストによる次回作業の入口固定
- 人間による完成判定・merge・本番反映判断

## 関連文書

- MOCK / Prototypeの配置・削除: `docs/prototype-policy.md`
- MOCK / PROTOTYPE / PRODUCT UI作成工程: `docs/ui-development-flow.md`
- IDEA BOARD / MOCK 共通作成ルール: `docs/templates/idea-board-and-mock-template-policy.md`
- IDEA BOARDテンプレート: `docs/templates/idea-board-template.md`
- MOCKテンプレート: `docs/templates/mock-template.md`
- MDルーター: `docs/ai/workflows/md-router.md`
- 責務境界: `docs/architecture.md`
- 実装作法: `docs/coding-standards.md`
- コメント: `docs/commenting.md`
- テスト: `docs/testing.md`
- UI: `docs/ui.md`
- フロントエンド: `docs/frontend.md`
- コンテキスト管理: `docs/context-management.md`
- PRレビュー強度: `docs/operations/pr-review-strength.md`
