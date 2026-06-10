# AGENTS.md

## 基本方針

このプロジェクトでは、AIを丸投げ実装者として扱わない。

人間が目的・仕様・責務・成功条件・失敗条件・完成判定を握り、AIは調査、実装補助、差分修正、テスト追加、レビュー補助に使う。

## 作業開始時の入口

作業開始時は、次の順序で必要な情報だけを確認する。

1. `AGENTS.md`
2. `docs/index.md`
3. 今回の作業に必要な共通docs
4. 対象機能の `docs/features/`
5. 対象コードと関連テスト

リポジトリ全体や全docsを、念のためという理由だけで毎回読み込まない。

## 参照先

- 開発段階・Product化: `docs/development-flow.md`
- MOCK / Prototypeの配置・削除・分離: `docs/prototype-policy.md`
- ADR Pattern・レイヤード責務: `docs/architecture.md`
- テスト・TDD・CI確認: `docs/testing.md`
- React / Inertia / TypeScript: `docs/frontend.md`
- UI・Common・モバイル・Effects: `docs/ui.md`
- コンテキスト管理・理解再起動: `docs/context-management.md`
- ログ: `docs/logging.md`
- セキュリティ・破壊的操作: `docs/security.md`
- コメント・PHPDoc・JSDoc: `docs/commenting.md`
- 機能固有仕様: `docs/features/`
- 指示用まとめ: `docs/templates/instruction-summary.md`
- PR本文: `docs/templates/pr-summary.md`
- 代替実装禁止: `skills/no-alternative-implementation/SKILL.md`

READMEは外部向け概要説明として扱い、内部の設計・テスト・AI運用ルールを詰め込みすぎない。

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

## Git / PR

- 実装・修正・テスト追加の前に、現在のブランチと未コミット差分を確認する
- `main` で直接作業しない
- `main` を最新化して目的別ブランチを作る
- 原則として作業ブランチから別の作業ブランチを切らない
- 1タスクへ複数目的を混ぜない
- 1つのcommitには1つの目的だけを含める
- 既存の未コミット差分を勝手に変更・削除しない
- commit / push はユーザーの明示指示がある場合のみ行う
- commit前に差分内容・確認コマンド・テスト結果を提示する
- 実装後は差分、必要なテスト、CI、秘密情報、docs更新を確認する
- 実装後は `git diff --check` と必要なテストを実行する
- mergeは人間の明示判断で行う

## 作業と停止条件

- 変更対象と成功条件を固定してから作業する
- 最小差分で修正し、不要なリファクタリングを混ぜない
- 仕様にない機能や代替実装を勝手に追加しない
- PrototypeコードをそのままProductへ昇格しない
- Productは1機能・1ユースケース単位で追加する
- 機能固有条件は共通docsではなく `docs/features/` に置く

次の場合は推測で進めず停止して差異を報告する。

- 必要な仕様が見つからない
- コード・テスト・docsが矛盾している
- 却下済み案か判断できない
- 対象外ファイルへ影響する可能性がある
- 本番接続、秘密情報、破壊的操作が関係する
- テスト結果を確認できないのに完了判定を求められている

## 完了確認

- 目的と成功条件を満たしたか
- 責務境界が崩れていないか
- 不要な依存・抽象化・変更が増えていないか
- 必要なテストとbuildを確認したか
- 機能固有docsと現在のコード・成功テストが一致しているか
- 次回の理解再起動に必要な現在地と検証結果が残っているか
