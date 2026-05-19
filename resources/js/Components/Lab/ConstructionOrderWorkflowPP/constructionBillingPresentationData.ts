import type { EChartsOption } from 'echarts';

/*
 * 工事発注管理・請求システムPP専用の説明データです。
 * 今回は本実装ではなく「説明用PPの見せ方強化」なので、DB・Controller・Action・Service から
 * データを取得せず、固定の mock data としてこのファイルに寄せています。
 *
 * 後で本番DTOや Inertia props に置き換える場合は、各セクション側の JSX を大きく触らず、
 * ここで定義している配列・Mermaid文字列・ECharts option の入力元だけを差し替える想定です。
 */
export type TextCard = {
    title: string;
    detail: string;
};

export type RoleColumn = {
    title: string;
    role: string;
    points: string[];
};

export type StatusChart = {
    title: string;
    description: string;
    option: EChartsOption;
};

export const problemCards: TextCard[] = [
    {
        title: '情報が一画面に混ざる',
        detail: '工事情報、発注情報、請求情報を同じ表で扱うと、どの状態を見ればよいか判断しづらくなります。',
    },
    {
        title: '見る軸が人によって違う',
        detail: '業者別、工事別、請求状態別など、確認したい軸が変わるため、同じ一覧だけでは追いきれません。',
    },
    {
        title: '状態が散らばりやすい',
        detail: '未発注、発注済み、工事中、完了、未請求、請求済みが分散し、更新漏れや属人判断が起きやすくなります。',
    },
    {
        title: 'Excelだけでは境界が曖昧',
        detail: '既存Excelは入力元として活かしつつ、CSVを通じてSystemの登録処理へ渡す境界を明確にします。',
    },
];

/*
 * Mermaid は Notion でも読みやすい pure flowchart 記法に限定します。
 * HTMLタグや装飾記法を混ぜると、Notion貼り付け時や共通コンポーネント描画時の
 * 互換性確認が増えるため、このPPでは題・Start・Endを持つ素朴な流れ図に寄せています。
 */
export const problemFlowChart = `flowchart TD
    title["題：工事発注管理と請求管理の課題"]
    start(["Start"])
    mixed["工事・発注・請求の情報が同じ場所に混ざる"]
    viewAxis["業者別・工事別・請求状態別で見たい情報が変わる"]
    statusHard["未発注・発注済み・工事中・完了・未請求・請求済みを追いづらい"]
    excelOnly["Excelだけに状態管理を閉じ込める"]
    risk["更新漏れと属人判断が起きやすい"]
    split["Form入力とExcel CSV入力を同じ登録処理へ集約する"]
    endNode(["End"])
    title --> start
    start --> mixed --> viewAxis --> statusHard --> excelOnly --> risk --> split --> endNode`;

export const formExcelSystemRoles: RoleColumn[] = [
    {
        title: 'Form',
        role: '画面から発注情報を入力する入口',
        points: [
            '画面から発注情報を入力',
            '入力値を形式バリデーション',
            '発注登録DTOへ変換',
            'System側の発注登録処理へ渡す',
            '手入力が必要な現場運用を受ける',
        ],
    },
    {
        title: 'Excel',
        role: '既存ExcelからCSVを出す入力元',
        points: [
            '既存業務のExcelを入口にする',
            'ExcelからCSVを出力',
            'CSVを読み取って発注登録DTOへ変換',
            'Excel自体を正本にしない',
            'Form入力と同じ登録処理へ乗せる',
        ],
    },
    {
        title: 'System',
        role: '同じDTO・同じ登録処理で発注を作成する領域',
        points: [
            '発注登録DTOを受け取る',
            'Form入力とCSV入力を同じ処理へ集約',
            '発注状態管理',
            '工事状態管理',
            '請求状態管理',
            'DB保存',
            '履歴管理',
            'ADR / レイヤード構成',
        ],
    },
];

export const formExcelSystemFlowChart = `flowchart TD
    title["題：Form入力とExcel CSV入力を同じ発注登録へ集約する"]
    start(["Start"])
    form["Form入力"]
    formDto["発注登録DTO"]
    excel["既存Excel"]
    csv["CSV出力"]
    csvDto["発注登録DTO"]
    register["発注登録"]
    db["DB保存"]
    manage["工事・発注・請求管理"]
    endNode(["End"])
    title --> start
    start --> form --> formDto --> register
    start --> excel --> csv --> csvDto --> register
    register --> db --> manage --> endNode`;

export const constructionBillingFlowChart = `flowchart TD
    title["題：発注登録から工事・請求管理までの業務フロー"]
    start(["Start"])
    chooseInput["入力方法を選ぶ"]
    formInput["Form入力"]
    excelCsv["ExcelからCSV出力"]
    dto["発注登録DTO"]
    createOrder["発注登録"]
    saveDb["DB保存"]
    manageOrder["発注状態管理"]
    manageConstruction["工事状態管理"]
    manageInvoice["請求状態管理"]
    endNode(["End"])
    title --> start
    start --> chooseInput
    chooseInput --> formInput --> dto
    chooseInput --> excelCsv --> dto
    dto --> createOrder --> saveDb --> manageOrder --> manageConstruction --> manageInvoice --> endNode`;

export const screenCards: TextCard[] = [
    {
        title: '工事一覧',
        detail: '工事名、業者、状態、請求状況から探す入口です。',
    },
    {
        title: '工事詳細',
        detail: '工事の基本情報、関連する発注、請求状況を確認します。',
    },
    {
        title: '発注一覧',
        detail: '業者別、工事別、発注状態別に発注を確認します。',
    },
    {
        title: '発注詳細',
        detail: '発注内容、金額、履歴、工事との関係を確認します。',
    },
    {
        title: '請求一覧',
        detail: '未請求、作成済み、入金待ち、入金済みを追います。',
    },
    {
        title: '請求詳細',
        detail: '請求内容、対象発注、入金状態、確認履歴を見ます。',
    },
    {
        title: 'CSV取込確認',
        detail: '既存Excelから出したCSVを、発注登録DTOへ変換する前に確認します。',
    },
];

export const screenFlowChart = `flowchart TD
    title["題：用途ごとに画面を分ける構成"]
    start(["Start"])
    constructionList["工事一覧"]
    constructionDetail["工事詳細"]
    orderList["発注一覧"]
    orderDetail["発注詳細"]
    invoiceList["請求一覧"]
    invoiceDetail["請求詳細"]
    csvImport["CSV取込確認"]
    endNode(["End"])
    title --> start
    start --> constructionList
    start --> csvImport
    constructionList --> constructionDetail
    constructionDetail --> orderList
    orderList --> orderDetail
    constructionDetail --> invoiceList
    invoiceList --> invoiceDetail
    csvImport --> orderDetail
    orderDetail --> constructionDetail
    invoiceDetail --> endNode`;

export const architectureResponsibilities: TextCard[] = [
    {
        title: 'Controller / Request',
        detail: 'ControllerはHTTP入口、Requestは入力形式バリデーションに限定します。',
    },
    {
        title: 'Action / Service',
        detail: 'Actionはユースケース手順、Serviceは状態判断や業務ルールを扱います。',
    },
    {
        title: 'Repository / DTO',
        detail: 'RepositoryはDB取得・保存の境界、DTOはレイヤー間のデータキャリアです。',
    },
    {
        title: 'Responder / Component',
        detail: 'Responderは画面表示用データ整形、Componentは表示責務に集中します。',
    },
    {
        title: 'Factory / Event / Listener',
        detail: 'FactoryはDTO生成や表示切替補助、Eventは事実、Listenerは通知・ログなどの副作用を扱います。',
    },
];

export const architectureFlowChart = `flowchart TD
    title["題：ADRとレイヤード構成の責務分離"]
    start(["Start"])
    controller["Controller：HTTP入口"]
    request["Request：入力形式バリデーション"]
    action["Action：ユースケース手順"]
    service["Service：業務判断"]
    repository["Repository：DB取得・保存"]
    dto["DTO：レイヤー間データ"]
    responder["Responder：画面表示用データ整形"]
    component["Component：画面表示"]
    factory["Factory：DTO生成・表示切替補助"]
    event["Event：発注作成後・請求作成後などの事実"]
    listener["Listener：通知・ログ・後処理"]
    endNode(["End"])
    title --> start
    start --> controller --> request --> action --> service --> repository
    repository --> dto --> responder --> component --> endNode
    action --> factory --> dto
    action --> event --> listener --> endNode`;

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
                radius: ['42%', '68%'],
                center: ['50%', '48%'],
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
        title: '工事ステータス内訳',
        description: '未着手から請求済みまで、工事単位で進捗を見ます。',
        option: buildPieChartOption(
            '工事ステータス内訳',
            [
                { name: '未着手', value: 6 },
                { name: '発注済み', value: 10 },
                { name: '進行中', value: 14 },
                { name: '完了', value: 8 },
                { name: '請求済み', value: 12 },
            ],
            ['#94a3b8', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa'],
        ),
    },
    {
        title: '請求ステータス内訳',
        description: '未請求、請求作成済み、入金待ち、入金済みを分けて確認します。',
        option: buildPieChartOption(
            '請求ステータス内訳',
            [
                { name: '未請求', value: 11 },
                { name: '請求作成済み', value: 7 },
                { name: '入金待ち', value: 9 },
                { name: '入金済み', value: 16 },
            ],
            ['#fb7185', '#f59e0b', '#22d3ee', '#34d399'],
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
