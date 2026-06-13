/**
 * DanceShortsAnalyzer Search 画面の動画カード一覧 Field Component です。
 *
 * props の動画一覧と選択状態を表示するだけにし、最大選択数や次ページ取得条件は Page / backend 境界へ分けます。
 */
export type DanceShortsAnalyzerVideoCard = {
    video_id: number;
    youtube_video_id: string;
    title: string;
    channel_title: string | null;
    thumbnail_url: string | null;
    published_at: string | null;
    youtube_url: string;
    tracking_status: string;
};

export type DanceShortsAnalyzerCardSort = 'published_desc' | 'published_asc';

export type DanceShortsAnalyzerCardsFieldProps = {
    videos: DanceShortsAnalyzerVideoCard[];
    empty_message: string | null;
    end_message: string | null;
    has_searched: boolean;
    has_more: boolean;
    next_page: number | null;
    current_page: number;
    per_page: number;
    sort: DanceShortsAnalyzerCardSort;
    sort_options: {
        value: DanceShortsAnalyzerCardSort;
        label: string;
    }[];
};

type CardsFieldProps = {
    cardsField: DanceShortsAnalyzerCardsFieldProps;
    videos: DanceShortsAnalyzerVideoCard[];
    loading: boolean;
    selectedVideoIds: number[];
    maxSelectedVideos: number;
    onToggleVideo: (videoId: number) => void;
    onSortChange: (sort: DanceShortsAnalyzerCardSort) => void;
    onLoadMore: () => void;
};

export default function CardsField({
    cardsField,
    videos,
    loading,
    selectedVideoIds,
    maxSelectedVideos,
    onToggleVideo,
    onSortChange,
    onLoadMore,
}: CardsFieldProps) {
    /*
     * CardsField は検索結果カード、並び替え、選択、さらに取得カードをまとめて扱います。
     * SearchResultField を別に作らず、検索結果の表示責務をここに閉じ込めます。
     */
    const showLoadMoreCard =
        cardsField.has_searched &&
        cardsField.has_more &&
        !loading &&
        videos.length > 0;
    const showLoadingCard = loading && videos.length > 0;
    const showEndMessage =
        cardsField.has_searched &&
        !cardsField.has_more &&
        !loading &&
        videos.length > 0 &&
        cardsField.end_message !== null;
    const showSortControls = cardsField.has_searched && videos.length > 0;

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/14 bg-slate-950/46 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-4">
            {showSortControls && (
                <div className="mb-2 flex min-w-0 shrink-0 justify-end gap-1">
                    {cardsField.sort_options.map((sortOption) => {
                        const isActive = cardsField.sort === sortOption.value;

                        return (
                            <button
                                key={sortOption.value}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => onSortChange(sortOption.value)}
                                className={[
                                    'min-h-9 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100',
                                    isActive
                                        ? 'border-blue-100 bg-blue-500 text-white'
                                        : 'border-white/14 bg-white/8 text-blue-50 hover:bg-white/14',
                                ].join(' ')}
                            >
                                {sortOption.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {videos.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-white/18 bg-white/8 px-4 py-10 text-center text-sm font-semibold leading-6 text-slate-200/78">
                    {loading
                        ? '検索中です。'
                        : cardsField.empty_message ?? '表示できる動画はありません。'}
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                    {/* モバイルでも1画面内に収めるため、CardsField 内だけを縦スクロールにします。 */}
                    <div className="grid min-w-0 gap-2 pb-1">
                        {videos.map((video) => {
                            const isSelected = selectedVideoIds.includes(
                                video.video_id,
                            );
                            const canSelect =
                                isSelected ||
                                selectedVideoIds.length < maxSelectedVideos;

                            return (
                                <VideoCard
                                    key={video.youtube_video_id}
                                    video={video}
                                    isSelected={isSelected}
                                    canSelect={canSelect}
                                    onToggle={() =>
                                        onToggleVideo(video.video_id)
                                    }
                                />
                            );
                        })}

                        {showLoadMoreCard && (
                            <button
                                type="button"
                                onClick={onLoadMore}
                                className="flex min-h-11 min-w-0 items-center justify-center rounded-lg border border-blue-100/34 bg-blue-500/20 px-3 text-center text-sm font-bold text-blue-50 transition hover:bg-blue-400/26 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
                            >
                                さらに取得
                            </button>
                        )}

                        {showLoadingCard && (
                            <div className="flex min-h-11 items-center justify-center rounded-lg border border-white/14 bg-white/8 px-3 text-sm font-bold text-slate-200/78">
                                追加取得中です。
                            </div>
                        )}
                    </div>

                    {showEndMessage && (
                        <p className="mt-3 rounded-lg border border-white/12 bg-white/8 px-3 py-2 text-center text-xs font-semibold text-slate-200/72">
                            {cardsField.end_message}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

function VideoCard({
    video,
    isSelected,
    canSelect,
    onToggle,
}: {
    video: DanceShortsAnalyzerVideoCard;
    isSelected: boolean;
    canSelect: boolean;
    onToggle: () => void;
}) {
    /*
     * カード全体を選択ボタンにします。
     * YouTube を開く導線は PR1 の検索結果カードには置かず、PR2 以降の選択済み /
     * Analyze 側で扱えるようにします。
     */
    return (
        <button
            type="button"
            aria-pressed={isSelected}
            disabled={!canSelect}
            onClick={onToggle}
            className={[
                'min-w-0 rounded-lg border p-2 text-left shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-45',
                isSelected
                    ? 'border-blue-100 bg-blue-600/55 shadow-[0_0_0_2px_rgba(147,197,253,0.34),0_12px_26px_rgba(29,78,216,0.28)]'
                    : 'border-white/14 bg-white/9 hover:border-white/28 hover:bg-white/12',
            ].join(' ')}
        >
            <div className="flex min-w-0 gap-2">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md border border-white/12 bg-slate-900/80 sm:h-20 sm:w-32">
                    {video.thumbnail_url ? (
                        <img
                            src={video.thumbnail_url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-bold leading-4 text-blue-100/76">
                            {video.youtube_video_id}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                    <h2 className="line-clamp-2 text-sm font-black leading-5 text-white">
                        {video.title}
                    </h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-200/72">
                        登録日: {video.published_at ?? '-'}
                    </p>
                </div>
            </div>
        </button>
    );
}
