import type { WorkCard } from './mockData';
import { cardKindLabels, cardKindStyles } from './mockData';

type WorkCardDetailPanelProps = {
    card: WorkCard;
    onBackToProject: () => void;
};

export default function WorkCardDetailPanel({
    card,
    onBackToProject,
}: WorkCardDetailPanelProps) {
    const styles = cardKindStyles[card.kind];

    return (
        <section className="grid gap-4">
            <div className={`rounded-lg border p-4 shadow-sm ${styles.panel}`}>
                <button
                    type="button"
                    onClick={onBackToProject}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                >
                    案件詳細へ戻る
                </button>

                <div className="mt-4 grid gap-3">
                    <span
                        className={`w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${styles.badge}`}
                    >
                        {cardKindLabels[card.kind]}
                    </span>
                    <h2 className="break-words text-2xl font-bold text-slate-950">
                        {card.title}
                    </h2>
                    <p className="text-sm leading-7 text-slate-700">
                        カード単独の詳細画面です。Queryで詳細取得、Commandで行追加・書き込み・編集・削除する候補として見せます。
                    </p>
                </div>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-bold text-slate-950">
                    カード基本情報
                </h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <DetailMeta label="状態" value={card.status} />
                    <DetailMeta label="分類" value={card.category} />
                    <DetailMeta label="確定金額" value={card.amount} />
                    <DetailMeta label="請求対象" value={card.billingTarget} />
                    <DetailMeta label="後日対応" value={card.followUp ? 'あり' : 'なし'} />
                    <DetailMeta label="問題対応" value={card.issue ? 'あり' : 'なし'} />
                </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-950">
                            作業詳細表 / 商品詳細表
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                            数量固定の列にせず、内容、表示ラベル、計測値、単位、確定金額、メモを行として表示します。
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-4 gap-2 sm:w-auto">
                        {['行追加', '書き込み', '編集', '削除'].map((label) => (
                            <button
                                key={label}
                                type="button"
                                className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 grid gap-3">
                    {card.detailRows.map((row) => (
                        <article
                            key={row.id}
                            className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                        >
                            <div className="grid gap-2 sm:grid-cols-3">
                                <DetailMeta label="内容" value={row.content} />
                                <DetailMeta label="表示ラベル" value={row.displayLabel} />
                                <DetailMeta
                                    label="計測値 / 単位"
                                    value={`${row.measuredValue} ${row.unit}`}
                                />
                                <DetailMeta label="確定金額" value={row.fixedAmount} />
                                <DetailMeta label="メモ" value={row.memo} />
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-blue-950">
                                写真連続撮影
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-blue-900">
                                実カメラ起動、圧縮、アップロードは行いません。
                            </p>
                        </div>
                        <button
                            type="button"
                            className="min-h-10 rounded-lg bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                        >
                            撮影
                        </button>
                    </div>

                    <div className="mt-4 grid gap-3">
                        {(card.photos.length > 0
                            ? card.photos
                            : [
                                  {
                                      id: 'empty-photo',
                                      title: 'サムネイル枠',
                                      memo: '写真なしの空状態',
                                      status: '投入待ち',
                                  },
                              ]
                        ).map((photo) => (
                            <article
                                key={photo.id}
                                className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-lg border border-blue-200 bg-white p-3"
                            >
                                <div className="grid aspect-square place-items-center rounded-lg border border-blue-200 bg-blue-100 text-xs font-bold text-blue-900">
                                    Photo
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-blue-950">{photo.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-blue-900">
                                        {photo.memo}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-900">
                                            {photo.status}
                                        </span>
                                        <button
                                            type="button"
                                            className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-bold text-blue-900"
                                        >
                                            削除
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-bold text-blue-900"
                                        >
                                            再試行
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-emerald-950">
                                ファイル取り込み
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-emerald-900">
                                実Storage保存は行わず、ファイル選択とドラッグ＆ドロップの入口だけを見せます。
                            </p>
                        </div>
                        <button
                            type="button"
                            className="min-h-10 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                        >
                            ファイル選択
                        </button>
                    </div>

                    <div className="mt-4 rounded-lg border-2 border-dashed border-emerald-300 bg-white p-4 text-center text-sm font-bold text-emerald-900">
                        ドラッグ＆ドロップ
                    </div>

                    <div className="mt-4 grid gap-3">
                        {(card.files.length > 0
                            ? card.files
                            : [
                                  {
                                      id: 'empty-file',
                                      fileName: '未選択',
                                      displayName: 'ファイルなし',
                                      memo: '空状態',
                                      status: '投入待ち',
                                  },
                              ]
                        ).map((file) => (
                            <article
                                key={file.id}
                                className="rounded-lg border border-emerald-200 bg-white p-3"
                            >
                                <p className="break-words font-bold text-emerald-950">
                                    {file.displayName}
                                </p>
                                <p className="mt-1 break-words text-sm text-emerald-900">
                                    {file.fileName}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-emerald-900">
                                    {file.memo}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900">
                                        {file.status}
                                    </span>
                                    <button
                                        type="button"
                                        className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-bold text-emerald-900"
                                    >
                                        削除
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-bold text-amber-950">メモ</h3>
                <textarea
                    value={card.memo}
                    readOnly
                    rows={5}
                    className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm leading-7 text-amber-950 outline-none"
                />
            </section>
        </section>
    );
}

function DetailMeta({ label, value }: { label: string; value: string }) {
    return (
        <span className="grid gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span className="break-words text-sm font-bold text-slate-900">
                {value}
            </span>
        </span>
    );
}
