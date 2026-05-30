export type DesignPhilosophySection = {
    /*
     * Laravel の DesignPhilosophySectionDTO::toArray() と対応する props です。
     * LP本文は config から渡されるため、この型は「受け取る形」だけを定義し、
     * React 側に固定本文配列を増やさないようにします。
     */
    key: string;
    sortOrder: number;
    title: string;
    lead: string;
    body: string;
    proofLabel: string;
    proofText: string;
};

type DesignPhilosophySectionTemplateProps = {
    section: DesignPhilosophySection;
};

export default function DesignPhilosophySectionTemplate({
    section,
}: DesignPhilosophySectionTemplateProps) {
    return (
        <section className="flex min-h-[100svh] min-w-0 items-center justify-center px-5 py-16 sm:px-8">
            <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-end">
                <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {/*
                        1画面1メッセージにするため、セクション番号や画像枠は置かず、
                        title / lead / body の読み順だけで見せます。
                        min-w-0 と overflow-wrap は、長い日本語や英語キーワードが
                        スマホ幅で横にはみ出すのを防ぐための保険です。
                    */}
                    <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white drop-shadow-[0_16px_34px_rgba(0,0,0,0.28)] sm:text-6xl lg:text-7xl">
                        {section.title}
                    </h2>
                    <p className="mt-7 max-w-3xl text-2xl font-semibold leading-relaxed text-cyan-50 sm:text-3xl">
                        {section.lead}
                    </p>
                    <p className="mt-8 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                        {section.body}
                    </p>
                </div>

                <aside className="min-w-0 rounded-lg border border-white/18 bg-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
                    {/*
                        proof は本文を補足する小さな根拠カードです。
                        セクションごとの専用 Component は作らず、同じテンプレートへ
                        config の文言だけを差し替える構成にしています。
                    */}
                    <p className="text-sm font-semibold text-cyan-100">
                        {section.proofLabel}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-white/76">
                        {section.proofText}
                    </p>
                </aside>
            </div>
        </section>
    );
}
