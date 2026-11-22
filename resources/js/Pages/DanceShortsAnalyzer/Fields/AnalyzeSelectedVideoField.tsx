import type { DanceShortsAnalyzerSelectedVideo } from './AnalyzeField';

/** 番号・色と全文タイトルで、比較対象と別タブのリンク先を識別します。 */
export default function AnalyzeSelectedVideoField({selectedVideos}: {selectedVideos: DanceShortsAnalyzerSelectedVideo[]}) {
    return <section className="min-w-0">
        <h2 className="mb-3 text-base font-bold text-white">比較する動画 <span className="text-sm text-slate-400">{selectedVideos.length}件</span></h2>
        <ol className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedVideos.map((video) => <li key={video.video_id} className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
                <a href={video.youtube_url} target="_blank" rel="noreferrer" aria-label={`${video.comparison_number}. ${video.title} — YouTube Shortsを別タブで開く`}
                    className="w-16 shrink-0 overflow-hidden rounded-md border-2 focus-visible:ring-2 focus-visible:ring-white" style={{borderColor: video.chart_color}}>
                    <div className="aspect-video bg-slate-800">{video.thumbnail_url && <img src={video.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
                    <span className="block bg-slate-950 px-1 py-1 text-center text-xs font-black" style={{color: video.chart_color}}>{video.comparison_number}. ↗</span>
                </a>
                <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-white">{video.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{video.latest_snapshot?.region_code ?? 'snapshotなし'}</p>
                </div>
            </li>)}
        </ol>
    </section>;
}
