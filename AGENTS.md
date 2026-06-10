# AGENTS.md

## 基本方針

このプロジェクトでは、AIを丸投げ実装者として扱わない。

人間が仕様・責務・設計境界・レビュー観点を決め、AIは実装補助・調査・差分修正・レビュー補助として使う。

## 参照ドキュメント

- 作業開始時に `AGENTS.md` と `docs/index.md` を確認する
- コンテキストの読み込み範囲、トークン・調査コストの抑制、理解再起動、指示用まとめの圧縮に関わる場合は `docs/context-management.md` を確認する
- IDEA BOARD / MOCK / PROTOTYPE / PRODUCT の段階判断、Product化、開発手順に関わる場合は `docs/development-flow.md` を確認する
- 設計方針・責務境界に関わる変更を行う場合は `docs/architecture.md` を確認する
- テスト追加・更新、または仕様破壊確認が関わる変更を行う場合は `docs/testing.md` を確認する
- 通常コメント・PHPDoc・JSDocを追加または更新する場合は `docs/commenting.md` を確認する
- ログ追加・更新・保存先変更を行う場合は `docs/logging.md` を確認する
- 秘密情報、本番接続、AI権限、破壊的操作、外部公開に関わる変更を行う場合は `docs/security.md` を確認する
- React / Inertia / TypeScript の画面、Component、props、レスポンシブ表示、演出に関わる変更を行う場合は `docs/frontend.md` を確認する
- UIの見た目、操作、共通Component、Common配置、モバイル表示に関わる変更を行う場合は `docs/ui.md` を確認する
- MOCKまたはPrototypeの作成・修正・削除・Product化を行う場合は `docs/prototype-policy.md` を確認する
- 特定機能を変更する場合は、該当する `docs/features/` の文書を確認する
- DanceShortsRadarを変更する場合は `docs/features/dance-shorts-radar.md` を確認する
- 指示用まとめを作る場合は `docs/templates/instruction-summary.md` を確認する
- PR本文を作る場合は `docs/templates/pr-summary.md` を確認する
- 指定された演出・機能・成功条件・対象ファイルがある作業では `skills/no-alternative-implementation/SKILL.md` を確認する
- README.md は外部向け概要説明として扱い、設計・テスト・AI作業ルールの詳細は各ドキュメントを参照する

## 用語

- `ADR Pattern` は Action - Domain - Responder を指す
- 設計判断の記録は `Decision Record` または `設計判断記録` と呼ぶ
- Architecture Decision Recordの意味で `ADR` とだけ表記しない

## アーキテクチャ方針

- ADR Pattern / レイヤード構成を崩さない
- Action / Service / Repository / DTO / Responder / Component の責務を混ぜない
- Controller は HTTP 窓口に限定する
- Request は形式バリデーションに限定する
- DTO は原則としてデータキャリアとして扱い、業務判断・DB操作・表示責務を持たせない
- Repository は DB または外部データソースとの境界を扱う
- DB Repository は取得・保存・更新・削除などの永続化を扱う
- External API Repository は外部通信と外部レスポンスのDTO変換を扱う
- Repository に業務判断・表示判断・レスポンス整形を置かない
- Service は業務判断・ドメインルールを扱う
- Action はユースケース手順を扱う
- Responder は出力整形に限定する
- Component は画面表示・画面操作・UI状態に限定する
- 単純処理へ不要なService、Factory、Strategyを増やさない

## DTO 方針

- 単体DTOは1件分のデータキャリアとして扱う
- ListDTOは複数件のDTOを束ねるデータキャリアとして扱う
- DTO には必要に応じて `toArray()` を実装してよい
- DTO の `toArray()` は配列変換までに限定する
- DTO の `toArray()` では JSONレスポンス整形・HTTP出力整形・画面表示判断は行わない
- ListDTO の `toArray()` は、保持している各DTOの `toArray()` を呼び出して配列化する責務に限定する
- `toJson()` やレスポンス生成は DTO / ListDTO ではなく Responder 側の責務とする
- DTO / ListDTO には業務判断・DB操作・HTTPレスポンス生成・画面表示判断を持たせない

## Git運用ルール

- 実装・修正・テスト追加の前に、現在のブランチと未コミット差分を確認する
- `main` ブランチ上で直接作業しない
- 作業開始時は `main` を最新化してから目的別ブランチを作成する
- 原則として作業ブランチから別の作業ブランチを切らない
- 既存の未コミット差分を勝手に上書き・整理・削除しない
- 変更前に変更対象ファイルと変更方針を確認する
- 複数の目的を1つの差分へ混ぜない
- 1つのcommitには1つの目的だけを含める
- commit / push はユーザーの明示指示がある場合のみ行う
- commit前に差分内容・確認コマンド・テスト結果を提示する
- 実装後は `git diff --check` と必要なテストを実行する

## コメント方針

- 通常コメント・PHPDoc・JSDocは必要な箇所に日本語で残す
- コメントの詳細ルールは `docs/commenting.md` に従う
- コメントで処理変更や責務違反を正当化しない

## コンテキスト管理

- 作業開始時に今回の目的・対象機能・必要なdocsを特定する
- リポジトリ全体や全docsを毎回読み込まない
- 名前、Route、Class、テスト名、エラーメッセージで検索してから必要なファイルだけを読む
- 共通方針は貼り直さず、`AGENTS.md` と該当docsの参照で済ませる
- 不明な前提を推測で補わない
- 複数目的が見つかった場合は1タスクへ混ぜず分割する
- 継続作業では現在地・決定事項・変更ファイル・テスト結果・未完了・次に読む場所を圧縮して残す
- 文書同士が矛盾する場合は `docs/index.md` の優先順位に従い、推測で統合しない

## 作業ルール

- 実装前に変更対象ファイルと変更方針を確認する
- 最小差分で修正する
- 既存の責務分離を崩さない
- 不要なリファクタリングを同時に行わない
- 仕様にない機能追加を勝手に行わない
- 速度を優先して一気に作ってよいのはPrototypeまでとする
- PrototypeコードをそのままProductへ昇格しない
- Productは1機能・1ユースケース単位で追加する
- Product化時は目的・入出力・成功条件・失敗条件・責務・テスト観点を固定する
- 機能固有仕様を共通docsへ書き込みすぎず、`docs/features/` へ分離する
- 実装後は差分確認を行う
- 可能な場合はテストまたは確認コマンドを実行する

## テスト追加方針

- 変更が Service / DTO / Repository / Action / Job / Inertia props に影響する場合は、テスト追加・更新を検討する
- 必要な場合は、既存仕様を壊さない範囲で最小限のテストを追加する
- テスト追加が不要な場合は、その理由を簡潔に示す
- `php artisan test` で確認できる状態を優先する
- テストはコードレビューの代替ではなく、仕様破壊を検知するための補助とする
- 機能固有テストの説明は該当する `docs/features/` に置く

## subagents 運用

- subagents は必要な場合のみ使う
- 原則としてレビュー・調査・テスト観点確認に使う
- 小さい修正では使わない
- 同じファイルを複数エージェントで同時編集しない
- 各subagentの結果を統合してから人間が最終判断する
- 実装の並列化には慎重にする

## レビュー観点

変更後は、少なくとも以下を確認する。

- 現在の段階がIDEA BOARD / MOCK / PROTOTYPE / PRODUCTのどれか明確か
- PrototypeコードをProductへ直接流用していないか
- Productが1機能・1ユースケース単位になっているか
- 作業に不要なdocs・ファイルを広く読み込んでいないか
- 共通方針を指示文へ重複記載していないか
- 次回の理解再起動に必要な現在地と検証結果が残っているか
- 責務境界が崩れていないか
- Repositoryへ業務判断・表示判断が入っていないか
- DTO / Repository / Service / Action の役割が混ざっていないか
- 不要な依存や過剰な抽象化が増えていないか
- 既存仕様を壊していないか
- テスト追加・更新が必要な変更か
- モバイル表示や Inertia props に影響がないか
- 共通docsへ機能固有仕様を混ぜていないか
