import type { DanceShortsAnalyzerSelectedVideo } from './AnalyzeField';

/**
 * DanceShortsAnalyzer Analyze 画面の選択動画サムネイル Field Component です。
 *
 * 選択済み動画 props の表示と Shorts URL 導線だけを扱い、URL生成や active video 解決は backend / Page 側へ分けます。
 */
type AnalyzeSelectedVideoFieldProps = {
    selectedVideos: DanceShortsAnalyzerSelectedVideo[];
};

export default function AnalyzeSelectedVideoField({
    selectedVideos,
}: AnalyzeSelectedVideoFieldProps) {
    return (
        <div className="thumbnailRail min-w-0 overflow-x-auto overflow-y-hidden pb-1 max-sm:landscape:overflow-x-hidden max-sm:landscape:overflow-y-auto max-sm:landscape:pb-0">
            <div className="flex min-w-max gap-1.5 max-sm:landscape:min-w-0 max-sm:landscape:flex-col">
                {selectedVideos.map((video) => (
                    // MOCK 契約では小サムネイルのクリック先を選択切替ではなく YouTube Shorts にします。
                    <a
                        key={video.video_id}
                        href={video.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className={[
                            'w-16 shrink-0 rounded-md border bg-white/8 p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 max-sm:landscape:w-full',
                            video.is_active
                                ? 'scale-[1.03] opacity-100'
                                : 'opacity-80 hover:opacity-100',
                        ].join(' ')}
                        style={{
                            borderColor: video.chart_color,
                            borderWidth: '3px',
                            boxShadow: video.is_active
                                ? `0 0 0 2px ${video.chart_color}`
                                : `0 0 0 1px ${video.chart_color}99`,
                        }}
                    >
                        <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-900/80 max-sm:landscape:aspect-square">
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
                        <p className="mt-0.5 truncate text-[10px] font-bold leading-3 text-white">
                            {video.latest_snapshot?.region_code ?? '-'}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
}
