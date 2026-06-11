import type { DanceShortsAnalyzerVideoCard } from './CardsField';

type SelectedFieldProps = {
    selectedVideos: DanceShortsAnalyzerVideoCard[];
    maxSelectedVideos: number;
    onRemoveVideo: (videoId: number) => void;
};

export default function SelectedField({
    selectedVideos,
    maxSelectedVideos,
    onRemoveVideo,
}: SelectedFieldProps) {
    /*
     * MOCK と同じく、検索結果より上に選択済み動画を常時見せます。
     * 選択解除はチップを押すだけにして、Analyze 本体や snapshot 取得はまだ持たせません。
     */
    return (
        <section className="min-w-0 shrink-0 rounded-lg border border-white/14 bg-slate-950/46 px-3 py-2 backdrop-blur-xl">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="shrink-0 sm:w-24">
                    <p className="rounded-md border border-white/12 bg-white/8 px-2.5 py-1 text-xs font-bold text-blue-50">
                        {selectedVideos.length} / {maxSelectedVideos}
                    </p>
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex min-w-max gap-2">
                        {selectedVideos.length > 0 ? (
                            selectedVideos.map((video) => (
                                <button
                                    key={video.youtube_video_id}
                                    type="button"
                                    onClick={() =>
                                        onRemoveVideo(video.video_id)
                                    }
                                    className="flex min-h-14 w-44 shrink-0 items-center gap-2 rounded-lg border-4 border-blue-100 bg-blue-600/55 p-1.5 text-left shadow-[0_0_0_2px_rgba(147,197,253,0.34),0_12px_26px_rgba(29,78,216,0.28)] transition hover:bg-blue-500/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
                                >
                                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-slate-900/80">
                                        {video.thumbnail_url ? (
                                            <img
                                                src={video.thumbnail_url}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-bold leading-3 text-blue-100/76">
                                                {video.youtube_video_id}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold leading-4 text-white">
                                            登録日: {video.published_at ?? '-'}
                                        </p>
                                        <p className="line-clamp-2 text-[11px] leading-3 text-blue-100/82">
                                            {video.title}
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-lg border border-white/14 bg-white/8 px-3 py-2 text-xs font-semibold text-slate-200/76">
                                未選択
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
