# AGENTS.md

このファイルは、`src/` 側アプリリポジトリで作業するための入口です。

詳細ルール本文はここに増やさず、AI作業用MD索引と対象docsへ誘導します。

## 最初に読むもの

1. [docs/ai/index.md](docs/ai/index.md)
2. [docs/ai/rules/agent-working-policy.md](docs/ai/rules/agent-working-policy.md)
3. [docs/ai/rules/responsibility-boundaries.md](docs/ai/rules/responsibility-boundaries.md)
4. [docs/index.md](docs/index.md)
5. 作業種別に応じて [docs/ai/workflows/md-router.md](docs/ai/workflows/md-router.md) から必要docsを絞る

参照先一覧は「全部読むリスト」ではありません。
作業種別、今回読むdocs、読まないdocs、編集禁止ファイル、停止条件を固定してから進みます。

## root との関係

外側workspaceの root は Docker / 環境repo、`src/` は Laravel / React / docs / tests / アプリrepoです。

外側repoから開始した場合でも、Laravel / React / app docs / tests を触る作業では、この `src/` 側repoの remote / branch / status を確認します。

## Git作業時のローカル専用ルール

Git作業、branch確認、working tree確認、差分確認、commit前確認、push前確認、PR確認、merge前確認、本番反映前のpull対象確認など、Git状態に関わる作業を行う場合は、作業対象repo直下の `.local-rules/git-operation-rules.local.md` の存在を確認します。

存在する場合は読みます。存在しない場合は読まず、通常の `AGENTS.md` / `docs/index.md` / `docs/ai/workflows/md-router.md` に従って続行します。

`.local-rules/git-operation-rules.local.md` 本体は開発環境ごとのローカル専用MDであり、Git管理対象にしません。

外側repoと `src/` は別repoのため、local専用MDの確認は実際にGit作業を行うrepo直下に限定し、一方のrepoのlocal専用MDをもう一方のrepoのルールとして扱いません。

## 必読先

| 用途 | 参照先 |
|---|---|
| AI作業用MD索引 | [docs/ai/index.md](docs/ai/index.md) |
| AIと人間の役割、Git / PR、停止条件 | [docs/ai/rules/agent-working-policy.md](docs/ai/rules/agent-working-policy.md) |
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
