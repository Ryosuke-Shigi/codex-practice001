# Responsibility Boundaries

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Source: `AGENTS.md` から詳細ルールを退避

## 用語

- `ADR Pattern` は Action - Domain - Responderを指す
- 設計判断の記録は `Decision Record` または `設計判断記録` と呼ぶ
- Architecture Decision Recordの意味で `ADR` とだけ表記しない
- 状態変更のActionは `Command Action`、参照処理のActionは `Query Action` と呼ぶ
- Laravelのコンソール入口は `Artisan Command` と呼び、`Command Action` と区別する

## 必ず守る責務境界

- Controller: HTTPの入口
- Request: 入力形式のバリデーション
- Action: 1ユースケースの手順。必要に応じてCommand Action / Query Actionへ分ける
- Service: 業務判断・ドメインルール
- Repository: DBまたは外部データソースとの境界
- DTO / ListDTO: レイヤー間のデータキャリア
- Responder: Inertia props、JSON、CSV、PDF等の出力整形
- Job / Artisan Command / Scheduler: 実行入口
- Component: 画面表示、ユーザー操作、UI状態

Repositoryへ業務判断や表示判断を置かない。ServiceへDB直接操作やHTTP都合を置かない。DTOへレスポンス生成や画面表示判断を置かない。Componentへ業務状態遷移判断を置かない。

単純処理へ不要なService、Factory、Strategyを機械的に追加しない。

## 詳細参照

レイヤーごとの詳細責務、依存方向、Decision Record の扱いは `../../architecture.md` を正本とします。
