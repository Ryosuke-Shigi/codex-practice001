/**
 * 工事発注管理システム IDEA BOARD の構想整理 Component です。
 */
import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    ArrowRight,
    Camera,
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    FileText,
    Layers,
    Link2,
    ListChecks,
    Package,
    Wrench,
} from 'lucide-react';

type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'slate';

type FlowStep = {
    title: string;
    detail: string;
    icon: LucideIcon;
    tone: Tone;
};

type IdeaCard = {
    title: string;
    detail: string;
    icon: LucideIcon;
    tone: Tone;
};

const toneClasses: Record<Tone, { panel: string; icon: string }> = {
    amber: {
        panel: 'border-amber-200/28 bg-amber-300/10',
        icon: 'bg-amber-200/16 text-amber-100',
    },
    cyan: {
        panel: 'border-cyan-200/28 bg-cyan-300/10',
        icon: 'bg-cyan-200/16 text-cyan-100',
    },
    emerald: {
        panel: 'border-emerald-200/28 bg-emerald-300/10',
        icon: 'bg-emerald-200/16 text-emerald-100',
    },
    rose: {
        panel: 'border-rose-200/28 bg-rose-300/10',
        icon: 'bg-rose-200/16 text-rose-100',
    },
    sky: {
        panel: 'border-sky-200/28 bg-sky-300/10',
        icon: 'bg-sky-200/16 text-sky-100',
    },
    slate: {
        panel: 'border-white/14 bg-white/7',
        icon: 'bg-white/12 text-slate-100',
    },
    violet: {
        panel: 'border-violet-200/28 bg-violet-300/10',
        icon: 'bg-violet-200/16 text-violet-100',
    },
};

const inputFlowSteps: FlowStep[] = [
    {
        title: 'FORM入力',
        detail: '最初の内容を画面で入力する入口。',
        icon: ClipboardList,
        tone: 'cyan',
    },
    {
        title: 'CSV出力',
        detail: '入力した内容をCSVとして出力する。',
        icon: FileText,
        tone: 'emerald',
    },
    {
        title: 'CSV取込',
        detail: 'CSVを取り込み、案件管理につなげる。',
        icon: Layers,
        tone: 'amber',
    },
    {
        title: '案件管理へ',
        detail: '取り込んだ内容を案件の中で整理する。',
        icon: ListChecks,
        tone: 'violet',
    },
];

const caseTypes = ['通常工事', 'クレーム対応', '工事後対応', '追加作業'];

const cardTypes: IdeaCard[] = [
    {
        title: '商品カード',
        detail: '商品や材料を、案件内のカードとして扱う。',
        icon: Package,
        tone: 'amber',
    },
    {
        title: '作業カード',
        detail: '現場で行う作業を、案件内のカードとして扱う。',
        icon: Wrench,
        tone: 'emerald',
    },
    {
        title: '調整カード',
        detail: '案件全体、商品、作業に関係する調整を抽象的に扱う。',
        icon: CircleDollarSign,
        tone: 'rose',
    },
    {
        title: '例外対応カード',
        detail: '案件全体、商品、作業に関係する例外対応を抽象的に扱う。',
        icon: AlertTriangle,
        tone: 'sky',
    },
];

const documentCards: IdeaCard[] = [
    {
        title: '見積',
        detail: '見積は、使うカードを選んで出力する。',
        icon: FileText,
        tone: 'cyan',
    },
    {
        title: '請求',
        detail: '請求は、使うカードを選んで出力する。',
        icon: FileText,
        tone: 'emerald',
    },
    {
        title: '領収',
        detail: '領収は、使うカードを選んで出力する。',
        icon: FileText,
        tone: 'amber',
    },
];

const overallFlow = [
    'FORM → CSV出力 → CSV取込 → 案件管理',
    '案件管理の中で 案件 → 工程 → カード',
    '書類はカードを選択して出力',
    '現場アクセスは独立した別入口',
];

export default function ConstructionOrderIdeaBoardTabs() {
    return (
        <article className="min-w-0 overflow-hidden border border-white/14 bg-zinc-950/72 text-slate-100 shadow-2xl shadow-black/30">
            <header className="border-b border-white/12 bg-white/7 px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] lg:items-end">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-cyan-100">IDEA BOARD</p>
                        <h1 className="mt-3 text-3xl font-semibold text-white">
                            工事発注管理システム IDEA BOARD
                        </h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200/86">
                            案件を中心に、工程とカードで管理する。
                        </p>
                        <p className="mt-2 max-w-3xl text-base leading-7 text-slate-200/86">
                            見積 / 請求 / 領収は、使うカードを選んで出力する。
                        </p>
                    </div>

                    <div className="grid gap-2 border border-cyan-200/24 bg-cyan-300/10 p-4">
                        <p className="text-sm font-semibold text-cyan-100">中心概念</p>
                        <p className="text-xl font-semibold text-white">案件が親</p>
                        <p className="text-sm leading-6 text-slate-200/84">
                            工程はカードを管理する箱。カードは案件内の主力管理単位。
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid gap-0">
                <section className="border-b border-white/12 px-4 py-6 sm:px-6 lg:px-8">
                    <SectionHeading
                        icon={ClipboardList}
                        title="入力から案件管理への流れ"
                        description="FORMで入力した内容をCSVとして出力し、そのCSVを取り込んで案件管理へつなげる。"
                    />
                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                        {inputFlowSteps.map((step, index) => (
                            <FlowStepCard
                                key={step.title}
                                step={step}
                                showArrow={index < inputFlowSteps.length - 1}
                            />
                        ))}
                    </div>
                </section>

                <section className="border-b border-white/12 px-4 py-6 sm:px-6 lg:px-8">
                    <SectionHeading
                        icon={ListChecks}
                        title="案件・工程・カードの構造"
                        description="案件を親にして、案件の中に工程を置き、工程の中でカードを整理する。"
                    />

                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
                        <div className="grid gap-4">
                            <div className="border border-cyan-200/24 bg-cyan-300/10 p-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <IconBox icon={ClipboardList} tone="cyan" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-semibold text-white">案件が親</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-200/82">
                                            案件種類の例として、通常工事 / クレーム対応 / 工事後対応 / 追加作業を扱える考え方にする。
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {caseTypes.map((caseType) => (
                                        <span
                                            key={caseType}
                                            className="inline-flex min-h-8 items-center rounded-md border border-cyan-200/26 bg-cyan-200/10 px-3 text-sm font-semibold text-cyan-50"
                                        >
                                            {caseType}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="border border-emerald-200/24 bg-emerald-300/10 p-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <IconBox icon={Layers} tone="emerald" />
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-semibold text-white">工程</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-200/82">
                                            工程はカードを管理する箱。案件の中身を整理し、必要なカードを見つけやすくする。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="border border-white/14 bg-white/7 p-4">
                                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                                    <Package className="h-5 w-5 text-amber-100" aria-hidden />
                                    カードは案件内の主力管理単位
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-200/82">
                                    カードが持つ情報は、内容 / 金額 / 写真 / ファイル / 完了状態 / メモとして抽象的に見る。
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {cardTypes.map((card) => (
                                    <IdeaCardBlock key={card.title} card={card} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-white/12 px-4 py-6 sm:px-6 lg:px-8">
                    <SectionHeading
                        icon={FileText}
                        title="書類とのつながり"
                        description="書類はカードの情報を使う。見積、請求、領収はそれぞれ必要なカードを選んで出力する。"
                    />
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        {documentCards.map((card) => (
                            <IdeaCardBlock key={card.title} card={card} />
                        ))}
                    </div>
                </section>

                <section className="border-b border-white/12 px-4 py-6 sm:px-6 lg:px-8">
                    <SectionHeading
                        icon={Camera}
                        title="現場アクセス"
                        description="現場アクセスは、案件管理や書類出力の後工程ではなく、独立した入口として扱う。"
                    />
                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
                        <div className="border border-sky-200/24 bg-sky-300/10 p-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <IconBox icon={Link2} tone="sky" />
                                <div className="min-w-0">
                                    <h3 className="text-xl font-semibold text-white">現場アクセスは別入口</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-200/82">
                                        案件 / 工程 / カードの確認や写真利用につながる入口として分けて見る。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border border-white/14 bg-white/7 p-4">
                            <h3 className="text-xl font-semibold text-white">書類とは並列に扱う</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-200/82">
                                案件管理から、書類と現場アクセスへ分かれる。書類から現場アクセスへつなげる流れにはしない。
                            </p>
                        </div>
                    </div>
                </section>

                <section className="px-4 py-6 sm:px-6 lg:px-8">
                    <SectionHeading
                        icon={CheckCircle2}
                        title="全体イメージ"
                        description="入力、案件管理、書類、現場アクセスを、それぞれの入口と役割で整理する。"
                    />
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {overallFlow.map((item) => (
                            <div key={item} className="flex min-w-0 items-start gap-3 border border-white/14 bg-white/7 p-4">
                                <span className="mt-1 h-2 w-2 flex-none rounded-md bg-emerald-200" aria-hidden />
                                <p className="min-w-0 text-sm font-semibold leading-6 text-slate-100">{item}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </article>
    );
}

function SectionHeading({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-md bg-white/10 text-cyan-100">
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
                <h2 className="text-2xl font-semibold text-white">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">{description}</p>
            </div>
        </div>
    );
}

function FlowStepCard({ step, showArrow }: { step: FlowStep; showArrow: boolean }) {
    const styles = toneClasses[step.tone];
    const Icon = step.icon;

    return (
        <article className={`relative min-w-0 border p-4 ${styles.panel}`}>
            <div className="flex min-w-0 items-start gap-3">
                <IconBox icon={Icon} tone={step.tone} />
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200/80">{step.detail}</p>
                </div>
            </div>
            {showArrow ? (
                <ArrowRight
                    className="absolute right-3 top-3 hidden h-5 w-5 text-slate-200/50 md:block"
                    aria-hidden
                />
            ) : null}
        </article>
    );
}

function IdeaCardBlock({ card }: { card: IdeaCard }) {
    const styles = toneClasses[card.tone];
    const Icon = card.icon;

    return (
        <article className={`min-w-0 border p-4 ${styles.panel}`}>
            <div className="flex min-w-0 items-start gap-3">
                <IconBox icon={Icon} tone={card.tone} />
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200/80">{card.detail}</p>
                </div>
            </div>
        </article>
    );
}

function IconBox({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
    const styles = toneClasses[tone];

    return (
        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-md ${styles.icon}`}>
            <Icon className="h-5 w-5" aria-hidden />
        </span>
    );
}
