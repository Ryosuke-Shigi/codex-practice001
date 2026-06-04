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
        <section className="rounded-lg border border-white/18 bg-slate-950/36 p-4 text-white shadow-[0_14px_28px_rgba(4,25,42,0.12)] backdrop-blur-xl">
            <p className="text-sm font-semibold text-cyan-50/78">{message}</p>
        </section>
    );
}
