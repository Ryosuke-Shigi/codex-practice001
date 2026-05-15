# Architecture

## このドキュメントの目的

このドキュメントは、このプロジェクトで採用している ADR / レイヤード構成の責務境界を明文化するためのものです。

AIエージェントや人間が機能追加・修正を行う際に、Action / Service / Repository / DTO / Responder / Component などの責務が混ざらないようにすることを目的とします。

## 基本方針

このプロジェクトでは、AIを丸投げ実装者として扱いません。

人間が仕様・責務・設計境界・レビュー観点を決め、AIは実装補助・調査・差分修正・レビュー補助として使います。

設計では ADR / レイヤード構成を基準とし、各レイヤーの責務を分離します。

## 採用している構成

このプロジェクトでは、以下の責務分離を前提とします。

- Action
- Service
- Repository
- DTO / ListDTO
- Responder
- Factory
- Strategy
- Event / Listener
- Component

## Action の責務

Action はユースケースの手順を扱います。

Request から作られた DTO を受け取り、Service や Repository を呼び出して処理の流れを制御します。

Action には業務判断そのものを置きすぎず、処理順序の制御を主な責務とします。

## Service の責務

Service は業務判断・ドメインルールを扱います。

条件分岐、判定、変換方針、同期方針など、アプリケーションの意味を持つ判断は Service に置きます。

Service に DB 直接操作は置かず、永続化が必要な場合は Repository を経由します。

## Repository の責務

Repository は DB 操作の抽象を扱います。

取得条件、保存、更新、削除など、永続化層とのやり取りを担当します。

Repository に業務判断を置かないようにします。

Repository は「どのデータを取得・保存するか」を扱い、「そのデータをどう判断するか」は Service 側に置きます。

## DTO / ListDTO の責務

DTO はレイヤー間の境界線として扱います。

単体DTOは1件分のデータキャリアとして扱います。

ListDTOは複数件のDTOを束ねるデータキャリアとして扱います。

DTO には必要に応じて toArray() を実装してよいです。

DTO の toArray() は配列変換までに限定し、JSONレスポンス整形・HTTP出力整形・画面表示判断は行いません。

ListDTO の toArray() は、保持している各 DTO の toArray() を呼び出して配列化する責務に限定します。

toJson() やレスポンス生成は DTO / ListDTO ではなく Responder / Component 側の責務とします。

DTO / ListDTO には業務判断・DB操作・HTTPレスポンス生成・画面表示判断を持たせません。

## Responder の責務

Responder は出力整形を扱います。

Action や Service から受け取った DTO / ListDTO を、Inertia props やレスポンス用の形に変換します。

HTTPレスポンス生成や画面表示に近い整形は Responder 側に寄せます。

DTO にレスポンス責務を持たせないため、Responder を境界として使います。

## Factory の責務

Factory は生成・選択を扱います。

DTO生成、Strategy選択、Responder選択など、生成や選択に関する処理を担当します。

Factory に業務判断を置きすぎないようにし、判断の本体は Service または Strategy に分けます。

## Strategy の責務

Strategy はアルゴリズム差分を扱います。

条件ごとに処理内容が変わる場合、if 文を肥大化させず、Strategy として分離します。

Strategy は同じ目的に対する処理差分を表現するために使います。

## Event / Listener の責務

Event は発生した事実を表します。

Listener はその事実に対して実行する後続処理を扱います。

Event は 1 つの事実を表し、Listener は必要に応じて複数に分けます。

Listener 同士の実行順序に依存しすぎない設計を優先します。

## Component の責務

Component は画面表示を扱います。

props を受け取り、表示・操作・UI状態を管理します。

業務判断やDB操作は Component に置きません。

画面表示に必要な整形は、可能な限り Responder 側で整えてから Component に渡します。

## Command / Query の分離

状態を変更する処理は Command として扱います。

データを取得して表示する処理は Query として扱います。

Command では Service を経由し、業務判断と永続化の境界を明確にします。

Query では必要に応じて Repository から取得し、Responder を通じて表示用データに整形します。

## AI駆動開発における責務境界

AIは実装補助・調査・差分修正・レビュー補助として使います。

仕様、責務、設計境界、レビュー観点、最終判断は人間が行います。

AIに作業させる場合でも、以下を守ります。

- 仕様にない機能追加を勝手に行わない
- 変更対象ファイルを明確にする
- 最小差分で修正する
- 責務境界を崩さない
- 実装後に差分確認を行う
- 必要に応じてテスト追加・更新を検討する

## 機能追加時の判断基準

機能追加や修正を行う場合は、以下を確認します。

- その処理はどのレイヤーの責務か
- DTO / ListDTO の形は妥当か
- Repository に業務判断が入っていないか
- Service に DB 直接操作が入っていないか
- DTO に表示判断やレスポンス生成が入っていないか
- Component に業務判断が入りすぎていないか
- 既存仕様を壊していないか
- テスト追加・更新が必要か
