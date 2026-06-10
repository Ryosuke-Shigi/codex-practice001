# プロトタイプ運用ルール

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-10

## 目的

MOCKとPROTOTYPEをProductから分離して管理するため、配置、Route、共有範囲、Product化の境界を定めます。

段階の目的・完成条件・遷移条件は `docs/development-flow.md` を正本とします。

## 配置

```text
src/resources/js/Pages/Mocks/
src/resources/js/Components/Mocks/
src/resources/js/Pages/Prototypes/
src/resources/js/Components/Prototypes/
src/app/Http/Controllers/Prototype/
src/routes/prototypes.php
```

業務非依存の共通UIは `src/resources/js/Components/Common/` に置きます。

既存配置が異なる場合は、新しい並行構成を増やさず、現在のコードと `docs/ui.md` を確認します。

## Route

Prototype用Routeは `src/routes/prototypes.php` に分離します。

- URLは `/prototypes/...` 配下
- Route名は `prototypes.` 配下
- 正式機能のRouteやControllerへ検証処理を混ぜない
- MOCKがフロントだけで完結する場合はLaravelへの再通信を増やさない

## 共有範囲

共有してよいもの:

- Button、Card、Field、Modal
- Layout、theme、Effects
- loading、error、empty、selected等の汎用UI状態

共有しないもの:

- MOCKの固定データ
- Prototypeの仮データ・簡易通信
- Prototype専用URLや状態変化
- Productの業務判断・権限判断
- DB・外部APIに関する機能固有処理

## Product化

PrototypeからProductへ渡すのはコードではなく、検証済みの仕様です。

目的、入力・出力、画面導線、成功条件・失敗条件、バリデーション、業務ルール、実装しないこと、責務、テスト観点を抽出し、1機能・1ユースケース単位で実装します。

## 関連文書

- 開発段階・完成条件: `docs/development-flow.md`
- UI / Common Component: `docs/ui.md`
- React / Inertia / TypeScript: `docs/frontend.md`
- Productの責務境界: `docs/architecture.md`
- Productのテスト: `docs/testing.md`
