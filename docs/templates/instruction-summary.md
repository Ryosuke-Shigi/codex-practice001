# 指示用まとめテンプレート

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-13

## このテンプレートの目的

このテンプレートは、CodexAppへ渡す実装前ゲートとして、今回固有の目的・範囲・成功条件・失敗条件・責務・テスト観点を1ブロックへ圧縮するためのものです。

共通ルールを毎回全文コピーせず、`AGENTS.md`、`docs/index.md`、必要な共通docs・feature docsを参照します。

## 使用ルール

CodexAppへ渡す指示用まとめは、必ず完全な1つのmarkdownブロックだけにまとめます。

ブロック外の説明文、補足、会話文は実装指示として扱いません。補足が必要な場合は、ブロック外へ追記せず、指示用まとめの中に項目として含めます。

次の指示用まとめは使用しません。

- 途中で切れている
- 複数ブロックに分かれている
- ブロック外に実装指示に見える補足がある
- `## 完了後に報告すること` まで含まれていない

不足がある場合は、部分追記や別ブロックで補わず、完全な1つのmarkdownブロックとして再生成してから使います。

## 出力ルール

- 1つのmarkdownブロックにまとめる
- 長い読み物にしない
- 今回触る範囲だけを書く
- 実装しないことを必ず書く
- 成功条件と失敗条件を必ず書く
- TDD / テスト観点を必ず書く
- 実装作法・型・コメントの確認観点を必ず書く
- 確認コマンドを必ず書く
- docs更新要否を必ず書く
- 推測や未確認事項を断定しない
- 共通方針は文書参照で済ませる
- 現状分析や会話用の補足を混ぜない
- 機能固有条件は該当する `docs/features/` を参照する

## テンプレート

```md
# 指示用まとめ：<タイトル>

対象：
- <今回の機能・画面・処理>

目的：
- <何を成立させるか>

前提：
- 共通方針は `AGENTS.md` と `docs/index.md` に従う
- 実装作法は `docs/coding-standards.md`、コメントは `docs/commenting.md` に従う
- Docker経由コマンドとGit境界は `docs/operations/command-registry.md` に従う
- <今回読む必要がある共通docs>
- <今回読む必要があるdocs/features>
- <検証済みの現在状態>

作業ブランチ：
- `<branch-name>`

UI作成工程：
- MOCK：<画面単体で確認済みのUI契約>
- PROTOTYPE：<画面間の導線・状態受け渡し・振る舞い>
- PRODUCT：<本データと責務分離へ接続する範囲>
- 引き継ぐUI契約：<Page / Field / Component / layout / scroll / 状態表示>
- 引き継ぐ振る舞い：<画面遷移・操作・状態変化>
- 引き継がない仮処理：<固定データ・仮通信・仮ロジック>
- PRODUCTで先に固定するTest：<実装前に固定する仕様>

触る範囲：
- <対象ファイル・ディレクトリ・責務>

成功条件：
- <正常時に成立すること>

失敗条件：
- <止める条件・異常時の結果・壊してはいけないこと>

責務分離：
- Controller / Request：<入口・形式検証>
- Command Action / Query Action：<状態変更または参照ユースケースの手順>
- Service：<業務判断>
- DB Repository：<DB取得・保存・更新・削除>
- External API Repository：<外部通信・外部レスポンスDTO化>
- DTO / ListDTO：<受け渡すデータ>
- Responder：<出力整形>
- Job / Artisan Command / Scheduler：<実行入口>
- Feature Component：<機能固有UI>
- Common Component：<業務非依存UI>
- <使わない責務は削除する。不要な層は追加しない>

コメント / PHPDoc / features docs / Test の役割：
- Action PHPDoc：<ユースケース、呼び出すService、成功条件>
- Service PHPDoc：<業務判断、入力、出力、置かない責務>
- Service内コメント：<なぜその条件・計算・比較なのか>
- docs/features/：<人間が読む業務仕様、UI契約、禁止事項>
- Test：<実行可能な仕様固定>

実装作法・型・コメント：
- PHP：<型宣言、PHPDoc、@param / @return / @throws、Pint確認>
- TypeScript：<props型、nullable、any禁止、type/interface、型アサーション>
- JavaScript：<JSを増やす場合の理由、jQuery混在有無>
- React / UI：<Component責務、Common化、UI状態、アクセシビリティ>
- CSS / Tailwind：<className、responsive、inline style、z-index>

実装しないこと：
- <今回対象外の機能・ファイル・設計変更>
- <代替実装として勝手に採用してはいけないもの>

TDD / テスト観点：
- <成功条件を固定するテスト>
- <失敗条件を固定するテスト>
- <既存仕様の回帰確認>
- <テスト不要の場合は理由>

README / docs 更新要否：
- README：<更新内容または不要な理由>
- 共通docs：<更新内容または不要な理由>
- feature docs：<更新内容または不要な理由>
- AGENTS.md：<更新内容または不要な理由>

確認コマンド：
- docsのみ：`cd /var/www/api-discovery-hub/src && git diff --check`
- PHP / Laravel変更：`cd /var/www/api-discovery-hub && docker compose exec php-fpm php artisan test`
- PHP format確認：`cd /var/www/api-discovery-hub && docker compose run --rm composer format-check`
- React / TypeScript変更：`cd /var/www/api-discovery-hub && docker compose run --rm npm npm run test:run`
- 画面変更：`cd /var/www/api-discovery-hub && docker compose run --rm npm npm run build`
- TypeScript / TSX変更時に必要な場合のみ `cd /var/www/api-discovery-hub && docker compose run --rm npm npm run typecheck`
- <今回不要なコマンドは理由を書いて削る>

実装順：
1. <最初に確認すること>
2. <テストまたは実装順>
3. <差分・ビルド・テスト確認>

## 完了後に報告すること
- 変更ファイル
- 各ファイルの責務
- 実行した確認コマンドと結果
- CI / status checkの状態
- 未完了事項
- docs更新内容
- 次に読む場所
```

## 圧縮ルール

指示用まとめへ毎回書くもの:

- 今回の目的
- 今回の対象
- 今回の成功条件・失敗条件
- 今回の責務境界
- 今回の実装作法・型・コメントの確認観点
- 今回実装しないこと
- 今回必要なテスト
- 今回の確認コマンド

文書参照で済ませるもの:

- Git運用全般
- 共通アーキテクチャ
- 共通DTO方針
- 共通UI方針
- 共通実装作法
- 共通コメント方針
- 共通セキュリティ方針
- MOCK / Prototype / Productの共通定義
- 機能固有の長い仕様

## 用語

- ADR PatternはAction - Domain - Responderを指す
- 設計判断記録はDecision Recordと呼ぶ
- Architecture Decision Recordの意味でADRとだけ書かない
- 状態変更のActionはCommand Action、参照処理のActionはQuery Actionと呼ぶ
- Laravelのコンソール入口はArtisan Commandと呼ぶ

## 注意

このテンプレートは、全ての欄を機械的に長く埋めるためのものではありません。

今回必要な責務だけを残し、対象外の層は削除します。

目的は文章量を増やすことではなく、CodexAppが対象範囲を誤らず、人間が差分をレビューできる状態を作ることです。
