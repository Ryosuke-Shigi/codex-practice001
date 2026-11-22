import type { ApiCatalogSyncStatus } from '@/Pages/ApiCatalog/types';

type Props = { message: string | null; status: ApiCatalogSyncStatus | null; showResult: boolean };

/** 取り込み状態の表示だけを担当します。内訳の開閉は通信を起こしません。 */
export default function ApiCatalogSyncNotice({ message, status, showResult }: Props) {
    if (!message) return null;
    return (
        <section aria-label="カタログ取り込み状況" className="rounded-2xl border border-white/40 bg-slate-950/80 px-4 py-3 text-sm text-white">
            <p role="status" aria-live="polite" className="font-semibold">{message}</p>
            {showResult && status && (
                <details className="mt-2">
                    <summary className="min-h-11 cursor-pointer py-3 text-cyan-100 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">取り込み結果の内訳</summary>
                    <p className="mt-1 leading-7">新規: {status.result.insertedCount}件 / 更新: {status.result.updatedCount}件 / スキップ: {status.result.skippedCount}件 / 失敗: {status.result.failedCount}件</p>
                    <p className="mt-1 text-xs leading-6 text-cyan-100">カタログの取り込み結果です。個々のAPIの稼働状況を示すものではありません。</p>
                </details>
            )}
        </section>
    );
}
