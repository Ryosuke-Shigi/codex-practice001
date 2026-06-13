/**
 * DanceShortsRadar 表示カードの empty 状態 Component です。
 *
 * 取得結果0件の message 表示だけを扱い、loading 中やエラー状態とは別にします。
 */
type EmptyDisplayCardFieldProps = {
    message: string;
};

/*
 * 表示カードフィールドで使う空状態です。
 *
 * 通常ランキングと上昇候補の空表示は同じ外枠にそろえ、どのカード種別でも
 * 呼び出し側が決めた emptyMessage をそのまま表示します。
 */
export default function EmptyDisplayCardField({
    message,
}: EmptyDisplayCardFieldProps) {
    return (
        <section className="rounded-lg border border-slate-700/[0.08] bg-white/[0.015] p-4 text-slate-800 shadow-[0_14px_28px_rgba(80,105,140,0.04)] backdrop-blur-[3px]">
            <p className="text-sm font-semibold text-slate-600">{message}</p>
        </section>
    );
}
