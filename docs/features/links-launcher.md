# LinksLauncher

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001` / 共通選択機能とPortfolio入口
- Last reviewed: 2026-11-24

## 目的と入口

DBの導線を `LinksLauncher → Link → LinksLauncher または page` として扱うPRODUCT実装。段数を固定せず、Portfolioの作品定義を共通本体へ埋め込まない。LumiLab専用版は含めない。
旧TOPのSTART・旧作品選択は維持し、確認入口を `/portfolio/links-launcher` に追加している。START切替と本人確認後の旧専用コード撤去は別工程。

| Route | 役割 |
| --- | --- |
| `GET /links-launchers/{linksLauncherKey}` | UUIDによる共通一覧。任意のselectedLinkKeyで初期選択 |
| `GET /portfolio/links-launcher` | 固定したPortfolio UUIDを開く。旧project指定もLink UUIDへ変換 |
| `/projects?project=<既存作品ID>&view=stages` | 維持する独立した開発段階選択page |
| `/projects/logs` | 維持するアプリログ入口 |

本体の不正UUID・不存在は標準404。論理削除済みは404で「現在 非公開」と表示し、本体名・説明・Link・画像参照を返さない。公開0件は200で「表示できるリンクはありません」。1件は前後操作なし、2件以上は循環する。無効・非表示・別所属の選択キーは表示対象の先頭へ戻す。

## 旧入口・履歴・素材の互換

- `/portfolio/links-lanchar` と `/links-lanchars/{UUID}` は正式入口へ転送する。パスのUUIDで先に宛先を確定し、重複キー・配列・符号化を含む元のqueryをその後に引き継ぐ。同名queryでパスのUUIDを置き換えない。
- 改名前の `LinksLanchar/Show` は薄いPageで旧propsを正式propsへ変換し、同じ履歴項目を正式URL・Pageへ置換する。旧 `Unavailable` も互換Pageで表示する。共通DTOに旧項目を追加しない。
- 旧到着印は同一origin・同じ一覧UUID・query・hashの履歴に限り引き継ぐ。Inertia 2.3.21の `router.restore` はキー欠落時に初期履歴へfallbackするため、履歴復帰では復号済みの当該Pageを確認する。同じURLの別項目に到着印がなければ戻るを作らない。保存直後の印は元のPageと保存値を照合する。
- ビルド更新でasset versionが異なる場合もInertiaの再取得を維持し、元の履歴項目・再取得リクエスト・完了した公開Pageの対応を確認して有効な到着印だけを復元する。HTTPではfragmentが送られずqueryも正規化されるため、サーバーURLの文字列表現を旧印の照合に使わない。元の印と履歴の完全一致を先に確認し、最新propsを保持した同じ項目のURL置換で正式パス・元のqueryとfragmentを保つ。保存済みの旧propsを再表示せず、最新のサーバー応答が非公開なら印を引き継がない。
- 素材本体は `public/images/links-launcher/`。旧 `public/images/links-lanchar` は正式ディレクトリへの相対シンボリックリンクとし、保存済みpropsの旧パスを配信する。Linuxのシンボリックリンクを保持するcheckoutを前提とする。画像の内容・寸法・動きは改名で変えない。

## データと制約

Migrationは `database/migrations/2026_11_23_000000_create_links_lanchar_tables.php`。

- links_launchers / LinksLauncher: 不変のUUID v4、任意のタイトル・説明、日時、論理削除。
- links / Link: 不変のUUID v4、所属UUID、表示・素材設定、任意の行き先・優先度、表示フラグ、日時、論理削除。
- link_pages / LinkPage: 既存pageの保存URL。作品ページ本体をこのテーブルへ移動しない。

所属先は物理削除を制限する。行き先は最大1つ、両方NULLは許可。行き先の物理削除では参照をNULLにしてLinkを残す。MySQLでSET NULLと排他制約を両立するため、仮想列destination_reference_countのCHECKを使い、この列を表示データへ出さない。本体の論理削除で配下Linkや所属キーを変えない。通常のEloquent更新ではUUID変更を拒否する。
取得は所属一致・表示中・未削除だけ。数値優先度を先、優先度昇順、更新日時降順とし、0・負数・NULLを許可する。完全同値に追加のIDソートを持ち込まない。

## 責務とファイル

共通側からPortfolio定義・作品一覧・STARTへ依存しない。[PHP責務](../architecture.md)と[React責務](../frontend.md)を正本とする。

| ファイル・範囲 | 責務 |
| --- | --- |
| app/Http/Controllers/LinksLauncher/ShowLinksLauncherController.php | HTTP入口・入力形式・ActionとResponderへの受け渡し |
| app/Actions/LinksLauncher/Queries/ShowLinksLauncherAction.php | 取得・状態分類・初期選択の参照ユースケース |
| app/Repositories/LinksLauncher/ | 本体・所属Link・参照先の一括取得と順序 |
| app/DTO/LinksLauncher/ | Input・取得snapshot・Result・LinkDTO・LinkListDTOという値の境界 |
| app/Responders/LinksLauncher/LinksLauncherResponder.php | 状態別HTTP応答・Inertia props |
| 同ディレクトリのLinkDisplayResolver.php | 一覧単位の球体色割当と表示値の補完 |
| 同ディレクトリのURL ResolverとSelector | 同じinterfaceの2実装を注入し、一箇所で選択 |
| app/Providers/AppServiceProvider.php | サイト側で指定したTOPの相対URLを共通Responderへ遅延注入 |
| resources/js/Pages/LinksLauncher/ | props・metaの入口と専用非公開画面 |
| resources/js/Components/LinksLauncher/ | 型・画像／球体・背景・説明・選択と遷移のUI状態 |
| resources/js/Hooks/useLinksLauncherHistory.ts | 履歴項目ごとの到着印・再読込復元 |
| resources/js/Pages/Projects/Select.tsx | 既存段階選択へ履歴状態を渡す薄い接続 |
| app/Http/Controllers/Portfolio/PortfolioProjectEntryController.php | Portfolio本体と旧作品IDを共通入力へ変換 |
| app/Support/Portfolio/PortfolioLinksLauncherDefinition.php | 初期UUID・現行8項目・実URL・素材対応 |
| database/seeders/PortfolioLinksLauncherSeeder.php | 初期定義の反映・明示UUIDの論理削除 |

URL解決はLinkDestinationUrlResolverに対するLinksLauncherDestinationUrlResolverとPageDestinationUrlResolverのポリモーフィズム。前者は取得済みUUIDからnamed routeを生成、後者は保存URLを返す。DBを再取得しない。未設定・削除先はNULL。page URLはルート相対またはHTTP(S)を許可し、制御文字・バックスラッシュ・プロトコル相対・他schemeを返さない。

## DTO・素材・操作

propsはlinksLauncher、selectedLinkKey、linkList.links、navigation.topUrl。LinkDTOはlinkKey、解決済みdestinationUrl、displayValues。表示フラグ・内部ID・参照ID・生の日時・ModelをReactへ渡さず、DTOとReactで取得・再ソート・URL生成をやり直さない。
サイトTOPはサイト側のDIで指定し、現在のPortfolioでは名前付きwelcomeルートの相対URLを使う。共通本体はnavigation.topUrlを受け取り、PortfolioのURLを固定しない。TOPの指定をDB・query・referrer・履歴から推測しない。
選択画像を最優先し、画像では球体・重ねアイコン・球体影を出さない。球体は指定色か一覧単位の補完色、アイコン画像・指定Lucide・既定Linkアイコンの順に使う。補完タイトル・色・影・既定値をDBへ書き戻さない。
素材はpublic/images/links-launcher/portfolio/<作品ID>/に同梱。4作品の背景・選択はGIF、アイコンは透過PNG。動きを減らす設定では明示されたPNG静止版へ切り替え、浮遊・タイピング・背景演出を止める。ファイル名から静止版を推測しない。主画像なしなら静止版だけで画像表示を有効にしない。
隣接プレビューは静止版を優先し、通常設定で静止版がなければ主画像を使う。動きを減らす設定で静止版がなければ、枠内の静的タイトルを表示する。
選択GIFは矩形containで全景を保ち、説明は暗い下地で可読性を確保。画像なしは現行配色・標準球体・Lucideを使う。
画像選択時は中央画像の表示領域を広げ、矢印と隣接プレビューは従来の左右配置を保つ。中央画像を主役とし、隣接プレビューとの多少の重なりは許容する。高さの低い横向きでは従来の画像寸法を保ち、画像を縮めない。画像なしの球体選択には画像専用の寸法を適用しない。
一覧内の選択変更は履歴置換、行き先へは同一タブで履歴追加。URLなしはpointer・Enter・Spaceで遷移しない。中央focusを維持し、左右キー・前後ボタン・左右swipeを使う。縦scrollや操作ボタンを奪わない。
同一originはInertiaで開き、当該GETに対応する正常なHTML応答だけ通常の文書遷移へ切り替える。visitごとの識別値・元URL・応答形式を照合し、他の通信へ干渉しない。購読は応答処理・終了・取消・画面破棄時に解除する。
新一覧と独立した段階選択の戻るはhistory.back()。既存作品内のリンクから段階選択へ入った場合も対象とし、直開きでは画面内戻るなし。旧一覧内から段階へ切り替えた場合の従来操作は残し、各作品内部の戻りリンクは変えない。旧一覧内のURL置換ではInertiaの状態を保持し、段階へ進んだ経緯と選択を失わない。
公開一覧の「TOPへ」は履歴の「戻る」と独立したリンクで、直開き・公開0件・タイトルと説明なしでも表示する。履歴がある場合は両方を表示し、TOPリンクにもキーボードfocusと既存の戻るに相当する操作領域を確保する。
履歴印はInertia remembered stateとその項目のURLで判定し、履歴長・referrerだけでは判断しない。実応答のbeforeUpdateと同じPageのnavigateを組にして履歴追加を認定し、同じPageのsuccessで到着印を1回保存する。初期表示・先読み・履歴復帰だけで新しい印を付けない。reload前の印を取得し、同URLの初回navigateにだけ復元する。対象Pageの判定と起動時の接続はapp.tsxに置き、共通HookへPage名を持たせない。

## 初期データと削除

初期定義のUUIDを入口・互換対応・Seederで共有し、毎回生成しない。Seederは削除済みを含め同じUUIDで照合し、内容不変なら保存しない。削除済みを自動復元せず、定義からの欠落を削除命令にしない。
削除はDefinitionのDELETED_LINK_KEYS / DELETED_LINKS_LAUNCHER_KEYSへUUIDを明示（初期空）。Seederへ値として指定した場合も未削除の対象だけを論理削除し、既に削除済みの日時・所属を再実行で変えない。管理画面・外部API・Queue・Job・Schedulerは追加しない。

## 検証と適用

[テスト正本](../testing.md)・[コマンド正本](../operations/command-registry.md)に従う。

- tests/Feature/LinksLauncher/LinksLauncherSchemaTest.php: 制約・UUID・削除境界。
- tests/Feature/LinksLauncher/ShowLinksLauncherTest.php: HTTP・props・所属・順序・状態・URL・補完・両入口のサイトTOP注入と差し替え。
- tests/Feature/LinksLauncher/PortfolioLinksLauncherSeederTest.php: 初期8項目・素材・再実行・明示削除。
- tests/Unit/LinksLauncher/LinkDisplayResolverTest.php: 一覧単位の補完色・指定色の保持・画像の除外。
- resources/js/Components/LinksLauncher/LinksLauncherView.test.tsx: 空・循環・入力・前後操作後のfocus・素材・静止版・通常HTML遷移と他通信への非干渉・購読解除・TOPと履歴の戻るの独立性。
- resources/js/Hooks/useLinksLauncherHistory.test.tsx: アプリ内到着・直開き・先読み・置換・履歴復帰・購読解除。
- resources/js/Hooks/useLinksLauncherHistory.integration.test.tsx: 実Inertia・固定HTTP応答で、表示とブラウザ相当の履歴項目への保存を区別して検査。
- resources/js/Components/ProjectHub/ProjectSelectView.integration.test.tsx: 実InertiaとProjects Pageで、旧一覧から段階選択への両戻る表示・同じ作品への復帰・focusを通常表示と動き軽減で検査。
- resources/js/Hooks/useLinksLauncherHistory.legacy.integration.test.tsx: 実Inertiaで旧Page・props・到着印、同じURLの別項目、各不一致、選択・focus・履歴件数・旧非公開画面を検査。
- resources/js/Hooks/useLinksLauncherHistory.stale.integration.test.tsx: 実app.tsxから異なる新旧asset versionの履歴復帰・旧URL再取得・最新公開状態・有効な到着印の復元と不一致の拒否を検査。
- 既存ProjectHubのPHP・React: 旧入口と作品URLの回帰。

初回作成Migrationは履歴識別子を保つため、既存basename `2026_11_23_000000_create_links_lanchar_tables.php` を維持する。内容と通常のdownだけを正式名へ揃え、配布する追加の改名Migrationは作らない。

適用前にMigration履歴と実スキーマを照合する。未適用環境では初回から正式名で作成する。旧名で適用済みの環境は、このファイルを再実行しても改名されない。データ・制約・採番・全Migration履歴を保持する環境専用の改名手順を別途使い、履歴の付け替えやDB初期化で済ませない。ローカル専用の処理・バックアップ・検証fixtureを本番配布へ含めない。混在スキーマや履歴不一致は変更前に停止する。

全Migrationと起動の検証は隔離した空DBで行う。既存DBで全Migration・fresh・refresh・resetを検証目的に実行しない。旧DBの検証は固定旧版から作った別のfixtureで行い、新規作成後と同じ最終スキーマ、全保存値、論理削除、画像prefix更新、途中停止からの明示再開、再実行時の無変更を照合する。画像参照は削除済み行を含む限定prefix更新とし、通常Seederで日時を書き換えない。

以下は未適用環境向けの対象Migrationと専用Seederの操作例。実際の本番適用は別確認・別権限で行い、Seederは本人が担当する。

```sh
docker compose exec php-fpm php artisan migrate --path=database/migrations/2026_11_23_000000_create_links_lanchar_tables.php --step
docker compose exec php-fpm php artisan db:seed --class=PortfolioLinksLauncherSeeder
```

upは新規3テーブル、downは逆順に削除。MySQL DDLはautocommitのため、失敗時は部分適用を確認してから復旧を判断する。投入後のrollbackはデータを失うので自動実行しない。本番の環境・適用手順は別確認で、Seederは本人が担当する。
Browserの描画・履歴・モバイルはコードと単体テストだけでは合格としない。組込みBrowserの観測、Formal Browser evidence、本人確認を区別し、未取得を成功扱いしない。
