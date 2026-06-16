/**
 * 工事発注管理システム IDEA BOARD のタブ式構造整理 Component です。
 *
 * 固定データだけで「案件 / 工程 / カード / 証跡 / 帳票 / 履歴 / 関連案件」
 * の関係を説明し、DB保存、API通信、帳票生成、本番用状態遷移には接続しません。
 */
import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    BadgeCheck,
    Camera,
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    FileText,
    GitBranch,
    History,
    Image,
    Layers,
    Link2,
    ListChecks,
    Package,
    RotateCcw,
    SkipForward,
    Wrench,
} from 'lucide-react';

type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'slate';

type TabKey =
    | 'premise'
    | 'structure'
    | 'patterns'
    | 'processes'
    | 'cardTypes'
    | 'samples'
    | 'evidence'
    | 'money'
    | 'documents'
    | 'relatedCases'
    | 'history';

type TabDefinition = {
    key: TabKey;
    label: string;
    summary: string;
    icon: LucideIcon;
};

type ConceptItem = {
    title: string;
    detail: string;
    icon: LucideIcon;
    tone: Tone;
};

type Pattern = {
    title: string;
    detail: string;
    processes: string[];
    cards: string[];
};

type ProcessCandidate = {
    title: string;
    detail: string;
    tone: Tone;
};

type StatusDefinition = {
    label: string;
    detail: string;
    tone: Tone;
};

type CardTypeDefinition = {
    title: string;
    role: string;
    fields: string[];
    statusHint: string;
    icon: LucideIcon;
    tone: Tone;
};

type SampleCard = {
    title: string;
    cardType: string;
    linkedProcess: string;
    state: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    taxRate?: number;
    amount?: number;
    adjustmentAmount?: number;
    textRows: { label: string; value: string }[];
    attachments: string[];
    photoGroups?: string[];
    tone: Tone;
};

type DocumentDefinition = {
    title: string;
    role: string;
    sources: string[];
    statuses: string[];
    icon: LucideIcon;
    tone: Tone;
};

type HistoryEvent = {
    title: string;
    actor: string;
    time: string;
    reason: string;
    related: string;
    tone: Tone;
};

const ideaBoardTabs: TabDefinition[] = [
    { key: 'premise', label: '前提', summary: '案件・工程・カードの大筋', icon: ClipboardList },
    { key: 'structure', label: '全体構造', summary: '案件を中心にした管理単位', icon: Layers },
    { key: 'patterns', label: '案件パターン', summary: '初期工程とカードのテンプレート', icon: GitBranch },
    { key: 'processes', label: '工程', summary: '一本道ではない確認カテゴリ', icon: ListChecks },
    { key: 'cardTypes', label: 'カード種別', summary: '工程に紐づく管理単位', icon: Package },
    { key: 'samples', label: 'カードサンプル', summary: '種別ごとの持ち物', icon: BadgeCheck },
    { key: 'evidence', label: '写真・証跡', summary: '工程やカードに紐づく材料', icon: Camera },
    { key: 'money', label: '金額・数量', summary: '保存値と表示を分離', icon: CircleDollarSign },
    { key: 'documents', label: '帳票', summary: '見積・請求・領収の成果物', icon: FileText },
    { key: 'relatedCases', label: '関連案件', summary: '完了後対応を別案件化', icon: Link2 },
    { key: 'history', label: '履歴', summary: '操作記録と理由を残す', icon: History },
];

const toneClasses: Record<Tone, { panel: string; icon: string; text: string; border: string; soft: string }> = {
    amber: {
        panel: 'border-amber-200/28 bg-amber-300/10',
        icon: 'bg-amber-200/18 text-amber-100',
        text: 'text-amber-100',
        border: 'border-amber-200/32',
        soft: 'bg-amber-200/12 text-amber-50',
    },
    cyan: {
        panel: 'border-cyan-200/28 bg-cyan-300/10',
        icon: 'bg-cyan-200/18 text-cyan-100',
        text: 'text-cyan-100',
        border: 'border-cyan-200/32',
        soft: 'bg-cyan-200/12 text-cyan-50',
    },
    emerald: {
        panel: 'border-emerald-200/28 bg-emerald-300/10',
        icon: 'bg-emerald-200/18 text-emerald-100',
        text: 'text-emerald-100',
        border: 'border-emerald-200/32',
        soft: 'bg-emerald-200/12 text-emerald-50',
    },
    rose: {
        panel: 'border-rose-200/28 bg-rose-300/10',
        icon: 'bg-rose-200/18 text-rose-100',
        text: 'text-rose-100',
        border: 'border-rose-200/32',
        soft: 'bg-rose-200/12 text-rose-50',
    },
    sky: {
        panel: 'border-sky-200/28 bg-sky-300/10',
        icon: 'bg-sky-200/18 text-sky-100',
        text: 'text-sky-100',
        border: 'border-sky-200/32',
        soft: 'bg-sky-200/12 text-sky-50',
    },
    slate: {
        panel: 'border-white/14 bg-white/7',
        icon: 'bg-white/12 text-slate-100',
        text: 'text-slate-100',
        border: 'border-white/18',
        soft: 'bg-white/10 text-slate-100',
    },
    violet: {
        panel: 'border-violet-200/28 bg-violet-300/10',
        icon: 'bg-violet-200/18 text-violet-100',
        text: 'text-violet-100',
        border: 'border-violet-200/32',
        soft: 'bg-violet-200/12 text-violet-50',
    },
};

const yenFormatter = new Intl.NumberFormat('ja-JP');

const premiseItems: ConceptItem[] = [
    {
        title: '案件が親',
        detail: '工程、カード、証跡、帳票、履歴、関連案件は、すべて案件へ紐づく管理単位として扱います。',
        icon: ClipboardList,
        tone: 'cyan',
    },
    {
        title: '工程は確認カテゴリ',
        detail: '工程は一本道の順番ではなく、案件ごとに有効化する本筋・確認カテゴリです。',
        icon: ListChecks,
        tone: 'emerald',
    },
    {
        title: 'カードは工程に紐づく',
        detail: 'カードは商品、作業、調整、例外対応、証跡、帳票などを管理する単位です。',
        icon: Package,
        tone: 'amber',
    },
    {
        title: '案件ステータスは集計表示',
        detail: '案件ステータス自体で対象外、SKIP、順番変更を表現せず、工程とカードの状態を集計して見せます。',
        icon: BadgeCheck,
        tone: 'violet',
    },
    {
        title: '写真は証跡',
        detail: '写真・ファイル・メモは工程またはカードに紐づく材料で、単独の進行ステップにはしません。',
        icon: Camera,
        tone: 'sky',
    },
    {
        title: '工事後対応は関連案件',
        detail: 'クレーム、保証、追加請求、返金などは元案件を無理に巻き戻さず、必要に応じて関連案件として立てます。',
        icon: Link2,
        tone: 'rose',
    },
];

const oldMainLineReplacements = [
    { before: '入口処理', after: '案件進行の主線ではなく、登録前の受け渡しとして扱う' },
    { before: 'カードを工程扱いする表現', after: 'カードは工程に紐づく管理単位として扱う' },
    { before: '帳票をひとまとめにした確認', after: '見積書・請求書・領収書の成果物へ分ける' },
    { before: '写真を単独工程にする表現', after: '工程またはカードに紐づく証跡として扱う' },
    { before: '矢印で進む一本道', after: '案件ごとに必要な確認カテゴリを有効化する' },
];

const structureNodes: ConceptItem[] = [
    { title: '工程', detail: '案件ごとに必要な確認カテゴリだけを有効化する。', icon: ListChecks, tone: 'emerald' },
    { title: 'カード', detail: '工程に紐づく商品・作業・調整などの管理単位。', icon: Package, tone: 'amber' },
    { title: '写真・証跡', detail: '工程またはカードを説明する写真、ファイル、メモ。', icon: Image, tone: 'sky' },
    { title: '帳票', detail: '見積書、請求書、領収書として出る成果物。', icon: FileText, tone: 'violet' },
    { title: '履歴', detail: '誰が、いつ、なぜ操作したかを残す記録。', icon: History, tone: 'cyan' },
    { title: '関連案件', detail: '完了後対応や追加対応を元案件へ紐づける。', icon: Link2, tone: 'rose' },
];

const casePatterns: Pattern[] = [
    {
        title: '商品だけ案件',
        detail: '商品手配と納品、請求・入金確認を中心に初期表示します。',
        processes: ['商品確認', '発注確認', '納品確認', '請求確認', '入金・領収確認', '完了確認'],
        cards: ['商品カード', '帳票カード', '証跡カード'],
    },
    {
        title: '作業だけ案件',
        detail: '現場と作業、証跡、検収を中心に初期表示します。',
        processes: ['作業確認', '現場確認', '作業対応', '証跡確認', '検収確認', '請求確認', '入金・領収確認', '完了確認'],
        cards: ['作業カード', '証跡カード', '帳票カード'],
    },
    {
        title: '商品＋作業案件',
        detail: '商品と作業の両方を持つ標準的な工事案件の初期テンプレートです。',
        processes: ['商品確認', '作業確認', '現場確認', '発注確認', '作業対応', '証跡確認', '検収確認', '請求確認', '入金・領収確認', '完了確認'],
        cards: ['商品カード', '作業カード', '調整カード', '証跡カード', '帳票カード'],
    },
    {
        title: '工事後関連案件',
        detail: '元案件を参照しながら、完了後に発生した対応だけを別案件として管理します。',
        processes: ['元案件参照', '対応内容確認', '作業対応', '調整確認', '証跡確認', '完了確認'],
        cards: ['例外対応カード', '作業カード', '証跡カード'],
    },
    {
        title: 'クレーム・ミス対応案件',
        detail: '原因、対応方針、例外対応、証跡、調整を通常案件から分けて整理します。',
        processes: ['原因確認', '対応方針確認', '例外対応', '証跡確認', '調整確認', '完了確認'],
        cards: ['例外対応カード', '調整カード', '証跡カード'],
    },
];

const standardProcesses: ProcessCandidate[] = [
    { title: '案件内容確認', detail: '依頼内容、顧客、現場、希望日の確認。', tone: 'cyan' },
    { title: '商品確認', detail: '商品名、型番、数量、単価、発注要否の確認。', tone: 'amber' },
    { title: '作業確認', detail: '作業内容、人数、時間、請求対象の確認。', tone: 'emerald' },
    { title: '現場確認', detail: '搬入経路、既存状態、訪問条件の確認。', tone: 'sky' },
    { title: '発注確認', detail: '商品や外注の発注内容と控えの確認。', tone: 'violet' },
    { title: '納品確認', detail: '納品日、数量、納品証跡の確認。', tone: 'cyan' },
    { title: '作業対応', detail: '実作業の実施、メモ、写真、添付の確認。', tone: 'emerald' },
    { title: '証跡確認', detail: '着工前、作業中、完了、検収用の証跡確認。', tone: 'sky' },
    { title: '検収確認', detail: '完了後に結果を確認し、差戻しの有無を見る。', tone: 'amber' },
    { title: '請求確認', detail: '請求対象、金額、調整、請求書状態の確認。', tone: 'violet' },
    { title: '入金・領収確認', detail: '入金状態と領収書発行の確認。', tone: 'rose' },
    { title: '完了確認', detail: '残作業、帳票、履歴、関連案件要否の確認。', tone: 'slate' },
];

const exceptionProcesses: ProcessCandidate[] = [
    { title: 'クレーム対応', detail: '指摘内容、対応方針、再訪問、証跡を管理。', tone: 'rose' },
    { title: 'ミス対応', detail: '原因、影響、是正、追加請求なし対応を管理。', tone: 'rose' },
    { title: '保証対応', detail: '保証期間、対象範囲、無償対応を管理。', tone: 'violet' },
    { title: '再訪問対応', detail: '再訪問日、担当者、対応結果を管理。', tone: 'sky' },
    { title: '返金調整', detail: '返金理由、金額、承認、帳票反映を管理。', tone: 'amber' },
    { title: '追加請求対応', detail: '追加理由、対象カード、請求書反映を管理。', tone: 'emerald' },
    { title: '破損対応', detail: '破損箇所、責任範囲、証跡、対応内容を管理。', tone: 'rose' },
    { title: '不備対応', detail: '不足情報や不備の確認、差戻し、再確認を管理。', tone: 'amber' },
];

const processStatuses: StatusDefinition[] = [
    { label: 'できていない', detail: '必要だが、まだ確認や対応が終わっていない。', tone: 'slate' },
    { label: '確認中', detail: '内容確認や関係者確認の途中。', tone: 'sky' },
    { label: 'できている', detail: '必要な確認や対応が完了している。', tone: 'emerald' },
    { label: '対象外', detail: 'その案件では最初から不要な工程。', tone: 'violet' },
    { label: 'SKIP', detail: '本来必要だが、理由付きで飛ばした工程。', tone: 'amber' },
    { label: '差戻し', detail: '確認後に再対応が必要になった状態。', tone: 'rose' },
];

const cardTypes: CardTypeDefinition[] = [
    {
        title: '商品カード',
        role: '商品名、型番、数量、単価、税率、小計、仕様書などを管理する。',
        fields: ['商品名', '型番', '数量', '単位', '単価', '税率', '小計', 'メモ', '添付ファイル'],
        statusHint: '写真は基本不要。商品資料、メーカー資料、発注書控えを添付できる。',
        icon: Package,
        tone: 'amber',
    },
    {
        title: '作業カード',
        role: '作業内容、数量、単価、写真、メモ、添付ファイルを管理する。',
        fields: ['作業名', '作業内容', '数量', '単位', '単価', '税率', '小計', '写真', 'メモ'],
        statusHint: '着工前、作業中、完了後、検収用の連続撮影入口を持てる。',
        icon: Wrench,
        tone: 'emerald',
    },
    {
        title: '調整カード',
        role: '割引、値引き、端数調整、追加請求なし対応などの金額調整を管理する。',
        fields: ['調整種別', '調整金額', '理由', '承認状態', 'メモ', '添付ファイル', '任意写真'],
        statusHint: 'マイナス金額は数値で保持し、表示時だけ赤文字にする。',
        icon: CircleDollarSign,
        tone: 'rose',
    },
    {
        title: '例外対応カード',
        role: 'クレーム、ミス、保証、破損、不備など通常とは分けたい対応を管理する。',
        fields: ['例外種別', '発生理由', '対応内容', '対応状態', '写真', '関連工程', '関連カード'],
        statusHint: '通常カードへ混ぜず、例外工程または関連案件側に表示する。',
        icon: AlertTriangle,
        tone: 'amber',
    },
    {
        title: '証跡カード',
        role: '写真、ファイル、メモを工程またはカードへ紐づけて管理する。',
        fields: ['証跡種別', '紐づく工程', '紐づくカード', '写真', 'メモ', '撮影日時', '添付ファイル'],
        statusHint: '写真だけでなく、PDF、補足資料、メモも扱える。',
        icon: Camera,
        tone: 'sky',
    },
    {
        title: '帳票カード',
        role: '見積書、請求書、領収書などの帳票成果物と金額集計を管理する。',
        fields: ['帳票種別', '対象内容', '金額集計', '状態', 'ファイル', 'メモ'],
        statusHint: '対象カード件数ではなく、対象内容、金額、状態が分かる表示にする。',
        icon: FileText,
        tone: 'violet',
    },
];

const cardStateCandidates = ['未着手', '対応中', '確認待ち', '完了', '差戻し', '保留', '取消'];

const sampleCards: SampleCard[] = [
    {
        title: '給湯器本体',
        cardType: '商品カード',
        linkedProcess: '商品確認',
        state: '確認待ち',
        quantity: 1,
        unit: '台',
        unitPrice: 128000,
        taxRate: 10,
        amount: 128000,
        textRows: [
            { label: '型番', value: 'GT-C2472SAW' },
            { label: 'メモ', value: '既存品番から後継機種を選定' },
        ],
        attachments: ['メーカー仕様書.pdf', '発注書控え.pdf'],
        tone: 'amber',
    },
    {
        title: '給湯器交換作業',
        cardType: '作業カード',
        linkedProcess: '作業対応',
        state: '対応中',
        quantity: 1,
        unit: '式',
        unitPrice: 45000,
        taxRate: 10,
        amount: 45000,
        textRows: [
            { label: '作業内容', value: '既存撤去、新規設置、試運転' },
            { label: 'メモ', value: '搬入経路が狭いため2名対応' },
        ],
        attachments: ['現場メモ.txt'],
        photoGroups: ['着工前 3枚', '作業中 5枚', '完了後 4枚', '検収用 2枚'],
        tone: 'emerald',
    },
    {
        title: '端数値引き',
        cardType: '調整カード',
        linkedProcess: '請求確認',
        state: '確認済み',
        adjustmentAmount: -3000,
        textRows: [
            { label: '調整種別', value: '端数値引き' },
            { label: '理由', value: '見積調整のため' },
            { label: 'メモ', value: '請求書へ反映済み' },
        ],
        attachments: ['承認メモ.pdf'],
        tone: 'rose',
    },
    {
        title: '施工後クレーム対応',
        cardType: '例外対応カード',
        linkedProcess: '検収確認',
        state: '対応中',
        textRows: [
            { label: '例外種別', value: '施工後クレーム対応' },
            { label: '発生理由', value: '設置後に配管カバーの浮き指摘' },
            { label: '対応内容', value: '再訪問して固定調整' },
        ],
        attachments: ['電話記録.txt'],
        photoGroups: ['指摘箇所 2枚', '対応後 3枚'],
        tone: 'amber',
    },
    {
        title: '完了写真',
        cardType: '証跡カード',
        linkedProcess: '証跡確認',
        state: '登録済み',
        textRows: [
            { label: '証跡種別', value: '完了写真' },
            { label: '紐づき', value: '作業カード「給湯器交換作業」' },
            { label: 'メモ', value: '試運転後の完了状態' },
        ],
        attachments: ['completion-photo-001.jpg', 'completion-photo-002.jpg'],
        photoGroups: ['完了後 4枚'],
        tone: 'sky',
    },
    {
        title: '請求書',
        cardType: '帳票カード',
        linkedProcess: '請求確認',
        state: '確認待ち',
        textRows: [
            { label: '対象', value: '給湯器本体 / 給湯器交換作業 / 端数値引き' },
            { label: '小計', value: `${formatYen(173000)}` },
            { label: '調整', value: `${formatYen(-3000)}` },
            { label: '税額', value: `${formatYen(17000)}` },
            { label: '合計', value: `${formatYen(187000)}` },
        ],
        attachments: ['invoice-202606.pdf'],
        tone: 'violet',
    },
];

const evidenceCategories = [
    { title: '着工前証跡', detail: '工事前の既存状態、搬入経路、注意点を残す。', tone: 'cyan' as Tone },
    { title: '作業中証跡', detail: '工事中の途中状態、施工内容、判断材料を残す。', tone: 'emerald' as Tone },
    { title: '完了証跡', detail: '工事後の完了状態、試運転結果、清掃状態を残す。', tone: 'sky' as Tone },
    { title: '検収用証跡', detail: '完了後の確認に使う写真、ファイル、メモを残す。', tone: 'violet' as Tone },
    { title: '納品証跡', detail: '納品書、数量確認、納品時写真を残す。', tone: 'amber' as Tone },
    { title: 'その他資料', detail: '仕様書、メーカー資料、問い合わせ記録などを残す。', tone: 'slate' as Tone },
];

const productUnits = ['台', '個', '本', '枚', 'セット', '式', 'm', 'm2'];
const workUnits = ['式', '人工', '時間', '回', '箇所', '日'];

const documents: DocumentDefinition[] = [
    {
        title: '見積書',
        role: '商品カード、作業カード、調整カードを集計し、事前提示する成果物。',
        sources: ['商品カード', '作業カード', '調整カード'],
        statuses: ['未作成', '作成中', '確認待ち', '確認済み', '送付済み', '差戻し', '取消'],
        icon: FileText,
        tone: 'cyan',
    },
    {
        title: '請求書',
        role: '請求対象のカードと調整を集計し、請求状態を管理する成果物。',
        sources: ['商品カード', '作業カード', '調整カード', '帳票カード'],
        statuses: ['未作成', '作成中', '確認待ち', '確認済み', '送付済み', '差戻し', '取消'],
        icon: FileText,
        tone: 'violet',
    },
    {
        title: '領収書',
        role: '入金確認後に発行し、領収状態とファイルを管理する成果物。',
        sources: ['請求書', '入金確認', '帳票カード'],
        statuses: ['未作成', '作成中', '確認待ち', '確認済み', '送付済み', '差戻し', '取消'],
        icon: FileText,
        tone: 'emerald',
    },
];

const originalCaseOnlyItems = ['軽微なメモ追加', '写真追加', '完了後の補足資料', '問い合わせ記録'];
const relatedCaseItems = ['再訪問', '追加作業', 'クレーム対応', '保証対応', '返金', '追加請求', '再施工', '部材交換', '破損対応', 'ミス対応'];
const relatedCaseTypes = ['工事後対応', '追加作業', 'クレーム対応', '保証対応', '返金調整', '追加請求', 'ミス対応'];

const historyEvents: HistoryEvent[] = [
    {
        title: '案件パターン選択',
        actor: '受付担当',
        time: '2026-06-16 09:15',
        reason: '商品＋作業案件として初期工程を作成',
        related: '案件 #CO-20260616-001',
        tone: 'cyan',
    },
    {
        title: '工程SKIP',
        actor: '施工管理',
        time: '2026-06-16 10:42',
        reason: '既存写真で納品確認が代替できるため',
        related: '納品確認 / 商品カード「給湯器本体」',
        tone: 'amber',
    },
    {
        title: '写真追加',
        actor: '現場担当',
        time: '2026-06-16 13:08',
        reason: '作業中の配管状態を補足',
        related: '作業カード「給湯器交換作業」',
        tone: 'sky',
    },
    {
        title: '請求書作成',
        actor: '経理担当',
        time: '2026-06-16 16:20',
        reason: '商品、作業、調整カードの金額を集計',
        related: '帳票カード「請求書」',
        tone: 'violet',
    },
    {
        title: '関連案件作成',
        actor: 'サポート担当',
        time: '2026-06-17 09:30',
        reason: '完了後に再訪問が必要になったため',
        related: '元案件 #CO-20260616-001',
        tone: 'rose',
    },
];

function formatYen(value: number): string {
    return `${yenFormatter.format(value)}円`;
}

function formatQuantity(quantity: number, unit: string): string {
    return `${yenFormatter.format(quantity)} ${unit}`;
}

export default function ConstructionOrderIdeaBoardTabs() {
    const [activeTab, setActiveTab] = useState<TabKey>('premise');
    const activeTabDefinition = ideaBoardTabs.find((tab) => tab.key === activeTab) ?? ideaBoardTabs[0];

    return (
        <div className="min-w-0">
            <IdeaBoardHero />

            <div className="mt-6 border-y border-white/12 bg-black/18 py-3">
                <div
                    role="tablist"
                    aria-label="工事発注管理システム IDEA BOARD タブ"
                    className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
                >
                    {ideaBoardTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.key === activeTab;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                id={`idea-board-tab-${tab.key}`}
                                aria-controls={`idea-board-panel-${tab.key}`}
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex min-h-14 min-w-[132px] flex-none items-center gap-2 rounded-lg border px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 sm:min-w-[148px] ${
                                    isActive
                                        ? 'border-cyan-100/55 bg-cyan-100 text-slate-950 shadow-[0_14px_32px_rgba(8,145,178,0.22)]'
                                        : 'border-white/14 bg-white/8 text-slate-100 hover:bg-white/12'
                                }`}
                            >
                                <Icon className="h-4 w-4 flex-none" aria-hidden />
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold">{tab.label}</span>
                                    <span
                                        className={`mt-0.5 block text-xs leading-4 ${
                                            isActive ? 'text-slate-800' : 'text-slate-300/82'
                                        }`}
                                    >
                                        {tab.summary}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <section
                id={`idea-board-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`idea-board-tab-${activeTab}`}
                className="mt-6 min-w-0"
            >
                <SectionHeading
                    eyebrow="Idea Board"
                    title={activeTabDefinition.label}
                    description={activeTabDefinition.summary}
                    icon={activeTabDefinition.icon}
                />
                <div className="mt-5">{renderTabPanel(activeTab)}</div>
            </section>
        </div>
    );
}

function renderTabPanel(activeTab: TabKey): ReactNode {
    switch (activeTab) {
        case 'premise':
            return <PremisePanel />;
        case 'structure':
            return <StructurePanel />;
        case 'patterns':
            return <PatternsPanel />;
        case 'processes':
            return <ProcessesPanel />;
        case 'cardTypes':
            return <CardTypesPanel />;
        case 'samples':
            return <SamplesPanel />;
        case 'evidence':
            return <EvidencePanel />;
        case 'money':
            return <MoneyPanel />;
        case 'documents':
            return <DocumentsPanel />;
        case 'relatedCases':
            return <RelatedCasesPanel />;
        case 'history':
            return <HistoryPanel />;
    }
}

function IdeaBoardHero() {
    return (
        <header className="min-w-0 border-b border-white/12 pb-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-cyan-100/32 bg-cyan-100/12 px-3 text-cyan-50">
                            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                            IDEA BOARD
                        </span>
                        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-emerald-100/28 bg-emerald-100/12 px-3 text-emerald-50">
                            <Layers className="h-3.5 w-3.5" aria-hidden />
                            構造整理
                        </span>
                    </div>
                    <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
                        工事発注管理システム IDEA BOARD
                    </h1>
                    <p className="mt-4 max-w-4xl text-base leading-8 text-slate-100/86">
                        旧来の「矢印で進む案件進行」から離れ、案件を親として、工程、カード、写真・証跡、帳票、履歴、関連案件を整理するための検討画面です。
                    </p>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200/78">
                        この画面は完成仕様ではなく、業務構造を共有する場所です。保存、API通信、帳票生成、正式な状態遷移は実装しません。
                    </p>
                </div>

                <div className="grid gap-3 text-sm text-slate-100 sm:grid-cols-3 lg:grid-cols-1">
                    <HeroFact icon={ClipboardList} title="親" detail="案件" tone="cyan" />
                    <HeroFact icon={ListChecks} title="本筋" detail="工程" tone="emerald" />
                    <HeroFact icon={Package} title="管理単位" detail="カード" tone="amber" />
                </div>
            </div>
        </header>
    );
}

function PremisePanel() {
    return (
        <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {premiseItems.map((item) => (
                    <ConceptCard key={item.title} item={item} />
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.58fr)]">
                <section className="min-w-0 border border-white/14 bg-white/7 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <RotateCcw className="h-5 w-5 text-rose-100" aria-hidden />
                        主線から外す旧表現
                    </h3>
                    <div className="mt-4 grid gap-3">
                        {oldMainLineReplacements.map((item) => (
                            <div key={item.before} className="grid gap-2 border-l-2 border-rose-200/42 bg-rose-200/8 p-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                                <p className="text-sm font-semibold text-rose-50">{item.before}</p>
                                <p className="text-sm leading-6 text-slate-200/82">{item.after}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="min-w-0 border border-emerald-200/24 bg-emerald-200/8 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <CheckCircle2 className="h-5 w-5 text-emerald-100" aria-hidden />
                        判断の軸
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-100/84">
                        <li>案件ごとに必要な工程だけを有効化する。</li>
                        <li>対象外と SKIP は別概念として理由と履歴を分ける。</li>
                        <li>金額・数量は数値と表示を分離する。</li>
                        <li>完了後の大きな対応は関連案件として立ち上げる。</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

function StructurePanel() {
    return (
        <div className="grid gap-5">
            <section className="grid gap-4 lg:grid-cols-[minmax(220px,0.42fr)_minmax(0,1fr)]">
                <div className="border border-cyan-200/32 bg-cyan-200/10 p-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-100 text-slate-950">
                            <ClipboardList className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/78">Center</p>
                            <h3 className="text-2xl font-semibold text-white">案件</h3>
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-100/82">
                        案件は、業務上の親です。工程、カード、写真・証跡、帳票、履歴、関連案件は案件を説明・管理するために紐づきます。
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {structureNodes.map((node) => (
                        <ConceptCard key={node.title} item={node} />
                    ))}
                </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
                <RelationStrip title="工程 → カード" detail="工程は確認カテゴリ。カードは工程に紐づく管理対象。" tone="emerald" />
                <RelationStrip title="カード → 証跡" detail="写真、ファイル、メモはカードや工程の判断材料。" tone="sky" />
                <RelationStrip title="カード → 帳票" detail="商品、作業、調整の金額情報を帳票成果物へ集計。" tone="violet" />
            </section>
        </div>
    );
}

function PatternsPanel() {
    return (
        <div className="grid gap-4">
            <NoticeBlock
                icon={GitBranch}
                title="案件パターンはステータスではない"
                detail="案件作成時に、初期表示する工程とカードを決めるテンプレートとして扱います。作成後も案件ごとに工程追加、対象外、SKIP、順番調整ができます。"
                tone="cyan"
            />

            <div className="grid gap-4 lg:grid-cols-2">
                {casePatterns.map((pattern) => (
                    <article key={pattern.title} className="min-w-0 border border-white/14 bg-white/7 p-4">
                        <h3 className="text-lg font-semibold text-white">{pattern.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/80">{pattern.detail}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <ListGroup title="初期工程" items={pattern.processes} tone="emerald" />
                            <ListGroup title="初期カード" items={pattern.cards} tone="amber" />
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

function ProcessesPanel() {
    return (
        <div className="grid gap-5">
            <NoticeBlock
                icon={ListChecks}
                title="工程は案件ごとの確認カテゴリ"
                detail="工程マスタには候補を持ちますが、案件別工程では必要なものだけをONにします。例外工程は通常OFFにし、ONにした理由、日時、担当者を履歴へ残します。"
                tone="emerald"
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">
                <section className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">標準工程候補</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {standardProcesses.map((process) => (
                            <ProcessTile key={process.title} process={process} />
                        ))}
                    </div>
                </section>

                <section className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">例外工程候補</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {exceptionProcesses.map((process) => (
                            <ProcessTile key={process.title} process={process} />
                        ))}
                    </div>
                </section>
            </div>

            <section>
                <h3 className="text-lg font-semibold text-white">工程状態</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {processStatuses.map((status) => (
                        <StatusCard key={status.label} status={status} />
                    ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <NoticeBlock
                        icon={CheckCircle2}
                        title="対象外"
                        detail="その案件では最初から不要な工程。初期パターンや案件条件から外れていることを表します。"
                        tone="violet"
                    />
                    <NoticeBlock
                        icon={SkipForward}
                        title="SKIP"
                        detail="本来は必要だが、理由付きで飛ばした工程。操作者、日時、理由、関連カードを履歴に残します。"
                        tone="amber"
                    />
                </div>
            </section>
        </div>
    );
}

function CardTypesPanel() {
    return (
        <div className="grid gap-5">
            <NoticeBlock
                icon={Package}
                title="総称は「カード」"
                detail="カードは案件進行ステップではなく、工程に紐づく管理単位です。状態、メモ、添付、更新者、履歴を持ちます。"
                tone="amber"
            />

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {cardTypes.map((cardType) => {
                    const Icon = cardType.icon;
                    const tone = toneClasses[cardType.tone];

                    return (
                        <article key={cardType.title} className={`min-w-0 border p-4 ${tone.panel}`}>
                            <div className="flex items-start gap-3">
                                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${tone.icon}`}>
                                    <Icon className="h-5 w-5" aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-white">{cardType.title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-200/82">{cardType.role}</p>
                                </div>
                            </div>
                            <ListGroup title="共通項目候補" items={cardType.fields} tone={cardType.tone} className="mt-4" />
                            <p className="mt-3 text-sm leading-6 text-slate-100/76">{cardType.statusHint}</p>
                        </article>
                    );
                })}
            </div>

            <section className="border border-white/14 bg-white/7 p-4">
                <h3 className="text-lg font-semibold text-white">カード状態候補</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                    {cardStateCandidates.map((state) => (
                        <span key={state} className="inline-flex min-h-8 items-center rounded-lg border border-white/14 bg-white/8 px-3 text-sm font-semibold text-slate-100">
                            {state}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
}

function SamplesPanel() {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {sampleCards.map((sample) => (
                <SampleCardArticle key={`${sample.cardType}-${sample.title}`} sample={sample} />
            ))}
        </div>
    );
}

function EvidencePanel() {
    return (
        <div className="grid gap-5">
            <NoticeBlock
                icon={Camera}
                title="写真・証跡は独立工程ではない"
                detail="着工前は工事前、作業中は工事中、完了は工事後、検収確認は完了後の確認として扱います。証跡は工程またはカードへ紐づけます。"
                tone="sky"
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {evidenceCategories.map((category) => (
                    <RelationStrip key={category.title} title={category.title} detail={category.detail} tone={category.tone} />
                ))}
            </div>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                <div className="border border-sky-200/24 bg-sky-200/8 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Camera className="h-5 w-5 text-sky-100" aria-hidden />
                        作業カードの連続撮影入口
                    </h3>
                    <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-100/82">
                        <li>撮影分類を選ぶ: 着工前 / 作業中 / 完了後 / 検収用</li>
                        <li>撮るたびにキューへ入り、メモを後から補足できる。</li>
                        <li>保存先やファイル名の決定は将来のLaravel側責務にする。</li>
                    </ol>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <NoticeBlock icon={Package} title="商品カード" detail="写真は基本不要。商品情報、ファイル、メモを重視する。" tone="amber" />
                    <NoticeBlock icon={Wrench} title="作業カード" detail="写真が重要。連続撮影、メモ、添付ファイルを持てる。" tone="emerald" />
                    <NoticeBlock icon={CircleDollarSign} title="調整カード" detail="金額、理由、承認、メモ、ファイルを重視し、写真は任意。" tone="rose" />
                    <NoticeBlock icon={AlertTriangle} title="例外対応カード" detail="写真、ファイル、メモ、理由、対応内容を持ち、証跡を重視する。" tone="amber" />
                </div>
            </section>
        </div>
    );
}

function MoneyPanel() {
    const rawAmount = {
        quantity: 2,
        unit: '台',
        unitPrice: 128000,
        taxRate: 10,
        amount: 256000,
    };

    return (
        <div className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                <section className="border border-cyan-200/24 bg-cyan-200/8 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <CircleDollarSign className="h-5 w-5 text-cyan-100" aria-hidden />
                        保存値
                    </h3>
                    <dl className="mt-4 grid gap-2 text-sm">
                        <DataRow label="quantity" value={String(rawAmount.quantity)} />
                        <DataRow label="unit" value={rawAmount.unit} />
                        <DataRow label="unitPrice" value={String(rawAmount.unitPrice)} />
                        <DataRow label="taxRate" value={String(rawAmount.taxRate)} />
                        <DataRow label="amount" value={String(rawAmount.amount)} />
                    </dl>
                </section>

                <section className="border border-emerald-200/24 bg-emerald-200/8 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <BadgeCheck className="h-5 w-5 text-emerald-100" aria-hidden />
                        表示例
                    </h3>
                    <dl className="mt-4 grid gap-2 text-sm">
                        <DataRow label="数量" value={formatQuantity(rawAmount.quantity, rawAmount.unit)} />
                        <DataRow label="単価" value={formatYen(rawAmount.unitPrice)} />
                        <DataRow label="税率" value={`${rawAmount.taxRate}%`} />
                        <DataRow label="小計" value={formatYen(rawAmount.amount)} />
                    </dl>
                </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <ListGroup title="商品カード単位候補" items={productUnits} tone="amber" />
                <ListGroup title="作業カード単位候補" items={workUnits} tone="emerald" />
                <NoticeBlock
                    icon={CircleDollarSign}
                    title="調整カード"
                    detail="数量を持たない場合が多い。無償作業など数量・単位が必要なものは作業カードと請求対象外フラグで扱う。"
                    tone="rose"
                />
            </div>

            <NoticeBlock
                icon={CheckCircle2}
                title="データと表示の分離"
                detail="DB / DTO / Service / 計算処理では数値だけを持ち、円、カンマ、税込表示、赤文字、マイナス表示は React Component / Responder / 表示Utility 側で付けます。"
                tone="cyan"
            />
        </div>
    );
}

function DocumentsPanel() {
    return (
        <div className="grid gap-5">
            <NoticeBlock
                icon={FileText}
                title="帳票は成果物"
                detail="見積書、請求書、領収書の役割を分け、商品カード、作業カード、調整カードなどの金額情報を集計して作る成果物として表現します。"
                tone="violet"
            />

            <div className="grid gap-4 lg:grid-cols-3">
                {documents.map((document) => {
                    const Icon = document.icon;
                    const tone = toneClasses[document.tone];

                    return (
                        <article key={document.title} className={`min-w-0 border p-4 ${tone.panel}`}>
                            <div className="flex items-start gap-3">
                                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${tone.icon}`}>
                                    <Icon className="h-5 w-5" aria-hidden />
                                </span>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{document.title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-200/82">{document.role}</p>
                                </div>
                            </div>
                            <ListGroup title="集計元" items={document.sources} tone={document.tone} className="mt-4" />
                            <ListGroup title="状態候補" items={document.statuses} tone="slate" className="mt-4" />
                        </article>
                    );
                })}
            </div>

            <section className="border border-white/14 bg-white/7 p-4">
                <h3 className="text-lg font-semibold text-white">請求書の集計イメージ</h3>
                <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <DataRow label="対象" value="給湯器本体 / 給湯器交換作業 / 端数値引き" />
                    <DataRow label="小計" value={formatYen(173000)} />
                    <DataRow label="調整" value={formatYen(-3000)} valueClassName="text-rose-100" />
                    <DataRow label="税額" value={formatYen(17000)} />
                    <DataRow label="合計" value={formatYen(187000)} />
                    <DataRow label="状態" value="確認待ち" />
                </dl>
            </section>
        </div>
    );
}

function RelatedCasesPanel() {
    return (
        <div className="grid gap-5">
            <NoticeBlock
                icon={Link2}
                title="完了済み案件を無理に再オープンしない"
                detail="軽微な補足は元案件の履歴・証跡追加で済ませ、大きな対応は元案件に紐づく関連案件として立ち上げます。"
                tone="rose"
            />

            <div className="grid gap-4 lg:grid-cols-2">
                <ListGroup title="元案件内で済ませるもの" items={originalCaseOnlyItems} tone="cyan" />
                <ListGroup title="関連案件として立てるもの" items={relatedCaseItems} tone="rose" />
            </div>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                <div className="border border-cyan-200/24 bg-cyan-200/8 p-4">
                    <h3 className="text-lg font-semibold text-white">元案件</h3>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-100/82">
                        <li>通常工程</li>
                        <li>カード</li>
                        <li>帳票</li>
                        <li>履歴</li>
                        <li>関連案件へのリンク</li>
                    </ul>
                </div>
                <div className="border border-rose-200/24 bg-rose-200/8 p-4">
                    <h3 className="text-lg font-semibold text-white">関連案件に持たせる関係</h3>
                    <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                        <DataRow label="元案件" value="#CO-20260616-001" />
                        <DataRow label="関連案件" value="#CO-20260617-003" />
                        <DataRow label="関連種別" value="工事後対応" />
                        <DataRow label="発生理由" value="完了後に再訪問が必要" />
                        <DataRow label="対応状態" value="対応中" />
                    </dl>
                </div>
            </section>

            <ListGroup title="関連種別候補" items={relatedCaseTypes} tone="violet" />
        </div>
    );
}

function HistoryPanel() {
    const historyFields = ['操作内容', '操作者', '日時', '理由', '関連する工程', '関連するカード', '関連案件'];
    const historyCandidates = [
        '案件作成',
        '案件パターン選択',
        '工程追加',
        '工程対象外設定',
        '工程SKIP',
        '工程完了',
        'カード作成',
        'カード完了',
        'カード差戻し',
        '写真追加',
        '証跡追加',
        'ファイル追加',
        'メモ追加',
        '見積書作成',
        '請求書作成',
        '領収書作成',
        '入金確認',
        '関連案件作成',
        '完了確認',
    ];

    return (
        <div className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                <ListGroup title="履歴に表示したい項目" items={historyFields} tone="cyan" />
                <ListGroup title="履歴候補" items={historyCandidates} tone="slate" />
            </div>

            <div className="grid gap-3">
                {historyEvents.map((event) => (
                    <HistoryEventRow key={`${event.time}-${event.title}`} event={event} />
                ))}
            </div>
        </div>
    );
}

function SampleCardArticle({ sample }: { sample: SampleCard }) {
    const tone = toneClasses[sample.tone];

    return (
        <article className={`min-w-0 border p-4 ${tone.panel}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone.text}`}>{sample.cardType}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{sample.title}</h3>
                    <p className="mt-1 text-sm text-slate-200/76">紐づく工程: {sample.linkedProcess}</p>
                </div>
                <span className={`inline-flex min-h-8 w-fit items-center rounded-lg border px-3 text-sm font-semibold ${tone.border} ${tone.soft}`}>
                    {sample.state}
                </span>
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
                {typeof sample.quantity === 'number' && sample.unit ? (
                    <DataRow label="数量 / 単位" value={formatQuantity(sample.quantity, sample.unit)} />
                ) : null}
                {typeof sample.unitPrice === 'number' ? (
                    <DataRow label="単価" value={formatYen(sample.unitPrice)} />
                ) : null}
                {typeof sample.taxRate === 'number' ? (
                    <DataRow label="税率" value={`${sample.taxRate}%`} />
                ) : null}
                {typeof sample.amount === 'number' ? (
                    <DataRow label="小計" value={formatYen(sample.amount)} />
                ) : null}
                {typeof sample.adjustmentAmount === 'number' ? (
                    <DataRow
                        label="調整金額"
                        value={formatYen(sample.adjustmentAmount)}
                        valueClassName={sample.adjustmentAmount < 0 ? 'text-rose-100' : undefined}
                    />
                ) : null}
                {sample.textRows.map((row) => (
                    <DataRow
                        key={`${sample.title}-${row.label}`}
                        label={row.label}
                        value={row.value}
                        valueClassName={row.value.startsWith('-') ? 'text-rose-100' : undefined}
                    />
                ))}
            </dl>

            {sample.photoGroups ? (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-white">写真</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {sample.photoGroups.map((photoGroup) => (
                            <span key={photoGroup} className="inline-flex min-h-8 items-center rounded-lg border border-white/14 bg-white/8 px-3 text-sm text-slate-100">
                                {photoGroup}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="mt-4">
                <p className="text-sm font-semibold text-white">添付</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {sample.attachments.map((attachment) => (
                        <span key={attachment} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/14 bg-white/8 px-3 text-sm text-slate-100">
                            <FileText className="h-3.5 w-3.5" aria-hidden />
                            {attachment}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
}

function HeroFact({ icon: Icon, title, detail, tone }: { icon: LucideIcon; title: string; detail: string; tone: Tone }) {
    const styles = toneClasses[tone];

    return (
        <div className={`flex items-center gap-3 border p-3 ${styles.panel}`}>
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${styles.icon}`}>
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
                <p className="text-xs font-semibold text-slate-200/72">{title}</p>
                <p className="text-lg font-semibold text-white">{detail}</p>
            </div>
        </div>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
    icon: Icon,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: LucideIcon;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/10 text-cyan-100">
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/78">{eyebrow}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">{description}</p>
            </div>
        </div>
    );
}

function ConceptCard({ item }: { item: ConceptItem }) {
    const Icon = item.icon;
    const styles = toneClasses[item.tone];

    return (
        <article className={`min-w-0 border p-4 ${styles.panel}`}>
            <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${styles.icon}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200/80">{item.detail}</p>
                </div>
            </div>
        </article>
    );
}

function NoticeBlock({
    icon: Icon,
    title,
    detail,
    tone,
}: {
    icon: LucideIcon;
    title: string;
    detail: string;
    tone: Tone;
}) {
    const styles = toneClasses[tone];

    return (
        <section className={`min-w-0 border p-4 ${styles.panel}`}>
            <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${styles.icon}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-200/82">{detail}</p>
                </div>
            </div>
        </section>
    );
}

function RelationStrip({ title, detail, tone }: { title: string; detail: string; tone: Tone }) {
    const styles = toneClasses[tone];

    return (
        <article className={`min-w-0 border p-4 ${styles.panel}`}>
            <h3 className={`text-base font-semibold ${styles.text}`}>{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-200/80">{detail}</p>
        </article>
    );
}

function ProcessTile({ process }: { process: ProcessCandidate }) {
    const styles = toneClasses[process.tone];

    return (
        <article className={`min-w-0 border p-3 ${styles.panel}`}>
            <h4 className="text-sm font-semibold text-white">{process.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-200/76">{process.detail}</p>
        </article>
    );
}

function StatusCard({ status }: { status: StatusDefinition }) {
    const styles = toneClasses[status.tone];

    return (
        <article className={`min-w-0 border p-4 ${styles.panel}`}>
            <h4 className="text-base font-semibold text-white">{status.label}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-200/80">{status.detail}</p>
        </article>
    );
}

function ListGroup({
    title,
    items,
    tone,
    className = '',
}: {
    title: string;
    items: string[];
    tone: Tone;
    className?: string;
}) {
    const styles = toneClasses[tone];

    return (
        <section className={`min-w-0 border p-4 ${styles.panel} ${className}`}>
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            <ul className="mt-3 grid gap-2">
                {items.map((item) => (
                    <li key={item} className="flex min-w-0 items-start gap-2 text-sm leading-6 text-slate-100/82">
                        <span className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${styles.soft}`} aria-hidden />
                        <span className="min-w-0">{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function DataRow({
    label,
    value,
    valueClassName = 'text-white',
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="grid min-w-0 gap-1 border border-white/10 bg-black/12 p-3 sm:grid-cols-[130px_minmax(0,1fr)]">
            <dt className="text-xs font-semibold text-slate-300/76">{label}</dt>
            <dd className={`min-w-0 break-words font-semibold ${valueClassName}`}>{value}</dd>
        </div>
    );
}

function HistoryEventRow({ event }: { event: HistoryEvent }) {
    const styles = toneClasses[event.tone];

    return (
        <article className={`grid min-w-0 gap-3 border p-4 md:grid-cols-[180px_minmax(0,1fr)] ${styles.panel}`}>
            <div>
                <p className={`text-sm font-semibold ${styles.text}`}>{event.title}</p>
                <p className="mt-1 text-xs text-slate-300/78">{event.time}</p>
            </div>
            <dl className="grid gap-2 text-sm md:grid-cols-3">
                <DataRow label="操作者" value={event.actor} />
                <DataRow label="理由" value={event.reason} />
                <DataRow label="関連" value={event.related} />
            </dl>
        </article>
    );
}
