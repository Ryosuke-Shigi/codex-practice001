/*
 * cardField のwindow切り替え中にだけ表示するLoading枠です。
 * emptyMessage は取得結果0件用、LoadingはReact側の取得中UIとして分けます。
 */
export default function LoadingDisplayCardField() {
    return (
        <section className="grid min-h-[14rem] place-items-center rounded-lg border border-white/22 bg-slate-950/44 p-4 text-white shadow-[0_14px_28px_rgba(2,24,45,0.16)] backdrop-blur-xl">
            <div className="grid justify-items-center gap-2">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-100/20 border-t-cyan-200" />
                <p className="text-sm font-semibold text-cyan-50/78">
                    カードを読み込んでいます
                </p>
            </div>
        </section>
    );
}
