# Product Design Guide

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / Product Design / IDEA BOARD / MOCK / Coding
- Last reviewed: 2026-07-09
- Canonical source: Coding前に「何を作るか」「どう見せるか」「どこまで作るか」を整理する軽量ガイド

## このガイドの目的

Product Design Guide は、Coding前に「何を作るか」「どう見せるか」「どこまで作るか」を整理するための軽量ガイドである。

このガイドは、次の上位互換ではない。

- Decision Record
- レイヤードアーキテクチャ
- Backend責務
- Frontend責務
- UI Component責務
- Loop Engineering
- local環境ルール

Product Design Guide は、実装責務を決めるMDではない。実装責務は既存の Decision Record、ADR Pattern、レイヤード、UI責務docsに従う。

## 3つの工程

```text
IDEA BOARD = 機能説明
MOCK = 画面確認
Coding = MOCKで確認済みの範囲だけ実装
```

IDEA BOARD は、何を作るかを説明する。

MOCK は、画面としてどう見えるか、どう操作するかを確認する。

Coding は、MOCKで確認済みの範囲だけを既存の責務境界に沿って実装する。

## IDEA BOARDでやること

- 何を作るか
- 誰向けか
- 何を解決するか
- 主な機能
- 画面候補
- 今回やらないこと
- ユーザーに見せる機能説明

IDEA BOARD は、機能の目的、価値、流れ、画面候補を説明するための資料である。UI細部や実装責務を確定する場ではない。

## IDEA BOARDでやりすぎないこと

- UI細部の確定
- 実装ファイル指定
- Controller / Action / Service / Repository / DTO の責務指示
- DB設計
- Migration
- 本番API通信
- Docker / infra変更
- Coding前提の詳細実装指示

IDEA BOARD 内に技術メモを置く場合も、補助扱いに留める。未確認の実装名、DB構造、Backend層を確定仕様として書かない。

## MOCKでやること

- 画面名
- この画面で確認すること
- 表示要素
- 操作導線
- 戻る先
- モバイル表示
- 情報量
- MOCK外で勝手に作らない範囲

MOCK は、画面を1つずつ確認するための仮UIである。画面の配置、導線、操作感、状態表示、モバイル表示を確認する。

## MOCKでやりすぎないこと

- Backend責務の指示
- DB設計
- Controller / Action / Service / Repository / DTO の詳細指示
- 未確定画面の補完
- 別アプリへの影響
- 共通化の先取り
- Codingの詳細実装方針の確定

MOCK は、画面確認のための資料である。Backend責務や本番データ境界は、Coding時に既存のADR Pattern、レイヤード、UI責務docsへ接続して決める。

## Codingでやること

- MOCKで確認済みの範囲だけ実装する
- 既存のADR Pattern、レイヤード、UI責務ルールに従う
- 未確認の画面、導線、共通化を勝手に追加しない
- MOCKと異なる導線変更を勝手に行わない

Codingでは、MOCKで確認した画面、導線、表示要素を実装範囲の上限として扱う。

```text
MOCK未確認のUI・画面・導線・共通化を、Codingで勝手に補完しない。
```

## Coding前ゲート

画面を伴う新機能、新導線、UI変更は、原則としてCoding前にMOCKを通す。

Codingに進める条件:

- IDEA BOARDで機能の目的が説明されている
- MOCKで画面導線が確認できる
- 表示要素が確認されている
- 登録 / 一覧 / 詳細 / 戻る導線が破綻していない
- モバイル表示で主要操作が見える
- 説明文を詰め込みすぎていない
- MOCKで確認していない画面を勝手に実装しない範囲が明記されている

上記を満たせない場合、Codingで推測補完せず、IDEA BOARDまたはMOCKへ戻して確認する。

## 固定するもの

Product Design Guide では、IDEA BOARD / MOCK の構成を完全固定しない。固定するのは骨格と確認項目だけである。

- 工程の役割
- 必須確認項目
- Coding開始条件
- 禁止事項
- MOCKを通すゲート
- 未確認範囲を勝手に補完しないルール

## 自由度を残すもの

- 画面ごとの見せ方
- セクション構成
- レイアウト
- コピー
- 図
- カード表現
- 表現方法
- 画面ごとの最適化

LumiLabのように、TOP / 登録 / 一覧 / 詳細で画面の目的が違う場合、同じ骨格を使いつつ、見せ方は画面ごとに最適化してよい。

## 読むタイミング

Product Design Guide を読むタイミング:

- IDEA BOARDを作成・修正するとき
- MOCKを作成・修正するとき
- 新しい画面導線を決めるとき
- Coding前にMOCK確認済み範囲を確認するとき
- Product Design上の判断が必要なとき

Product Design Guide を原則読まないタイミング:

- 通常の小修正
- Backend責務整理
- PR修正
- 文言修正
- テスト修正
- 画面を伴わないdocs修正
- infra作業

## 他docsとの読み分け

- UI作業時はUI責務ガイドを読む
- LumiLab作業時はLumiLab docs indexを読む
- Backend実装時はADR Pattern、レイヤード、対象機能docsを読む
- Loop Engineeringが必要な作業ではLoop Engineering docsを読む
- local環境、gh、WSL、Git操作に関係する場合はlocal系MDを確認する

このガイドは読むdocsを増やすためのものではない。IDEA BOARD、MOCK、Codingの境界判断が必要な時だけ読む。

## local系MDとの関係

local系MDは、そのPC固有の環境差分、コマンド差分、gh / Git操作差分を扱う。Product Designの共通ルール、ADR Pattern、レイヤード責務、UI責務、LumiLabのプロダクト方針を上書きしない。

local系MDが存在する場合は、Git操作、WSL、gh、ローカル実行手順など、環境差分に関係する範囲だけ確認する。存在しない場合でも、Product Design判断やdocs更新を止めない。

## PR前チェック

- Product Design Guide が万能MDになっていないか
- IDEA BOARD / MOCK / Coding の境界が混ざっていないか
- IDEA BOARDでUI細部や実装責務まで指示していないか
- MOCKでService / DTO / Repository / Controllerまで指示していないか
- CodingでMOCK外を補完してよい内容になっていないか
- 既存の Decision Record、ADR Pattern、レイヤード、UI責務docsを上書きしていないか
- Codexに毎回全文読ませる重い運用へ戻していないか
- local系MDをGit管理対象と決めつけていないか
- docs-onlyになっているか
