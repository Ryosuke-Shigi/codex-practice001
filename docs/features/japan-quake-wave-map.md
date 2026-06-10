# Japan Quake Wave Map

- Status: active
- Scope: Japan Quake Wave Map
- Last reviewed: 2026-06-10
- Canonical source: this document for feature-specific intent and constraints; current code, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

Japan Quake Wave Map固有のAtom feed取得、XML解析、保存、map pin生成、status API、テスト固定内容をまとめます。

共通責務は `docs/architecture.md`、共通テスト方針は `docs/testing.md` に従います。

## 機能概要

気象庁の地震火山情報Atom feedと個別XMLを取得し、地震情報を保存・解析・地図表示する機能です。

主な処理:

```text
Atom feed取得
    ↓
feed entry抽出
    ↓
entry保存・重複回避
    ↓
個別XML取得
    ↓
震源・震度等を抽出
    ↓
map pin生成条件を判定
    ↓
保存・status更新
```

## feed entry

主な仕様:

- Atom feedからentryを抽出する
- `entry_id` を識別子として扱う
- insert / update / skipを分ける
- 同じentryを重複保存しない
- 取得失敗・解析失敗を成功扱いしない

Repositoryは取得・保存を担当し、差分や処理結果の意味づけはService / Action側へ置きます。

## 個別XML解析

個別XMLから取得する主な情報:

- 震源座標
- 最大震度
- マグニチュード
- 深さ
- 発生日時
- 対象地域等の表示情報

長いXML fixtureは必要に応じて `tests/Fixtures` へ分離します。

## map pin生成条件

map pinは、少なくとも次を満たすデータだけを対象にします。

- 緯度がある
- 経度がある
- 最大震度がある

対象外:

- 震度なし
- 座標なし
- map pinとして表示できない不完全データ

Serviceがpin生成可否を判断し、Repositoryは保存・更新・取得を担当します。

## Job・処理状態

Jobでは同期処理を実行し、成功・失敗・部分失敗を区別します。

状態管理では、feed処理とmap pin処理を同一の成功扱いにまとめません。

例:

- feed completed
- map pin completed
- map pin failed
- partial failure

JobへXML解析や業務判断本体を詰め込まず、Action / Serviceへ委譲します。

## status API

status APIは、画面が必要とするJSON shapeへ整形します。

確認対象:

- status
- 処理件数
- 成功・失敗情報
- 必要な日時
- errorの公開範囲

技術的な例外や秘密情報をそのまま返しません。

## Request

Request validationで固定する主な内容:

- 日付範囲
- limit
- 型
- 必須・任意
- 境界値
- 不正値

フロント側の入力確認だけで完結しません。

## テストで固定する仕様

### Feed / XML

- JMA Atom feedの取得・抽出
- 個別XMLの取得・解析
- entry_idによる重複回避
- insert / update / skip
- 解析対象外データ

### map pin

- 緯度・経度・最大震度がある場合だけ生成する
- 震度なしをpin化しない
- 座標なしをpin化しない
- 保存・更新・重複回避

### Job / Action

- success
- failure
- partial failure
- feed completed / map pin failed等の状態管理
- 再実行時の安全性

### API / Request

- status APIのJSON shape
- Request validation
- 日付範囲
- limit
- 異常時のresponse

## 変更時の確認

- XML解析をControllerやJobへ直接書いていないか
- Repositoryへpin生成判断が入っていないか
- 震度なし・座標なしを誤ってpin化していないか
- feed成功とpin失敗を全成功として扱っていないか
- 外部XML全文や個人情報をログへ残していないか
- status APIのshapeを壊していないか
- この文書と現在のコード・テストが一致しているか
