# プロトタイプ運用ルール

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-12

## 目的

この文書は、MOCKとPROTOTYPEをProductから分離して管理するための配置、Route、共有範囲、Product化の境界を定めます。

開発段階の目的・完成条件・遷移条件は `docs/development-flow.md` を正本とします。

MOCKで作る画面単体、PROTOTYPEで作る画面間の接続、PRODUCTへ引き継ぐUI契約は `docs/ui-development-flow.md` を正本とします。

## 配置

以下の配置は、GitHub上の `codex-practice001` リポジトリルートから見た相対パスです。
Docker構成側の作業ルートから参照する場合は、各パスの先頭に `src/` を付けます。

```text
resources/js/Pages/Mocks/
resources/js/Components/Mocks/
resources/js/Pages/Prototypes/
resources/js/Components/Prototypes/
app/Http/Controllers/Prototype/
routes/prototypes.php
```

複数段階で実際に使う業務非依存UIは `resources/js/Components/Common/` に置きます。

既存の配置が異なる場合は、並行する新構成を増やさず、現在のコードと `docs/ui.md` を確認します。

## Route

Prototype用Routeは `routes/prototypes.php` に分離します。

- URLは `/prototypes/...` 配下
- Route名は `prototypes.` 配下
- 本番用RouteやControllerへ検証処理を混ぜない
- MOCKがフロントだけで完結する場合はLaravelへの再通信を増やさない

## 共有範囲

共有してよいもの:

- Button、Card、Field、Modal
- Layout、theme、Effects
- loading、error、empty、selected等の汎用UI状態
- MOCKで確定した画面単体のUI構造
- PROTOTYPEで確認した画面間の導線

共有しないもの:

- MOCKの固定データ
- Prototypeの仮データ・簡易通信
- Prototype専用URLや状態変化
- Productの業務判断・権限判断
- DB・外部APIに関する機能固有処理

Common Componentの詳細は `docs/ui.md` に従います。

UI契約の引き継ぎ方は `docs/ui-development-flow.md` に従います。

## Product化

PrototypeからProductへ渡すのは、仮通信や仮ロジックではなく、検証済みの仕様、UI構造、導線です。

Product化前に次を抽出します。

- 目的
- 入力・出力
- 画面導線
- 成功条件・失敗条件
- バリデーション
- 業務ルール・権限
- 実装しないこと
- 必要な責務
- テスト観点
- MOCKから引き継ぐPage / Field / Component構成
- PROTOTYPEから引き継ぐ画面間の接続と状態受け渡し

UI構造、導線、状態、振る舞いは、MOCK / PROTOTYPEを参照しながらProductの責務に合わせて再実装します。

ただし、固定データ、仮データ、簡易通信、検証用Route、検証用Controller、仮ロジックをそのままProductへ昇格しません。

抽出後、1機能・1ユースケース単位に分け、`docs/architecture.md`、`docs/testing.md`、`docs/ui-development-flow.md` に従って実装します。

## 検証終了時の確認

- MOCK / Prototype専用のPage、Component、Controller、Route、仮データを特定できる
- Productへ引き継ぐUI構造と、破棄する仮処理を区別できる
- ProductコードとCommon Componentの利用箇所を説明できる
- Prototype専用の設定や入口が残っていない
- Productのbuildと既存テストへ影響がない

## 関連文書

- 開発段階・完成条件: `docs/development-flow.md`
- MOCK / PROTOTYPE / PRODUCT UI作成工程: `docs/ui-development-flow.md`
- UI / Common Component: `docs/ui.md`
- React / Inertia / TypeScript: `docs/frontend.md`
- Productの責務境界: `docs/architecture.md`
- Productのテスト: `docs/testing.md`
