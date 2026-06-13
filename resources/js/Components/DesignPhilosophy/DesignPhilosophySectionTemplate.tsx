/**
 * Design Philosophy セクションを表示する template Component です。
 *
 * DTO 由来 props の表示だけを担当し、section の有効判定や並び順は backend 側へ分けます。
 */
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
        <section className="design-philosophy-section flex min-h-[100svh] min-w-0 items-center justify-center px-5 py-16 sm:px-8 [@media(orientation:landscape)_and_(max-height:520px)]:min-h-[auto] [@media(orientation:landscape)_and_(max-height:520px)]:py-10">
            <div className="mx-auto grid w-[calc(100vw-2.5rem)] max-w-6xl min-w-0 gap-10 sm:w-full [@media(orientation:landscape)_and_(max-height:520px)]:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-end">
                <div className="min-w-0 break-words [overflow-wrap:anywhere]">
                    {/*
                        1画面1メッセージにするため、セクション番号や画像枠は置かず、
                        title / lead / body の読み順だけで見せます。
                        min-w-0 と overflow-wrap は、長い日本語や英語キーワードが
                        スマホ幅で横にはみ出すのを防ぐための保険です。
                        ただし title は大きく見せる要素なので、横向きの低い viewport では
                        文字サイズと余白を落とし、1画面固定より読みやすい縦スクロールを優先します。
                    */}
                    <h2 className="design-philosophy-title max-w-4xl text-balance text-[clamp(2.25rem,10vw,3.5rem)] font-semibold leading-[1.12] text-white drop-shadow-[0_16px_34px_rgba(0,0,0,0.28)] [overflow-wrap:normal] [word-break:normal] sm:text-[clamp(3rem,8vw,5rem)] lg:text-7xl [@media(orientation:landscape)_and_(max-height:520px)]:text-[clamp(2rem,6vw,3.25rem)] [@media(orientation:landscape)_and_(max-height:520px)]:leading-[1.15]">
                        {section.title}
                    </h2>
                    <p className="mt-7 w-full max-w-[22rem] break-words text-2xl font-semibold leading-relaxed text-cyan-50 [overflow-wrap:anywhere] sm:max-w-3xl sm:text-3xl [@media(orientation:landscape)_and_(max-height:520px)]:mt-4 [@media(orientation:landscape)_and_(max-height:520px)]:text-xl">
                        {section.lead}
                    </p>
                    <p className="mt-8 w-full max-w-[22rem] break-words text-base leading-8 text-white/78 [overflow-wrap:anywhere] sm:max-w-2xl sm:text-lg [@media(orientation:landscape)_and_(max-height:520px)]:mt-4 [@media(orientation:landscape)_and_(max-height:520px)]:leading-7">
                        {section.body}
                    </p>
                </div>

                <aside className="w-full max-w-[22rem] min-w-0 rounded-lg border border-white/18 bg-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl [overflow-wrap:anywhere] sm:max-w-none sm:p-6 [@media(orientation:landscape)_and_(max-height:520px)]:p-4">
                    {/*
                        proof は本文を補足する小さな根拠カードです。
                        セクションごとの専用 Component は作らず、同じテンプレートへ
                        config の文言だけを差し替える構成にしています。
                    */}
                    <p className="text-sm font-semibold text-cyan-100">
                        {section.proofLabel}
                    </p>
                    <p className="mt-4 w-full break-words text-sm leading-7 text-white/76 [overflow-wrap:anywhere]">
                        {section.proofText}
                    </p>
                </aside>
            </div>
        </section>
    );
}
