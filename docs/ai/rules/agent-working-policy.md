# Agent Working Policy

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Source: `AGENTS.md` から詳細ルールを退避

## 基本方針

このプロジェクトでは、AIを丸投げ実装者として扱わない。

人間が目的・仕様・責務・成功条件・失敗条件・完成判定を握り、AIは調査、実装補助、差分修正、テスト追加、レビュー補助に使う。

## 作業条件の扱い

作業前に、目的、変更対象、変更しない対象、成功条件、失敗条件、読むdocs、読まないdocs、確認コマンドを固定します。

固定した作業条件は、実装中に都合よく削除・変更しません。docs、コード、テスト、指示内容が矛盾する場合は、自己判断で統合せず停止して報告します。

実装後の報告やPR本文には、実際に変更した内容、確認結果、未実行コマンドと理由を書きます。作業前の長い条件文や会話経緯をそのまま貼り付けません。

作業前に固定した目的、変更対象、確認コマンド、停止条件は、作業後の確認、修正、再確認、記録へつなげます。この反復構造の詳細は [../workflows/loop-engineering.md](../workflows/loop-engineering.md) を参照します。

## 作業開始前のリポジトリ確認

実装、docs更新、テスト追加、PR作成の前に、必ず作業対象リポジトリを確認する。

このローカル構成では、外側workspaceのDocker / 環境repoと、`src/` 内のLaravel / React / docs / tests / アプリrepoは別Git管理です。

Docker / compose / 環境作業では外側repoを確認し、Laravel / React / docs / tests / appコード作業では `src/` 内repoを確認します。

アプリ/docs作業を外側workspaceから開始する場合は、外側repoのremoteだけで判断せず、次を確認します。

```bash
git -C src remote -v
git -C src branch --show-current
git -C src status --short
```

外側repoのremoteが `Ryosuke-Shigi/laravel11-docker.git` でも、`src/` が対象アプリrepoを向いている場合は異常扱いしません。

Git境界が不明な場合は、remote変更、clone、restoreへ進まず停止して報告します。

最低限、以下を確認する。

- `pwd`
- `git remote -v`
- `git branch --show-current`
- `git status --short`

対象repo、remote、branchが指示と一致しない場合は、作業を続けず停止して報告する。

人間が別の作業場所を明示した場合は、元workspaceと指定された作業場所のどちらで作業したかを完了報告に明記する。

## Git / PR

- 実装・修正・docs更新・テスト追加・PR作成の前に、作業対象リポジトリ、remote、branch、未コミット差分を確認する
- `main` で直接作業しない
- `main` を最新化して目的別ブランチを作る
- 原則として作業ブランチから別の作業ブランチを切らない
- 1タスクへ複数目的を混ぜない
- 1つのcommitには1つの目的だけを含める
- 既存の未コミット差分を勝手に変更・削除しない
- commit / push はユーザーの明示指示がある場合のみ行う
- commit前に差分内容・確認コマンド・テスト結果を提示する
- Pull Request のタイトル・本文・レビューコメントは日本語で書く
- commit message は既存履歴に合わせる。ただし特別な理由がなければ日本語で目的が分かる文にする

### 作業ブランチ補足

- 対象repo、対象階層、対象branchを確認できない場合は、編集、commit、push、PR作成へ進まず停止する
- `main` にいる場合は、そのまま編集せず、目的別の作業ブランチを作成してから作業する
- 既に同目的の作業ブランチが存在する場合は、現在branch、既存差分、未コミット差分を確認してから続行する
- mainへの直接commit / pushは禁止する
- ユーザーが明示した場合を除き、force push、履歴修正、main直接書き込みをしない
- GitHubコネクタ、GitHub CLI、APIなどでbranchへ書き込む場合も、branchを省略しない

### コミット粒度

- コミットは、レビュー可能、巻き戻し可能、原因特定可能な単位にする
- 1PR内でも、作業の意味が分かれる場合は複数commitに分ける
- ただし、細かければよいわけではない
- `wip`、`fix`、`調整`、`いろいろ修正`、`まとめて修正` だけのような意味の薄いcommitを量産しない
- 1つのcommitには1つの目的だけを含め、無関係な変更を混ぜない
- docs、型、DTO、Action、Service、Repository、Responder、UI、Hook、Component、Test、確認修正は、意味が分かれるなら分ける
- 同じ目的で不可分な小修正は1commitにまとめてよい
- commit message は既存履歴に合わせる。ただし特別な理由がなければ日本語で目的が分かる文にする

コミット粒度の例:

- docs導線追加: 1commit
- PR運用ルール追加: 1commit
- DTO / Type追加: 1commit
- Request / Validation追加: 1commit
- Actionのユースケース手順追加: 1commit
- Serviceの業務判断追加: 1commit
- Repositoryの取得・保存境界追加: 1commit
- Responder / Presenterのprops整形追加: 1commit
- React Page / Hook / Component分離: 意味が分かれる場合は分割
- テスト追加・修正: 1commit
- PR前レビューで見つかった表記やリンク修正: 1commit

避ける例:

- mainで直接作業する
- 全変更を最後に1commitへ詰める
- docs、Backend、Frontend、DB、Dockerを無関係に1commitへ混ぜる
- `wip`、`fix`、`調整` だけのcommitを量産する
- レビュー指摘の修正に無関係な変更を混ぜる
- 指示外のリファクタリングを同じcommitに混ぜる
- `.env`、token、cookie、session、個人情報、secretsを混ぜる

### PR前整理

- `git status` で差分を確認する
- `git diff --stat` で変更範囲を確認する
- `git diff --check` で空白・改行崩れを確認する
- commitする場合は、commitが意味のある単位になっているか確認する
- PR本文には、作業目的、変更内容、確認結果、未実行チェックと理由、docs更新要否、該当Sensors、branch運用、commit粒度を必要に応じて書く
- PR本文へ作業前の長い条件文や指示用まとめ全文を貼らず、実装後の事実だけを書く

### PR本文・確認
- CIログ、コマンド名、エラー文、固有名詞は原文のまま残してよい
- 実装後は差分、必要なテスト、CI、秘密情報、docs更新を確認する
- 実装後は `../../operations/command-registry.md` に従い、`git diff --check` と必要なテストを実行する
- PR確認時は `../../operations/pr-review-strength.md` に従い、目的・変更ファイル・影響範囲・レビュー強度・必要な確認コマンド・読むdocs・読まないdocsを先に判定する
- mergeは人間の明示判断で行う

## 作業と停止条件

- 変更対象と成功条件を固定してから作業する
- 最小差分で修正し、不要なリファクタリングを混ぜない
- 仕様にない機能や代替実装を勝手に追加しない
- PrototypeコードをそのままProductへ昇格しない
- UI作業では `../../ui-development-flow.md` を確認し、MOCK / PROTOTYPE のコードではなくUI契約・振る舞い・状態・導線をProductへ引き継ぐ
- Product化では、PROTOTYPEで確認した振る舞いを先にTestへ固定してから実装する
- コメント・PHPDoc・`../../features/`・Test の役割分担は `../../commenting.md` と `../../testing.md` に従う
- Productは1機能・1ユースケース単位で追加する
- 機能固有条件は共通docsではなく `../../features/` に置く

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
- 必要な実装作法・型・コメントが `../../coding-standards.md` と `../../commenting.md` に沿っているか
- 必要なテスト、format check、buildを確認したか
- TypeScript / TSXを変更した場合は、必要に応じて手元確認としてtypecheckを確認したか
- 機能固有docsと現在のコード・成功テストが一致しているか
- 次回の理解再起動に必要な現在地と検証結果が残っているか
