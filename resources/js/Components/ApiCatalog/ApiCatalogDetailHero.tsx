/**
 * API Catalog 詳細画面の hero 表示 Component です。
 *
 * API名、provider、service、version の表示に限定し、外部 OpenAPI 定義の取得や解析は行いません。
 */
import { motion } from 'motion/react';

type ApiCatalogDetailHeroProps = {
    title: string;
    providerKey: string;
    serviceKey: string | null;
    domain?: string | null;
    preferredVersion: string | null;
};

function displayValue(value: string | null | undefined) {
    return value && value.trim() !== '' ? value : 'n/a';
}

export default function ApiCatalogDetailHero({
    title,
    providerKey,
    serviceKey,
    domain = null,
    preferredVersion,
}: ApiCatalogDetailHeroProps) {
    /*
     * 詳細画面のファーストビューを本番/モックで揃えます。
     * モックだけが持つ domain は追加の入力データとして受け取り、レイアウトや装飾は共通のままにします。
     */
    const subtitleParts = [providerKey, displayValue(serviceKey), domain].filter(
        (value): value is string => value !== null && value !== undefined && value.trim() !== '',
    );

    return (
        /*
            motion の演出も詳細表示の一部なので、ページ側に重複させずここへ閉じ込めます。
            本番/モックの差は props の値だけにし、DOM構造とclassNameは同じものを使います。
        */
        <motion.section
            className="rounded-2xl border border-white/35 bg-slate-950/36 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_22px_48px_rgba(2,24,45,0.24)] backdrop-blur-2xl sm:p-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/72">
                API Discovery Hub
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-3xl font-semibold text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.34)] sm:text-5xl">
                        {title}
                    </h1>
                    <p className="mt-3 break-all text-sm font-semibold text-cyan-100/78">
                        {subtitleParts.join(' / ')}
                    </p>
                </div>

                <span className="w-fit rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1.5 text-xs font-semibold text-cyan-50">
                    {displayValue(preferredVersion)}
                </span>
            </div>
        </motion.section>
    );
}
