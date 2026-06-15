/**
 * 工事発注管理・請求システム idea-board の説明用データです。
 *
 * 実DBやAPIには接続せず、構想説明用の固定カード、Mermaid図、ECharts option を集約します。
 */
import type { EChartsOption } from 'echarts';

export type TextCard = {
    title: string;
    detail: string;
};

export type RoleColumn = {
    title: string;
    role: string;
    points: string[];
};

export type StatusText = {
    label: string;
    detail: string;
};

export type ReasonModalPlan = {
    title: string;
    badge: string;
    detail: string;
    fields: string[];
};

export type ScreenMock = {
    title: string;
    device: string;
    detail: string;
    rows: string[];
};

export type StatusChart = {
    title: string;
    description: string;
    option: EChartsOption;
};

/**
 * CSV一括アップロード入口で表示する、ファイル単位の仮状態です。
 *
 * 実アップロード結果ではなく、IDEA BOARD上で状態表示の粒度を伝えるために使います。
 */
export type UploadFilePreview = {
    fileName: string;
    size: string;
    status: string;
    count: string;
    detail: string;
    tone: 'waiting' | 'accepted' | 'error';
};

/**
 * 連続撮影・添付アップロードのキュー表示用仮データです。
 *
 * 保存前後の削除や再試行を見せるための表示専用データであり、S3保存状態とは接続しません。
 */
export type UploadQueuePreview = {
    title: string;
    status: string;
    detail: string;
    meta: string;
    tone: 'processing' | 'saved' | 'failed';
};

export const overviewCards: TextCard[] = [
    {
        title: '案件登録と管理・請求を切り離す',
        detail: 'Form / Excel はCSVを作成して投入する入口に限定し、投入後の検知、退避、登録、管理はSystem側の構想として扱います。',
    },
    {
        title: 'FormもExcelもCSVを介す',
        detail: 'Form入力はCSV生成、Excel運用はCSV出力へそろえ、どちらもCSV投入先を介す流れとして明示します。',
    },
    {
        title: '案件を中心に管理する',
        detail: '登録後は案件を軸に、発注、作業カード、請求、領収、作業カード履歴、操作履歴を紐づけて見ます。',
    },
    {
        title: '説明用のIDEA BOARD',
        detail: 'このページは構想を整理するための固定データ表示であり、CSV取込、S3、Queue、帳票生成の本処理には接続しません。',
    },
];

export const csvEntryRoles: RoleColumn[] = [
    {
        title: 'Form',
        role: '画面入力からCSVを作成する入口',
        points: [
            '必要情報を画面で入力する',
            '入力内容からCSVを生成する',
            'CSV投入先へアップロードする',
            '管理・請求処理はこの入口では行わない',
        ],
    },
    {
        title: 'Excel',
        role: '既存運用からCSVを出力する入口',
        points: [
            'Excelで案件データを作成する',
            'CSVとして出力する',
            'CSV投入先へアップロードまたは転送する',
            'Excelを管理正本にしない',
        ],
    },
    {
        title: 'CSV投入先',
        role: 'CSVを受け渡す中間地点',
        points: [
            'FormとExcelの投入先をそろえる',
            '投入されたCSVをSystem側の検知対象にする',
            '投入入口では登録可否や請求状態を判断しない',
            'System側処理へ渡る前の置き場として見せる',
        ],
    },
];

export const csvEntryFlowChart = `flowchart TD
    title["題：FormとExcelはCSVを作る・投入する入口"]
    start(["Start"])
    form["Form入力"]
    formCsv["CSV生成"]
    excel["Excelでデータ作成"]
    excelCsv["CSV出力"]
    drop["CSV投入先"]
    wait["System側の検知待ち"]
    endNode(["End"])
    title --> start
    start --> form --> formCsv --> drop
    start --> excel --> excelCsv --> drop
    drop --> wait --> endNode`;

export const csvBulkUploadCards: TextCard[] = [
    {
        title: 'Formとは別のCSV入口',
        detail: 'Formは画面入力からCSVを作る入口、CSV一括アップロードは作成済みCSVをまとめて投入先へ置く入口として分けて見せます。',
    },
    {
        title: '複数CSVをまとめて投入',
        detail: '複数選択とドラッグ＆ドロップで投入し、ファイルごとに投入待ち、受付済み、エラーを表示する構想です。',
    },
    {
        title: 'System側の検知対象へ渡す',
        detail: '投入後はLaravel Scheduler、S3原本退避、Job / Queue、CSV解析・検証、DB登録、ログ管理へ進む流れへつなぎます。',
    },
    {
        title: '入口では判断しない',
        detail: 'CSV一括アップロード入口ではDB登録、請求判断、状態遷移判断を行わず、投入と状態表示までに限定します。',
    },
];

export const csvBulkUploadFiles: UploadFilePreview[] = [
    {
        fileName: 'orders_2026-06-14.csv',
        size: '184KB',
        status: '投入待ち',
        count: '42件',
        detail: '複数CSV選択後、System側の検知対象へ置く前の状態です。',
        tone: 'waiting',
    },
    {
        fileName: 'invoice_ready_cases.csv',
        size: '96KB',
        status: '受付済み',
        count: '18件',
        detail: '投入先へ置かれ、以後はScheduler検知と非同期処理の対象になります。',
        tone: 'accepted',
    },
    {
        fileName: 'receipts_retry.csv',
        size: '32KB',
        status: 'エラー',
        count: '3件',
        detail: '列不足などをファイル単位で表示し、この入口では登録可否を確定しません。',
        tone: 'error',
    },
];

export const csvBulkUploadFlowChart = `flowchart TD
    title["題：CSV一括アップロード入口とSystem側処理の分担"]
    start(["Start"])
    selectFiles["複数CSV選択・ドラッグ＆ドロップ"]
    statusList["ファイルごとの状態・件数表示"]
    entryRule["入口ではDB登録・請求判断をしない"]
    drop["CSV投入先へ置く"]
    scheduler["Laravel Schedulerで検知"]
    s3["S3へ原本退避"]
    queue["Job / Queue投入"]
    parse["CSV解析・検証"]
    database["DB登録"]
    logs["処理結果・ログ管理"]
    endNode(["End"])
    title --> start
    start --> selectFiles --> statusList --> entryRule --> drop
    drop --> scheduler --> s3 --> queue --> parse --> database --> logs --> endNode`;

export const uploadUseCases: TextCard[] = [
    { title: 'csv_bulk_upload', detail: '複数CSVをまとめて投入する入口' },
    { title: 'continuous_photo_upload', detail: '撮るたびに保存へ進める連続撮影' },
    { title: 'pdf_bulk_upload', detail: 'PDFを一括保存する入口' },
    { title: 'work_card_photo_upload', detail: '作業カード写真の添付' },
    { title: 'invoice_attachment', detail: '請求書まわりの添付' },
    { title: 'receipt_attachment', detail: '領収書まわりの添付' },
    { title: 'history_attachment', detail: '履歴へ紐づく添付' },
];

export const uploadFoundationResponsibilities: RoleColumn[] = [
    {
        title: 'UploadField',
        role: '構想上の共通UI名',
        points: [
            'ファイル選択、撮影、圧縮、サムネイルを扱う',
            'プレビュー、削除、再試行、状態表示を扱う',
            '保存先パスやS3キーを組み立てない',
            '今回共通Componentとして実装しない',
        ],
    },
    {
        title: 'Factory / Strategy / Service',
        role: 'Laravel側の保存先制御候補',
        points: [
            '用途と対象IDから保存先ルールを切り替える',
            '許可ルール、形式判定、保存先決定を扱う',
            '用途ごとの分岐をフロントへ漏らさない',
            '今回バックエンドクラスとして実装しない',
        ],
    },
    {
        title: 'StorageRepository',
        role: 'Laravel Storage / S3境界候補',
        points: [
            'ファイル本体の保存境界を担当する',
            'Storage / S3の詳細を上位へ漏らさない',
            '説明メタ情報の業務判断は持たない',
            '今回Repositoryとして実装しない',
        ],
    },
    {
        title: 'UploadDestinationResponder',
        role: '返却整形だけの候補',
        points: [
            'Inertia props、JSON、署名付きURL、結果一覧を整形する',
            '保存先決定を担当しない',
            'Service / Factory / Strategyの判断結果を返すだけにする',
            '今回Responderとして実装しない',
        ],
    },
];

export const continuousPhotoSteps: TextCard[] = [
    { title: '写真撮影', detail: 'カメラ起動は実装せず、連続撮影できるUI構想として見せます。' },
    { title: 'フロント圧縮', detail: '実画像圧縮は行わず、撮影後に軽量化してキューへ入る流れだけを示します。' },
    { title: 'アップロードキューへ追加', detail: 'まとめて保存ではなく、撮るたびに保存へ進める基本方針です。' },
    { title: 'Laravel側で保存先発行', detail: 'フロントは用途と対象IDを渡し、保存先パスはLaravel側で決める構想です。' },
    { title: 'S3保存', detail: '実S3保存は行わず、Storage / S3へ本体を置く将来像として表示します。' },
    { title: 'サムネイル表示', detail: '保存済みの見え方を固定データのサムネイル枠として表現します。' },
    { title: 'プレビュー / 削除 / 再試行', detail: '保存前削除はローカルキュー、保存後削除は将来の履歴対象にできる操作として分けます。' },
    { title: '後からメモ編集', detail: 'メモ編集APIは作らず、将来の管理イメージとしてだけ示します。' },
];

export const continuousPhotoPolicies: TextCard[] = [
    {
        title: '最大枚数制限なし',
        detail: '枚数で先に閉じず、表示名、用途、メモで探しやすくする考え方です。',
    },
    {
        title: '撮るたび保存が基本',
        detail: '撮影完了ボタンは保存開始ではなく、撮影セッション終了として扱う構想です。',
    },
    {
        title: '削除の意味を分ける',
        detail: '保存前削除はローカルキューから削除、保存後削除は削除操作として扱う将来像です。',
    },
];

export const uploadQueuePreviews: UploadQueuePreview[] = [
    {
        title: '施工前 001',
        status: '圧縮中',
        detail: '撮影直後。保存先はまだフロントでは知らない状態です。',
        meta: '撮影操作日時 2026-06-14 09:18 / 元ファイル名なし',
        tone: 'processing',
    },
    {
        title: '検収写真 014',
        status: '保存済み',
        detail: 'サムネイルからプレビュー、削除、再試行の導線を見せます。',
        meta: '生成ファイル名 inspection-014.jpg / アップロード者 現場担当',
        tone: 'saved',
    },
    {
        title: '領収添付 PDF',
        status: '再試行待ち',
        detail: '写真だけでなくPDFや添付にも同じ状態表示を使う構想です。',
        meta: '元ファイル名 receipt-aoba.pdf / 用途 receipt_attachment',
        tone: 'failed',
    },
];

export const continuousPhotoFlowChart = `flowchart TD
    title["題：共通UploadFieldと連続撮影アップロードの流れ"]
    start(["Start"])
    shoot["写真撮影"]
    compress["フロント圧縮"]
    queue["アップロードキューへ追加"]
    issueDestination["Laravel側で保存先発行"]
    s3["S3保存"]
    thumbnail["サムネイル表示"]
    actions["プレビュー・削除・再試行"]
    memo["後からメモ編集"]
    endNode(["End"])
    title --> start
    start --> shoot --> compress --> queue --> issueDestination --> s3 --> thumbnail --> actions --> memo --> endNode`;

export const uploadDestinationFlowChart = `flowchart TD
    title["題：保存先をフロントで決めない構成"]
    uploadField["UploadField 用途と対象IDだけ渡す"]
    service["Service 許可・形式・保存先ルール"]
    factory["Factory / Strategy 用途別ルール切替"]
    repository["Repository Laravel Storage / S3境界"]
    responder["Responder 返却形式だけ整形"]
    response["UIへ状態・URL・結果一覧を返す"]
    uploadField --> service --> factory --> repository
    service --> responder --> response
    response --> uploadField`;

export const uploadMetadataGroups: RoleColumn[] = [
    {
        title: '用途と紐づき',
        role: '何のためのファイルかを探せるようにする',
        points: ['アップロード用途', '紐づき先種別', '紐づき先ID', '削除状態', '削除理由'],
    },
    {
        title: 'ファイル本体情報',
        role: 'Storage / S3上の本体を追えるようにする',
        points: ['元ファイル名 / 生成ファイル名', '保存先キー', 'MIME type', 'ファイルサイズ', 'サムネイル有無'],
    },
    {
        title: '説明と操作履歴',
        role: '後から意味を補足できるようにする',
        points: ['表示名', 'メモ', '撮影操作日時', 'アップロード者', 'アップロード日時'],
    },
];

export const uploadMetadataNotes: TextCard[] = [
    {
        title: 'ファイル本体と説明を分ける',
        detail: '写真、CSV、PDF、請求添付、領収添付、履歴添付の本体はStorage / S3へ置き、説明や用途は将来DBメタ情報として扱います。',
    },
    {
        title: '元ファイル名がない撮影に対応',
        detail: '撮影データは元ファイル名がない場合があるため、元ファイル名 / 生成ファイル名の両方で表現します。',
    },
    {
        title: 'EXIF前提にしない',
        detail: '撮影日時はEXIFではなく、撮影操作日時またはアップロード日時として扱う構想です。位置情報取得や画像解析は扱いません。',
    },
];

export const csvProcessingSteps: TextCard[] = [
    {
        title: 'Laravel Schedulerで検知',
        detail: '投入先に置かれたCSVを、System側が定期的に見つける構想として表現します。',
    },
    {
        title: 'CSV原本をS3へ退避',
        detail: '取込前の原本を後から追えるよう、退避先へ移す流れとして示します。',
    },
    {
        title: 'Job / Queueへ投入',
        detail: 'CSV解析、検証、登録を非同期で処理する構想として、画面上の図解に留めます。',
    },
    {
        title: '結果とログを確認',
        detail: '登録成功、登録エラー、処理ログを見える化し、運用時の追跡しやすさを整理します。',
    },
];

export const csvProcessingFlowChart = `flowchart TD
    title["題：CSV受付・退避・非同期登録の構想"]
    start(["Start"])
    drop["CSV投入先"]
    scheduler["Laravel Schedulerで検知"]
    s3["S3へ原本退避"]
    queue["Job / Queue投入"]
    parse["CSV解析・検証"]
    database["DB登録"]
    logs["処理結果・ログ管理"]
    endNode(["End"])
    title --> start
    start --> drop --> scheduler --> s3 --> queue --> parse --> database --> logs --> endNode`;

export const caseStructureCards: TextCard[] = [
    {
        title: '発注',
        detail: '案件に対して複数の発注を紐づけ、業者や金額、発注状況を追えるようにします。',
    },
    {
        title: '作業カード',
        detail: '案件ごとに必要な作業をカードとして追加し、状態と順序を管理する考え方です。',
    },
    {
        title: '請求・領収',
        detail: '請求書作成、入金確認、領収書発行を同時扱いにせず、案件の流れの中で分けて見ます。',
    },
    {
        title: '履歴',
        detail: '作業カード履歴と操作履歴を残し、誰がいつ理由付きで状態を動かしたかを追えるようにします。',
    },
];

export const caseStructureFlowChart = `flowchart TD
    title["題：案件中心のデータ構造イメージ"]
    caseNode["案件"]
    orders["発注 複数"]
    workCards["作業カード 複数"]
    invoices["請求 複数"]
    receipts["領収 複数"]
    workHistory["作業カード履歴 複数"]
    operationHistory["操作履歴 複数"]
    caseNode --> orders
    caseNode --> workCards
    caseNode --> invoices
    caseNode --> receipts
    workCards --> workHistory
    caseNode --> operationHistory`;

export const workCardExamples = [
    '現地確認',
    '発注確認',
    '商品手配',
    '施工日調整',
    '施工完了',
    '写真登録',
    '検収',
    '請求前確認',
    '請求書作成',
    '入金確認',
    '領収書発行',
];

export const workCardStatuses: StatusText[] = [
    { label: '未着手', detail: 'まだ作業に入っていない状態です。' },
    { label: '処理中', detail: '作業や確認を進めている途中です。' },
    { label: '完了', detail: '必要な作業が終わった状態です。' },
    { label: '対象外', detail: 'この案件では最初から不要な作業です。' },
    { label: 'SKIP', detail: '本来必要な工程を、理由付きで飛ばした終端状態です。' },
    { label: '保留', detail: '後で対応するため、今は止めている非終端状態です。' },
];

export const skipHoldPlans: ReasonModalPlan[] = [
    {
        title: 'SKIP理由モーダル',
        badge: '終端扱い',
        detail: '本来必要な工程を飛ばすため、理由を必須にして、操作者、日時、理由を履歴として残す構想です。',
        fields: ['理由（必須）', '対象作業カード', '操作者', '操作日時'],
    },
    {
        title: '保留理由モーダル',
        badge: '後で対応',
        detail: '対応を止める理由を必須にし、必要に応じて再確認日を入力できる画面イメージです。保留は請求へ進める終端状態として扱いません。',
        fields: ['理由（必須）', '再確認日（任意）', '対象作業カード', '操作者'],
    },
];

export const billingLifecycleFlowChart = `flowchart TD
    title["題：案件登録から領収書発行・案件完了まで"]
    start(["Start"])
    caseRegistration["案件登録"]
    orderRegistration["発注登録"]
    addCards["作業カード追加"]
    processCards["作業カード処理"]
    terminalCards["必須カードが完了・対象外・SKIP"]
    invoice["請求書作成"]
    payment["入金確認"]
    receipt["領収書発行"]
    completed["案件完了"]
    endNode(["End"])
    title --> start
    start --> caseRegistration --> orderRegistration --> addCards --> processCards --> terminalCards
    terminalCards --> invoice --> payment --> receipt --> completed --> endNode`;

export const billingGateGroups: RoleColumn[] = [
    {
        title: '請求へ進める状態',
        role: '終端状態として扱う',
        points: ['完了', '対象外', 'SKIP'],
    },
    {
        title: '請求へ進めない状態',
        role: '作業が残っている状態として扱う',
        points: ['未着手', '処理中', '保留'],
    },
];

export const billingGateFlowChart = `flowchart TD
    title["題：請求へ進める条件"]
    cards["必要な作業カードを確認"]
    allTerminal{"すべて完了・対象外・SKIP？"}
    hasHold{"保留が残っている？"}
    canInvoice["請求書作成へ進める"]
    blocked["請求書作成へ進めない"]
    skipReason["SKIPは理由必須"]
    cards --> allTerminal
    allTerminal -- "はい" --> hasHold
    allTerminal -- "いいえ" --> blocked
    hasHold -- "いいえ" --> canInvoice
    hasHold -- "はい" --> blocked
    canInvoice --> skipReason`;

export const screenMocks: ScreenMock[] = [
    {
        title: '案件一覧',
        device: 'スマートフォン縦',
        detail: '検索、請求可否、入金状態を縦に読みやすく並べます。',
        rows: ['案件A / 作業中', '案件B / 請求可能', '案件C / 入金待ち'],
    },
    {
        title: '作業カード一覧',
        device: 'スマートフォン縦',
        detail: '案件ごとのカード状態、SKIP、保留をタップしやすい高さで表示します。',
        rows: ['現地確認 / 完了', '施工完了 / 処理中', '請求前確認 / 保留'],
    },
    {
        title: '請求一覧',
        device: 'スマートフォン縦',
        detail: '請求書作成、入金待ち、領収書発行済みを同じカード上で分けて示します。',
        rows: ['請求A / 作成済み', '請求B / 入金待ち', '請求C / 領収済み'],
    },
    {
        title: 'ダッシュボード',
        device: 'タブレット / PC',
        detail: 'CSV処理、作業カード、案件状態、請求・領収をグラフで俯瞰します。',
        rows: ['CSV処理', '作業カード状態', '月別請求額'],
    },
];

export const screenFlowChart = `flowchart TD
    title["題：説明用画面イメージ"]
    mobileCase["モバイル 案件一覧"]
    mobileCards["モバイル 作業カード一覧"]
    mobileInvoice["モバイル 請求一覧"]
    modal["SKIP / 保留理由モーダル"]
    dashboard["タブレット / PC ダッシュボード"]
    pcCase["PC 案件一覧"]
    mobileCase --> mobileCards --> modal
    mobileCase --> mobileInvoice
    dashboard --> pcCase
    dashboard --> mobileCase`;

export const techStackCards: TextCard[] = [
    { title: 'Laravel', detail: 'HTTP入口、Scheduler、Queue、Storage連携の候補として整理します。' },
    { title: 'React / Inertia / TypeScript', detail: '構想画面、状態の見せ方、モバイルファーストUIの候補です。' },
    { title: 'MySQL', detail: '案件、発注、作業カード、請求、領収、履歴の保存先候補です。' },
    { title: 'Redis / Queue', detail: 'CSV解析・検証・登録を非同期へ分ける候補として示します。' },
    { title: 'Laravel Scheduler', detail: 'CSV投入先の検知を定期実行する候補として扱います。' },
    { title: 'Laravel Storage / S3', detail: 'CSV原本の退避先、ファイル保存の候補として表示します。' },
];

export const conceptNotes: TextCard[] = [
    {
        title: '仕様整理ページ',
        detail: 'このページは検討中の流れを整理するためのIDEA BOARDであり、本実装や確定仕様ではありません。',
    },
    {
        title: '今後変更される可能性',
        detail: '実際の仕様、画面、DB構成、運用手順は、検討と検証に合わせて変わる可能性があります。',
    },
    {
        title: '非同期処理は流れの説明',
        detail: 'CSV処理、S3、Queue、Schedulerは構想上の流れとして示し、ここでは処理そのものを動かしません。',
    },
];

const chartTextColor = '#f8fafc';
const chartMutedColor = 'rgba(203, 213, 225, 0.78)';
const chartGridColor = 'rgba(148, 163, 184, 0.18)';

function buildPieChartOption(
    title: string,
    data: { name: string; value: number }[],
    colors: string[],
): EChartsOption {
    return {
        backgroundColor: 'transparent',
        color: colors,
        title: {
            text: title,
            left: 'center',
            top: 0,
            textStyle: {
                color: chartTextColor,
                fontSize: 15,
                fontWeight: 700,
            },
        },
        tooltip: {
            trigger: 'item',
        },
        legend: {
            type: 'scroll',
            bottom: 0,
            left: 'center',
            textStyle: {
                color: chartMutedColor,
            },
        },
        series: [
            {
                name: title,
                type: 'pie',
                radius: ['38%', '64%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                label: {
                    color: chartTextColor,
                    formatter: '{b}\n{c}件',
                },
                labelLine: {
                    lineStyle: {
                        color: chartMutedColor,
                    },
                },
                data,
            },
        ],
    };
}

function buildMonthlyInvoiceChartOption(): EChartsOption {
    return {
        backgroundColor: 'transparent',
        title: {
            text: '月別請求額',
            subtext: '説明用の仮データ',
            left: 'center',
            top: 0,
            textStyle: {
                color: chartTextColor,
                fontSize: 15,
                fontWeight: 700,
            },
            subtextStyle: {
                color: chartMutedColor,
            },
        },
        tooltip: {
            trigger: 'axis',
            valueFormatter: (value) => `${value}万円`,
        },
        grid: {
            top: 76,
            right: 18,
            bottom: 28,
            left: 44,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: ['4月', '5月', '6月', '7月', '8月', '9月'],
            axisLabel: {
                color: chartMutedColor,
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(148, 163, 184, 0.35)',
                },
            },
            axisTick: {
                show: false,
            },
        },
        yAxis: {
            type: 'value',
            name: '万円',
            nameTextStyle: {
                color: chartMutedColor,
            },
            axisLabel: {
                color: chartMutedColor,
            },
            splitLine: {
                lineStyle: {
                    color: chartGridColor,
                },
            },
        },
        series: [
            {
                name: '請求額',
                type: 'bar',
                data: [180, 260, 220, 340, 310, 420],
                barMaxWidth: 26,
                itemStyle: {
                    color: '#38bdf8',
                    borderRadius: [4, 4, 0, 0],
                },
            },
        ],
    };
}

function buildVendorOrderChartOption(): EChartsOption {
    return {
        backgroundColor: 'transparent',
        title: {
            text: '業者別発注件数',
            subtext: '説明用の仮データ',
            left: 'center',
            top: 0,
            textStyle: {
                color: chartTextColor,
                fontSize: 15,
                fontWeight: 700,
            },
            subtextStyle: {
                color: chartMutedColor,
            },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
        },
        grid: {
            top: 76,
            right: 18,
            bottom: 26,
            left: 28,
            containLabel: true,
        },
        xAxis: {
            type: 'value',
            axisLabel: {
                color: chartMutedColor,
            },
            splitLine: {
                lineStyle: {
                    color: chartGridColor,
                },
            },
        },
        yAxis: {
            type: 'category',
            data: ['青葉設備', '北斗建設', '森田電工', '東都内装'],
            axisLabel: {
                color: chartTextColor,
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(148, 163, 184, 0.35)',
                },
            },
            axisTick: {
                show: false,
            },
        },
        series: [
            {
                name: '発注件数',
                type: 'bar',
                data: [12, 9, 7, 5],
                barMaxWidth: 20,
                itemStyle: {
                    color: '#34d399',
                    borderRadius: [0, 4, 4, 0],
                },
            },
        ],
    };
}

export const statusCharts: StatusChart[] = [
    {
        title: 'CSV取込処理ステータス',
        description: '投入済み、退避済み、Queue投入済み、登録成功、登録エラーを仮データで確認します。',
        option: buildPieChartOption(
            'CSV取込処理ステータス',
            [
                { name: '投入済み', value: 9 },
                { name: 'S3退避済み', value: 8 },
                { name: 'Queue投入済み', value: 7 },
                { name: '登録成功', value: 18 },
                { name: '登録エラー', value: 2 },
            ],
            ['#38bdf8', '#a78bfa', '#f59e0b', '#34d399', '#fb7185'],
        ),
    },
    {
        title: '作業カード状態内訳',
        description: '未着手、処理中、完了、対象外、SKIP、保留を作業カード単位で見ます。',
        option: buildPieChartOption(
            '作業カード状態内訳',
            [
                { name: '未着手', value: 14 },
                { name: '処理中', value: 8 },
                { name: '完了', value: 31 },
                { name: '対象外', value: 6 },
                { name: 'SKIP', value: 4 },
                { name: '保留', value: 5 },
            ],
            ['#94a3b8', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa', '#fb7185'],
        ),
    },
    {
        title: '案件ステータス内訳',
        description: '登録済みから完了まで、案件単位の進み具合を俯瞰します。',
        option: buildPieChartOption(
            '案件ステータス内訳',
            [
                { name: '登録済み', value: 6 },
                { name: '作業中', value: 13 },
                { name: '請求可能', value: 7 },
                { name: '請求済み', value: 9 },
                { name: '入金待ち', value: 5 },
                { name: '完了', value: 12 },
            ],
            ['#60a5fa', '#f59e0b', '#22d3ee', '#a78bfa', '#fb7185', '#34d399'],
        ),
    },
    {
        title: '請求・領収ステータス',
        description: '請求書作成、入金確認、領収書発行を同じタイミングにせず分けて見ます。',
        option: buildPieChartOption(
            '請求・領収ステータス',
            [
                { name: '未請求', value: 10 },
                { name: '請求書作成済み', value: 8 },
                { name: '入金待ち', value: 7 },
                { name: '入金済み', value: 9 },
                { name: '領収書発行済み', value: 6 },
            ],
            ['#94a3b8', '#38bdf8', '#f59e0b', '#34d399', '#a78bfa'],
        ),
    },
    {
        title: '月別請求額',
        description: '請求額の山を月別に見て、確認タイミングを判断します。',
        option: buildMonthlyInvoiceChartOption(),
    },
    {
        title: '業者別発注件数',
        description: '業者ごとの発注件数を見て、確認対象を絞り込みます。',
        option: buildVendorOrderChartOption(),
    },
];
