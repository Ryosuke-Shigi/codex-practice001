/**
 * 工事発注管理・請求システム MOCK の画像アップロード見本 Component です。
 *
 * 固定カードを表示するだけで、実ファイル選択、S3保存、画像DB登録は行いません。
 */
import { imageCards } from './mockData';

export default function ImageUploadMockPanel() {
    return (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
                <h2 className="text-xl font-semibold text-white">画像まとめアップロード</h2>
                <div className="mt-4 flex min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-cyan-100/35 bg-cyan-100/8 p-5 text-center">
                    <p className="text-lg font-semibold text-white">現場写真をまとめて追加</p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200/80">
                        本実装ではアップロード後にS3へ保存し、発注番号・工程・写真種別に紐づける想定です。
                    </p>
                    <button
                        type="button"
                        className="mt-4 min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-bold text-white"
                    >
                        アップロード風UI
                    </button>
                </div>
            </article>

            <aside className="rounded-lg border border-amber-200/30 bg-amber-200/12 p-4 backdrop-blur-xl sm:p-5">
                <h3 className="font-semibold text-amber-50">保存先予定</h3>
                <p className="mt-2 text-sm leading-6 text-amber-50/80">
                    S3保存、サムネイル生成、PDF台帳連携は後続実装の責務として分離します。
                </p>
            </aside>

            <div className="grid grid-cols-1 gap-3 lg:col-span-2 md:grid-cols-3">
                {imageCards.map((image) => (
                    <article
                        key={image.id}
                        className="overflow-hidden rounded-lg border border-white/15 bg-slate-950/70"
                    >
                        <div className={`h-32 bg-gradient-to-br ${image.tone}`} />
                        <div className="p-4">
                            <h3 className="font-semibold text-white">{image.title}</h3>
                            <p className="mt-1 text-sm text-slate-300">{image.meta}</p>
                            <p className="mt-3 rounded-md bg-slate-950/55 px-2.5 py-2 text-xs text-slate-300">
                                仮画像カード。実ファイル保存はしません。
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
