# コード責務棚卸し

- Status: active
- Scope: `Ryosuke-Shigi/codex-practice001`
- Last reviewed: 2026-07-04
- Canonical source: this document for the 2026-07-03 responsibility inventory and 2026-07-04 QuakeWavePreview / JapanQuake additional inventory; current code, feature docs, migrations, configuration, and successful tests for implemented behavior

## このドキュメントの目的

このドキュメントは、既存コード全体の責務分離、コメント / PHPDoc / JSDoc、型アノテーション、DTO境界、Inertia props契約を棚卸しした記録です。

実装挙動を変えるための設計書ではありません。今回すぐ直すもの、別PRへ分けるもの、記録だけにするものを分け、今後のコアカード / 入金 / 出金 / 請求 / カレンダー / Read Model / Projection / Event / Listener / Job 実装前の地形図として扱います。

共通責務境界は `docs/architecture.md`、React / Inertia責務は `docs/frontend.md`、コメント方針は `docs/commenting.md`、確認コマンドは `docs/operations/command-registry.md`、Sensorsは `docs/operations/sensors.md` を正本とします。

## 確認方法

確認した範囲:

- `app/`
- `routes/`
- `resources/js/`
- `resources/views/`
- `config/`
- `database/`
- `tests/`
- `bootstrap/`
- `public/` のうち、Laravel入口、静的データ、モック画像として管理されている範囲
- `composer.json`
- `package.json`
- `vite.config.js`
- `tsconfig.json`
- `tailwind.config.js`
- `artisan`
- `docs/` のうち、責務境界、frontend、commenting、testing、Sensors、PR Summary、feature docsに関係する範囲

確認対象外:

- `vendor/`: 依存ライブラリ
- `node_modules/`: 依存ライブラリ
- `storage/`: 実行時生成物
- `bootstrap/cache/`: 実行時キャッシュ
- `public/build/`: Vite build成果物
- `.env` / secrets / token / cookie / session / 個人情報を含む可能性があるファイル
- Docker / nginx / php-fpm / mysql / redis / queue / scheduler の外側構成
- 本番環境 / Lightsail / deploy 手順

主な確認手段:

- `git -C src ls-files ...` で管理対象ファイルを確認
- `rg` で `TODO` / `FIXME` / `@param` / `@return` / `any` / `as unknown as` / `Inertia` / `Repository` / `Service` / `Action` / `DTO` / `Responder` を検索
- Controller / Action / Service / Repository / DTO / Responder / Job / Command / Scheduler / React Page / Hook / Component / Type の代表ファイルを確認
- feature docs と現在コードの責務説明を照合

この棚卸しは、全ファイルへ機械的・広範囲に当てた確認と、責務境界が出やすい代表ファイルの精読を組み合わせたものです。すべての行について仕様判断を確定した記録ではありません。

## 全体所見

全体として、Laravel側は ADR Pattern に沿って Controller / Request / Action / Service / Repository / DTO / Responder がかなり明確に分かれています。

- Controllerは多くの箇所で Request / DTO / Action / Responder の接続に留まっています。
- DB操作と外部HTTP通信は主に Repository に集まっています。
- Serviceは snapshot計算、上昇候補判定、ログ整形、XML解析、容量判定などの業務判断や変換を担当しています。
- DTO / ListDTOは `readonly class` と `toArray()` を中心にデータキャリアとして使われています。
- Responderは Inertia props / JSON shape の整形を担当しています。
- Job / Artisan Command / Schedulerは実行入口として Action や Job dispatch に寄せられています。
- React / Inertia側は props型、Feature Component、Hook、Utility が多く、Componentへ責務境界コメントも残っています。

すぐに挙動を変えて直すべき重大な責務崩壊は確認していません。ただし、別PRで設計判断を分けたほうがよい候補はあります。

## レイヤー別点検結果

### routes

確認結果:

- `routes/web.php` は PRODUCT入口を Controller へ渡し、Lab / MOCK / IDEA BOARD は閉じた Inertia pageとして分けています。
- `/api-catalog/mock/{apiKey}` の `return_url` は route closure 内でモック一覧に限定しています。これはUI確認用モックの境界に閉じており、本体詳細の所有確認や保存責務とは分かれています。
- `routes/console.php` は Scheduler入口を定義し、同期本体は Job / Command / Action / Service / Repositoryへ委譲しています。

分類:

- E: Lab / MOCK / IDEA BOARD の route closure は今回触らず記録だけにします。

### Controller / Request

確認結果:

- ControllerはActionとResponderの橋渡しに寄っています。
- FormRequestは入力形式の検証を担当しています。
- Controllerに直接のDB操作や外部API通信が入っている候補は確認していません。

注意点:

- `ApiPreviewController` と `ApisGuruPreviewController` は Action が返す preview 対象配列または `ApisGuruPreviewPageDTO` を `ApiPreviewResponder` へ渡す構造に整理済みです。Controller自体はHTTP入口とResponder接続に留めています。

分類:

- E: ApiPreview系 Action / Responder境界は整理済みです。route、propsキー、画面挙動は変更していません。

### Action

確認結果:

- 多くの Action は Query Action / Command Action として DTOを受け取り、Service / Repositoryを呼び、ResultDTOへまとめています。
- API Catalog note系 Action では Repository経由で create / update / delete しています。直接DB操作ではなく、現時点ではAction手順の範囲として扱えます。
- DanceShortsRadarのランキングや同期Actionは、Read Model生成、snapshot同期、page2同期などの手順を持ち、詳細判断をService / Repositoryへ逃がしています。

注意点:

- `app/Actions/ApiPreview/*Action.php` は `ApiPreviewResponder` を注入せず、preview対象配列またはAPIs.guru画面用 `ApisGuruPreviewPageDTO` を返します。実取得Actionは Repository → Factory → `ApiPreviewResultDTO` → `ApisGuruPreviewPageDTO` の手順に留め、Inertia props生成とResponse生成はController経由でResponderへ渡します。

分類:

- E: ApiPreview系 Action はHTTP Response生成を持たない構成へ整理済みです。既存props構造とrouteは変更していません。

### Service

確認結果:

- Serviceは業務判断、計算、分類、サニタイズ、XML解析、同期結果集約を担当しています。
- `rg` 上、Service内に直接 `DB::` / `Http::` は確認していません。
- Repository呼び出しを含むServiceはありますが、DBアクセスそのものはRepositoryへ寄せています。

分類:

- E: 現時点では大きな修正対象なし。

### Repository

確認結果:

- DB query / Eloquent / Query Builder / `Http::timeout()` はRepositoryへ集まっています。
- External API Repository は APIs.guru、YouTube Data API、気象庁XML取得を扱っています。
- `DanceShortVideoSnapshotRepository` と `DanceShortRankingReadModelRepository` はQueryが大きめですが、Read Model / ranking用のDB境界として機能しています。

注意点:

- Read Model / snapshot系Repositoryはクエリが複雑です。現時点では業務判断をService / Strategyへ分けるコメントとfeature docsがあり、今回の棚卸しでは挙動変更なしで記録に留めます。

分類:

- C: Read Model / snapshot query の責務再分割は、今後Projection / Read Model拡張時に設計判断として扱います。

### DTO / ListDTO

確認結果:

- DTOは `final readonly class` が多く、値保持と `toArray()` に寄っています。
- `toArray()` は配列変換に留まるものが多く、DB操作やHTTPレスポンス生成は確認していません。
- ResponderやRepositoryでDTOを配列化して渡す境界が見えます。

注意点:

- UI props shape と対応する TypeScript型は機能ごとに定義されていますが、共通生成や自動同期はありません。props構造を変える場合はResponder / DTO / TS型 / testを同時確認する必要があります。

分類:

- E: 今回のDTO境界は記録のみ。
- D: PR Summaryでは `SENS-012` としてReact props / Responder契約を確認します。

### Responder / Presenter

確認結果:

- Responderは Inertia props と JSON shape の整形に寄っています。
- `DanceShortVideoRankingResponder` は Inertia表示と display-card-window JSONの両方を担当しますが、同じランキングprops契約の出力整形としてまとまっています。
- `ProjectLogsResponder` はログ表示propsを作り、ERRORだけがresolve URLを持つことをコメントで明示しています。

注意点:

- ApiPreviewではControllerがAction結果をResponderへ渡し、ResponderがInertia Response生成を担当する構造に整理済みです。

分類:

- E: ApiPreviewのAction / Responder呼び出し境界は整理済みです。

### Event / Listener

確認結果:

- EventはApplicationLogやDanceShortsRadarの発生事実を表しています。
- Listenerはログ保存やRead Model再生成要求などの副作用に寄っています。
- ApplicationLog feature docsでも、Event / Listener / Repositoryの保存フローが明記されています。

分類:

- E: 今回の修正対象なし。

### Job / Artisan Command / Scheduler

確認結果:

- JobはAction呼び出し、timeout / tries / queue / lock境界を持つ形が中心です。
- Artisan CommandはJob dispatchまたはAction呼び出し入口として使われています。
- Schedulerは `routes/console.php` に集約され、実行タイミングとenv gateを担当しています。

注意点:

- `health:send-daily-server-report` などOperations / ServerHealth領域は、feature docsではなく command-registry / tests / codeに責務説明があります。運用機能として十分か、機能固有docsへ分けるかは人間判断が必要です。

分類:

- F: Operations / ServerHealth のfeature docs要否は人間確認候補です。

### React Page / Hook / Component / Type / Utility

確認結果:

- React側は `type` によるprops契約が広く定義されています。
- PageはInertia props受け取り、UI状態、Feature Componentへの橋渡しに寄っています。
- Componentは表示、操作、UI状態、router / axios入口を扱っています。
- Utility / Hookは表示補助やUI状態を分離しています。
- `any` は確認範囲では見つからず、`as unknown as` は `jquery.ripples` の型なしplugin bridge 1件のみです。近くに理由コメントがあり、型の逃げ道を局所化しています。

注意点:

- `resources/js/Pages/ApiCatalog/Index.tsx` と `resources/js/Pages/QuakeWavePreview/Index.tsx` は axios polling / start action / Inertia reload をPage内で扱っています。現時点では画面入口として成立していますが、通信状態が増える場合はHook / Feature Containerへ切り出す候補です。
- `resources/js/Pages/QuakeWavePreview/hooks/useQuakeMapRefresh.ts` は通信手順をHookへ切り出しており、同種の拡張時の参考になります。
- Lab / ConstructionOrderNewMock / EventCardCalendar / idea board系は大きいTSXもありますが、MOCK / IDEA BOARDの範囲に閉じています。Product化時にそのまま昇格しないことが重要です。

分類:

- B: ApiCatalog / QuakeWavePreview のPage内pollingは、状態が増える場合にHook化を検討します。
- C: Lab / MOCK / IDEA BOARDの大型ComponentはProduct化時に責務再設計が必要です。
- E: 今回は画面挙動・props構造を変えません。

### config / database / bootstrap / public

確認結果:

- `config/` は機能設定、queue、logging、servicesなどを保持しています。
- `database/` はMigration / Seeder / Factory / testsと対応し、今回はスキーマ変更なしです。
- `bootstrap/app.php` はInertia middlewareなどLaravel入口を定義しています。
- `public/index.php`、`robots.txt`、`favicon.ico`、`public/data/plate-boundaries.geojson`、`public/images/dance-shorts-radar/*.svg` は管理対象として確認しました。
- `public/build/` はbuild成果物のため棚卸し対象外にしました。

分類:

- E: 今回は設定、Migration、public assetを変更しません。

## コメント / PHPDoc / JSDoc / 型アノテーションのズレ

確認結果:

- `TODO` / `FIXME` / `@todo` は確認範囲で見つかりませんでした。
- 「仮」は多数ありますが、多くは MOCK / PROTOTYPE / IDEA BOARD / preview の意図説明として使われています。`docs/commenting.md` の禁止する曖昧な保留とは分けて扱えます。
- PHPDocの `@param` / `@return` は配列shapeやDTO配列の説明に使われています。
- JSDoc / コメントは、責務境界を説明する用途のものが多く、今回すぐ削除すべき古い説明は確認していません。
- TypeScriptの `any` は確認範囲で見つかりませんでした。
- `as unknown as` は `resources/js/Components/Effects/WaterBackground.tsx` の `jquery.ripples` bridge に1件あり、型なしpluginを局所化する説明が近くにあります。

分類:

- A: 今回安全に直すコメント / PHPDoc / JSDoc / 型注釈のズレはなし。
- E: MOCK / preview の「仮データ」説明は意図説明として残します。

## DTO / Type / Inertia props契約

確認結果:

- Backend DTOからResponderへ渡し、Responderがsnake_case propsやJSON shapeへ整形する流れが見えます。
- DanceShortsRadar、DanceShortsAnalyzer、QuakeWavePreview、ApiCatalog、ProjectLogsはInertia propsをFeature testやReact型で固定しています。
- React側では `resources/js/Components/Lab/DanceShortsRadar/types.ts`、DanceShortsAnalyzer Fields、ApiCatalog Pages/Components、JapanQuakeWaveMap Componentsなどにprops型があります。

注意点:

- Backend DTO / Responder / TypeScript型の自動同期はありません。props変更時は手動で同時確認します。
- `SENS-012` の対象として、Responder propsキー、React props型、Feature test / Vitestの追従漏れをPRごとに確認します。

分類:

- D: 今後のPRではReact props / Responder契約確認をPR Summaryへ明記します。

## 分類一覧

### A: 今回安全に直せるもの

- なし。コードコメント / PHPDoc / JSDoc / 型アノテーションの軽微修正は、今回の確認では必要と判断しませんでした。

### B: 責務境界が怪しいが、影響範囲確認が必要なもの

- `resources/js/Pages/ApiCatalog/Index.tsx`: Pageが検索、同期開始、polling、Inertia reloadを扱っています。状態が増える場合はFeature Hook / Containerへ分ける候補です。
- `resources/js/Pages/QuakeWavePreview/Index.tsx`: feed / map pin syncの開始とpollingをPageが持っています。`useQuakeMapRefresh` と同様のHook化余地があります。

### C: レイヤー再分割や設計判断が必要なもの

- DanceShortsRadarのRead Model / snapshot系RepositoryはQueryが複雑です。今後 Projection / Read Model を拡張する場合、Repository / Strategy / Service の境界を再点検します。
- Lab / MOCK / IDEA BOARDの大型TSXは、Product化時にそのまま昇格せず、Route / Request / Action / Service / Repository / DTO / Responder / Component / Testへ責務再設計します。

### D: docs / Sensors / PRテンプレート / レビュー観点へ反映するもの

- この棚卸し結果を `docs/operations/code-responsibility-inventory.md` に反映しました。
- `SENS-007`: レイヤー責務境界チェックをPR Summaryへ記載します。
- `SENS-012`: React props / Responder契約チェックをPR Summaryへ記載します。
- `SENS-016`: Comment / Annotation Drift をPR Summaryへ記載します。
- 新しいコマンドは追加していないため、`docs/operations/command-registry.md` の更新は不要です。

### E: 今は触らず記録だけにするもの

- Lab / MOCK / IDEA BOARD route closureと大型Component。
- `public/build/` はbuild成果物として棚卸し対象外にし、今回触りません。
- ApiPreview の route、Inertia propsキー、React側props型は変更していません。
- Migration / DB schema / route / API仕様 / Docker / queue / scheduler / 認証 / 認可は変更しません。

### F: 未確認のため断定できず、人間確認が必要なもの

- Operations / ServerHealthの機能固有docs要否。現在は command-registry、tests、コードコメントで追えますが、運用機能として `docs/features/` または `docs/operations/` に別紙を置くかは人間判断が必要です。

## 今回すぐ直した箇所

- docs更新:
  - `docs/operations/code-responsibility-inventory.md` のApiPreview境界・確認コマンド記録を更新

- ApiPreview境界整理:
  - `app/Actions/ApiPreview/*Action.php` からResponder依存とInertia Response戻り値を外し、ControllerがResponderを呼ぶ構成へ整理
  - APIs.guru画面用に `ApisGuruPreviewPageDTO` を追加し、Actionは取得結果DTOと画面DTOの作成、ResponderはInertia props化を担当するよう整理

route、Inertia propsキー、React Page / Component、Migration、DBスキーマは変更していません。

## 別PRへ分ける候補

- ApiCatalog / QuakeWavePreview のPage内polling責務をHook / Feature Containerへ寄せるかの検討
- DanceShortsRadar Read Model / snapshot query境界の再点検
- Operations / ServerHealthのfeature / operations docs追加要否判断
- Lab / MOCK / IDEA BOARDをProduct化する場合の責務再設計

## 次回以降の責務レビュー観点

- ControllerへDB取得、外部API通信、業務判断、複雑なprops整形が入っていないか
- Requestへ業務上の可否判断が入っていないか
- ActionがHTTP ResponseやInertia renderへ近づきすぎていないか
- ServiceへDB直接操作やHTTP都合が入っていないか
- Repositoryへ保存可否、表示判断、業務状態の意味定義が入っていないか
- DTO / ListDTOへDB操作、レスポンス生成、表示判断が入っていないか
- Responderへ候補判定、metric再計算、DB取得が入っていないか
- Job / Command / Schedulerへ同期本体や業務ロジックが隠れていないか
- React PageがAPI通信、polling、UI状態、表示整形を持ちすぎていないか
- Hookが通信入口なのかUI状態整理なのか責務名で分かるか
- ComponentがLaravel側で確定すべき業務判断を再構築していないか
- TypeScript props型がResponder propsと一致しているか
- `any` や二段階型アサーションで契約の不明瞭さを隠していないか
- コメント / PHPDoc / JSDoc が実装と矛盾していないか
- `仮` がMOCK / PROTOTYPE / IDEA BOARDの意図説明ではなく、未確定仕様の正当化になっていないか

## 2026-07-04 QuakeWavePreview / JapanQuake 追加棚卸し

確認範囲:

- `routes/web.php` の `/quakewave-preview`、map、mock、xml、feed entry sync、map pin sync、refresh、status API
- `routes/console.php` の `earthquake-map-refresh` Scheduler入口
- QuakeWavePreview / JapanQuake 周辺の Controller / Request / Action / Service / Repository / DTO / Responder / Job / Artisan Command / Feature Test / Unit Test

確認結果:

- Controller は HTTP入口に寄っており、今回 `QuakeWavePreviewXmlController` から Service 直呼びと Inertia props 直組みを外し、`GetQuakeWavePreviewXmlAction` / `QuakeWavePreviewXmlResponder` へ接続しました。
- `GetQuakeWavePreviewIndexAction` は配列Resultではなく `QuakeWavePreviewIndexResultDTO` を返し、Responder が既存 Inertia props 形へ変換する境界に整理しました。
- `EarthquakeXmlPreviewService` は XML取得結果を `EarthquakeXmlFeedPreviewResultDTO` として返し、`result` props の key は Responder 側で既存形のまま維持しています。
- Feed / map pin sync 開始、status API、統合refresh、Job / Artisan Command / Scheduler は棚卸しのみで、Queue設定、Scheduler設定、外部API仕様、route、route name、JSON key、Inertia props keyは変更していません。
- Repository は DB / 外部XML取得境界、Service はXML解析・抽出・同期結果分類、Responder はJSON / Inertia props整形に寄っています。今回の差分で DB / Migration / Model / Docker / nginx / queue / scheduler / `.env` / 本番環境は変更していません。

追加テスト:

- `EarthquakeXmlFeedPreviewResultDTOTest`: XML preview result の success / error shape を固定
- `QuakeWavePreviewIndexResultDTOTest`: index ResultDTO から sync run 配列へ変換する境界を固定

Sensors:

- `SENS-007`: QuakeWavePreview / JapanQuake 周辺のレイヤー責務境界を確認
- `SENS-008`: Job / Queue / Scheduler / External API は棚卸し対象のみ。実変更なし
- `SENS-012`: Responder契約は既存 props / JSON key 維持を確認
- `SENS-010`: secrets / .env / config 実値は変更なし

## PR Summaryに書けるSensors確認

該当Sensors:

- `SENS-001`: docs変更のため `git diff --check` を確認する
- `SENS-002`: docs更新要否。責務棚卸しdocsのApiPreview境界記録を更新した。`docs/index.md` には既に導線があるため追加更新なし
- `SENS-006`: md-router参照漏れ。今回の作業種別は既存ルーターのdocs運用 / コメント・アノテーション追従確認に近いが、新しい恒久ルール追加ではないためMDルーター更新は不要
- `SENS-007`: レイヤー責務境界。Controller / Request / Action / Service / Repository / DTO / Responder / Reactを棚卸しした
- `SENS-012`: React props / Responder契約。props構造は変更せず、境界確認結果だけ記録した
- `SENS-016`: Comment / Annotation Drift。TODO/FIXME、PHPDoc/JSDoc、型アサーションの確認結果を記録した

非該当Sensors:

- `SENS-008`: External API / Scheduler / Queue / Job の実装変更なし
- `SENS-011`: Migration / rollback 変更なし
- `SENS-010`: secrets / `.env` / config 実値には触れていない

確認コマンド:

- コード変更を含むため、ApiPreview feature test、format-check、`git diff --check`、必要なfrontend確認を実行する
- Laravel test / npm build / typecheck はコード変更を含むため実行対象です。
