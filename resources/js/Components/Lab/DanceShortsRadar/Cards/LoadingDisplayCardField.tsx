/*
 * cardField のwindow切り替え中にだけ表示するLoading枠です。
 * emptyMessage は取得結果0件用、LoadingはReact側の取得中UIとして分けます。
 */
export default function LoadingDisplayCardField() {
    return (
        <section className="grid min-h-[30rem] place-items-center rounded-lg border border-white/22 bg-slate-950/44 p-6 text-white shadow-[0_18px_36px_rgba(2,24,45,0.18)] backdrop-blur-xl">
            <div className="grid justify-items-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-100/20 border-t-cyan-200" />
                <p className="text-sm font-semibold text-cyan-50/78">
                    カードを読み込んでいます
                </p>
            </div>
        </section>
    );
}
