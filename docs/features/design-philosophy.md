# 設計思想ページ

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / 公開設計思想ページ
- Last reviewed: 2026-11-29

## 目的・現在の段階

PRODUCTの公開ページとして、開発者の設計思想と確認済みの実装事例を伝える。
冒頭と「アーキテクチャ」「変更への対応」「理解再起動」「開発と品質」「AI駆動開発・ハーネス」をこの順に表示する。
通常表示は画像・見出し・短文に絞り、要点・技術図・事例を各節直下の詳細へ置く。章番号は表示しない。

## 主な入口・データ

- Route: `GET /design-philosophy`。作品への `/projects` とトップ `/` の既存導線を維持する。
- 入力: `config/design_philosophy.php` の固定9キー、`enabled`、`sort_order` と表示メタデータ。
- 出力: `sections` Inertia props。DTOのkey・sortOrder・eyebrow・title・lead・bodyの形は維持する。
- このページのためのDB・Model・Migration・外部API・Storage管理機構は持たない。
- Artisan Command、Scheduler、Queue、Event、Notification、機能専用ログ、追加secretsは該当なし。

## 責務配置

| 対象 | 責務 |
| --- | --- |
| `GetDesignPhilosophySectionsAction` | 対応する固定キーから有効な章を選び、設定順でDTOを渡す |
| `DesignPhilosophySectionDTO` / `DesignPhilosophyResponder` | 1章分の値と既存Inertia propsを整える |
| `Pages/DesignPhilosophy/Index.tsx` | props、公開Layout、ページmetaの接続 |
| `philosophyTopics.ts` | 画面内の5節と有効な旧章、旧群アンカーを対応付ける |
| `DesignPhilosophyView` / `Hero` | ページ構成、通常表示、旧hash到達、停止・再生 |
| `PhilosophyTopicDetail` | 詳細の文章と実コードに沿ったDOM技術図 |
| `PhilosophyDetails` | native detailsの開閉、連打、フォーカス復帰、短い開閉演出 |
| `PhilosophyIllustration` | 静的素材のsrcset・寸法・読込優先度 |
| `useDesignPhilosophyMotion` / `philosophyOverview.css` | 内容を隠さないスクロール強調と、停止・軽減時の静止表示 |

通常用短文と詳細の文章はFrontendの表示責務内で分ける。新しい汎用セクション管理やprops拡張は行わない。

## 表示設定・旧リンクの互換

| 表示単位 | 使用する既存キー |
| --- | --- |
| 冒頭 | `hero` |
| アーキテクチャ・変更への対応・理解再起動 | 3節とも `architecture` を共有 |
| 開発と品質 | `development-stages`、`improvement-loop` |
| AI駆動開発・ハーネス | `principles`、`human-ai-roles`、`ai-development-flow`、`quality-gates`、`closing` |

5節の順序は固定。複数キーの節では、有効な旧章をpropsの受信順、すなわちActionの`sort_order`順で表示する。
一部の章が無効でも他の有効章を隠さず、対応するキーがすべて無効なら節を出さない。
`architecture`無効時は共有する3節を出さない。節ごとの独立した新設定は追加しない。

旧9キーのIDはそれぞれ一意に維持する。`architecture`のIDはアーキテクチャ詳細だけに置き、他の共有2節へ重複させない。
旧4群は次の有効な旧章の先頭へ配置する。

| 旧群ID | 主対象 | 主対象が無効の場合 |
| --- | --- | --- |
| `roles` | `human-ai-roles` | `ai-development-flow` |
| `structure` | `architecture` | 対象なし |
| `checks` | `quality-gates` | `principles`・`improvement-loop`・`closing`のうち受信順で最初の章 |
| `stages` | `development-stages` | 対象なし |

`checks`は設定により品質節の改善工程へ到達する場合もある。到達先のない旧群IDやリンクは生成しない。
初回の旧hashと`hashchange`では、対応する詳細を演出終了を待たずに開いて移動する。未知・無効なhashで非表示章を復活させない。
新しい節の見出しIDは旧9キー・旧4群と重複させない。

## 詳細・演出・素材

- 初期は閉じ、5節を独立開閉できる。複数同時展開を許す。
- 「詳しく見る」「詳細を閉じる」の操作名から対象節を識別できるようにする。
- 通常開閉では強制スクロール・自動フォーカス移動をしない。隠す内容にフォーカスがある場合はsummaryへ戻す。
- 連打は最後の操作へ追従する。逆スクロールで一度表示した内容を隠さない。
- 動く内容がある表示設定では停止・再生を提供する。OSのモーション軽減を優先し、演出機能の不在でも読める静止状態を保つ。
- `public/images/design-philosophy/`の6主題を、幅1280・768・480pxのWebPで提供する。主要構図を切らず元の比率で表示し、下方画像は遅延読込する。
- 既存`washi-b.png`は背景に維持する。原素材・制作途中の画像を公開領域へ追加しない。
- 画像は概念表現。正確なラベルと関係はDOM図に置き、色・動きだけに依存させない。

## 公開内容の境界

ADRの責務構造とLinksLauncherのHTTP呼出図を分け、DTOを処理主体・DBとして描かない。
Radarの表示カード取得Strategyとランキング生成Strategyを混同しない。
開発4段階、TDD、指摘から再確認への循環、AIの担当構造と工程はそれぞれ別の図とする。
既存4事例は確認済み条件を保ち、Radarの修正は品質、導入手順とAnalyzerは理解再起動、Catalogは変更への対応へ各1回配置する。
内部名・内部パス・未実証の稼働保証を公開しない。

## テスト・完了条件・変更時の注意

- Feature: `tests/Feature/DesignPhilosophy/DesignPhilosophyPageTest.php`で既存props、文面、表示選別を確認する。
- Unit: `tests/Unit/DesignPhilosophy/`で固定キー・DTO・有効章の順序を確認する。
- Frontend: `DesignPhilosophyView.test.tsx`で5節、事例、旧hash、表示設定、開閉、停止・軽減・Observer失敗を確認する。
- コマンド・共通基準は[コマンド台帳](../operations/command-registry.md)と[テスト方針](../testing.md)に従う。
- 実画面では360pxを主要、320pxをReflow確認とし、スマートフォン横・タブレット・PCの画像、文字、図、操作を照合する。
- 完了には対象・回帰テスト、型、ビルド、実画面と独立レビューの結果が必要。未実行を成功と記録しない。
- 移植時は固定9キーのprops、公開Layout、画像・CSS、旧hash到達とモーションfallbackを一緒に確認する。DBや外部連携の追加はこのページの移植に含めない。
