# AGENTS.md

このファイルは、`src/` 側アプリリポジトリで作業するための入口です。

詳細ルール本文はここに増やさず、作業フロー、責務境界、停止条件の索引と対象docsへ誘導します。

## 最初に読むもの

1. [docs/index.md](docs/index.md)
2. [docs/ai/workflows/md-router.md](docs/ai/workflows/md-router.md) で作業種別ごとの必要docsを絞る
3. [docs/ai/rules/agent-working-policy.md](docs/ai/rules/agent-working-policy.md)
4. [docs/ai/rules/responsibility-boundaries.md](docs/ai/rules/responsibility-boundaries.md)
5. 必要に応じて [docs/ai/index.md](docs/ai/index.md) で作業フローと責務境界の参照先を確認する

参照先一覧は「全部読むリスト」ではありません。
作業種別、今回読むdocs、読まないdocs、編集禁止ファイル、停止条件を固定してから進みます。

## 作業後の戻し先確認

作業完了前に [docs/ai/workflows/work-result-feedback-loop.md](docs/ai/workflows/work-result-feedback-loop.md) で、今回の結果をどこへ戻すかを確認します。

- AGENTS.md へ全ルールを集約しない
- docs索引、MDルーター、operations docs、feature docs、PR Summary、Sensors のどこへ戻すべきかを分ける
- ソースコードを変更した場合は、コメント、PHPDoc、JSDoc、型アノテーション、props契約説明が実装と矛盾していないか確認する
- ローカル環境固有の情報は、Git管理docsやPR本文へ混ぜない

## root との関係

外側workspaceの root は Docker / 環境repo、`src/` は Laravel / React / docs / tests / アプリrepoです。

外側repoから開始した場合でも、Laravel / React / app docs / tests を触る作業では、この `src/` 側repoの remote / branch / status を確認します。

## Git作業時の確認

Git作業、branch確認、working tree確認、差分確認、commit前確認、push前確認、PR確認、merge前確認、本番反映前のpull対象確認など、Git状態に関わる作業では、通常の `AGENTS.md` / `docs/index.md` / `docs/ai/workflows/md-router.md` / `docs/operations/command-registry.md` に従って進めます。

ローカル環境固有の再発防止メモや確認メモはGit管理docsの正本ではありません。

外側repoと `src/` は別repoのため、Git作業は実際に差分を出すrepoの remote / branch / status を確認し、一方のrepoの状態をもう一方のrepoの状態として扱いません。

## 主要参照先

| 用途 | 参照先 |
|---|---|
| 作業フロー・責務境界の補助索引 | [docs/ai/index.md](docs/ai/index.md) |
| 作業条件、Git / PR、停止条件 | [docs/ai/rules/agent-working-policy.md](docs/ai/rules/agent-working-policy.md) |
| ADR Pattern、用語、責務境界 | [docs/ai/rules/responsibility-boundaries.md](docs/ai/rules/responsibility-boundaries.md) |
| docs全体の索引、用途別の正本 | [docs/index.md](docs/index.md) |
| 作業種別ごとのMDルーター | [docs/ai/workflows/md-router.md](docs/ai/workflows/md-router.md) |
| コマンド実行、Git境界 | [docs/operations/command-registry.md](docs/operations/command-registry.md) |
| PRレビュー強度 | [docs/operations/pr-review-strength.md](docs/operations/pr-review-strength.md) |

## 作業範囲の確認

- `main` で直接作業しない
- 既存の未コミット差分を勝手に変更・削除しない
- 仕様にない機能や代替実装を勝手に追加しない
- `.env` の実値、APIキー、DBパスワード、AWSキーなどの秘密情報を書かない
- 迷う場合は推測で進めず、差異を報告して人間に確認する
