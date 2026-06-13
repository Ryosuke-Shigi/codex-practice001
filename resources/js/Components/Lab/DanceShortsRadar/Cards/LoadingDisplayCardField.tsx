/**
 * cardField のwindow切り替え中にだけ表示するLoading枠です。
 * emptyMessage は取得結果0件用、LoadingはReact側の取得中UIとして分けます。
 */
export default function LoadingDisplayCardField() {
    return (
        <section className="grid min-h-[14rem] place-items-center rounded-lg border border-slate-700/10 bg-white/[0.08] p-4 text-slate-800 shadow-[0_14px_28px_rgba(80,105,140,0.1)] backdrop-blur-xl">
            <div className="grid justify-items-center gap-2">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-sky-700/[0.12] border-t-sky-500" />
                <p className="text-sm font-semibold text-slate-700">
                    カードを読み込んでいます
                </p>
            </div>
        </section>
    );
}
