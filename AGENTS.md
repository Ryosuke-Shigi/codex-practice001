# AGENTS.md

このファイルは、`src/` 側アプリリポジトリで作業するための短い入口です。
Laravel / React / app docs / tests はこのリポジトリで扱い、外側workspaceのDocker / 環境repoと混同しません。

## 作業開始

1. 作業対象repoの remote / branch / status を確認する
2. [docs/ai/workflows/md-router.md](docs/ai/workflows/md-router.md) で該当する作業プロファイルを選ぶ
3. プロファイルで指定された範囲と条件に従い、必要な共通docs・feature / project docs・対象コードだけを確認する
4. 作業範囲を確定した後、独立した探索・実装・検証・レビューへ分割する効果がある場合だけ [model-routing-policy.md](docs/ai/rules/model-routing-policy.md) に従って利用可能なSubagentへ委譲し、親agentが結果を統合する。Subagentが利用できない場合は、親agentが同じ工程を順番に実行する

[docs/index.md](docs/index.md) はdocs全体の総合索引です。通常作業で毎回読むものではなく、次の場合に確認します。

- 正本を確認する
- 新しいdocsの配置先を判断する
- docs体系を変更する
- MDルーターだけでは参照先を判断できない
- docs同士の役割、Status、正本が衝突している

## 必ず守ること

- `main` で直接編集しない
- 既存の未コミット差分を勝手に変更・削除しない
- 仕様にない機能や代替実装を推測で追加しない
- `.env` の実値、APIキー、DBパスワード、AWSキーなどの秘密情報を書かない
- Laravel / React / app docs / tests の作業で外側repoに差分を出さない
- ローカル環境固有の情報をGit管理docsやPR本文へ混ぜない
- docs、コード、テスト、指示が矛盾する場合は停止して差異を報告する

Git / branch / commit / PRの詳細は [docs/ai/rules/agent-working-policy.md](docs/ai/rules/agent-working-policy.md)、ADR Patternと責務境界は [docs/ai/rules/responsibility-boundaries.md](docs/ai/rules/responsibility-boundaries.md) と [docs/architecture.md](docs/architecture.md) を正本とします。

## 作業後

[docs/ai/workflows/work-result-feedback-loop.md](docs/ai/workflows/work-result-feedback-loop.md) で、結果をdocs、型、コメント、テスト、PR Summary、Sensorsのどこへ戻すか確認します。
正本以外には詳細ルールを複製せず、必要な短い要約と正本へのリンクだけを置きます。
