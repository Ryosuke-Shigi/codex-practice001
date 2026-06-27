# Work Result Feedback Loop

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-06-27

## このドキュメントの目的

このドキュメントは、作業完了前に今回の結果をどのdocs、型、コメント、テストへ戻すべきかを判定するためのルールです。

docs更新を目的化せず、次回の理解再起動に役立つ検証済み事実だけを戻します。

戻さない場合は、Pull Request Summary の README / docs 欄または未完了・対象外欄へ「戻さなくてよい理由」を残します。

## 位置付け

- `../../context-management.md`: 文脈読込、探索範囲制限、理解再起動の方針
- `../logs/index.md`: 失敗改善ログ、再発防止ログ、理解再起動ログの索引
- このMD: 作業後にどこへ戻すかの反映先判定ルール

このMDは `context-management.md` や `logs/index.md` の全文焼き直しではありません。作業後の反映先を選ぶための分岐表として扱います。

## 作業完了前の必須確認

作業完了前に、次を確認します。

- Feature仕様が変わったか
- 責務境界の判断が増えたか
- UI / Frontend判断が増えたか
- 新しいコマンドを使ったか
- 失敗、誤読、再発防止、未確認事項があったか
- テスト観点が増えたか
- secrets / env / 本番接続 / 破壊的操作に触れたか

どれにも該当しない場合は、恒久docsへ戻す新事実がない可能性があります。その場合も、PR Summary には理由を短く残します。

## 反映先の判定表

| 今回増えた事実 | 主な反映先 |
|---|---|
| Feature仕様変更 | `../../features/*` |
| 共通責務境界 | `../../architecture.md` または `../rules/responsibility-boundaries.md` |
| React / Inertia / TypeScript責務 | `../../frontend.md` / `../../ui.md` |
| UI工程や MOCK / PROTOTYPE / PRODUCT 契約 | `../../ui-development-flow.md` / `../../prototype-policy.md` / 対象feature docs |
| テスト観点 | `../../testing.md` または対象feature docs |
| コマンド実行場所 | `../../operations/command-registry.md` |
| PR確認観点 | `../../operations/pr-review-strength.md` |
| 失敗改善・再発防止 | `../logs/*` |
| 文脈読込・理解再起動方針 | `../../context-management.md` |
| 作業種別ごとの参照先 | `md-router.md` |

複数に該当する場合でも、同じ詳細ルールを複数docsへ全文複製しません。各docsの責務に必要な要約と、正本への参照だけを置きます。

## 戻さない場合の扱い

恒久docsへ戻さない場合は、PR Summary の README / docs 欄または未完了・対象外欄へ理由を残します。

例:

- `今回の差分では恒久docsへ戻す新事実なし`
- `既存feature docsの仕様変更なし。docs更新は索引追加のみ`
- `確認コマンドは既存の command-registry.md で扱えるため追加なし`

「docsのみ変更なし」のように、理由が分からない表現だけで済ませません。

## 一時メモと恒久docsの分離

Git管理docsへ戻すのは、cloneした第三者がプロダクトを理解、変更、テスト、運用するための情報です。

次は恒久docsへ混ぜません。

- 会話ログ
- 作業前の長い条件文
- ローカル地雷地図
- 個人メモ
- ChatGPT / CodexApp / 指示用まとめ / 圧縮ルールなどのメタ運用

## 禁止事項

- docs更新を目的化しない
- 同じ詳細ルールを複数docsへ全文複製しない
- 未確認の運用手順を正本として書かない
- `.local` / `.local-rules` をGit管理docsへ転記しない
- ChatGPT側情報源のメタ運用をGit管理docsの正本へ戻さない
