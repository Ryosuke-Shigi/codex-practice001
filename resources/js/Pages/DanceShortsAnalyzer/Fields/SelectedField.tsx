import { Link } from '@inertiajs/react';
import type { DanceShortsAnalyzerVideoCard } from './CardsField';

type SelectedFieldProps = {
    selectedVideos: DanceShortsAnalyzerVideoCard[];
    maxSelectedVideos: number;
    analyzeHref: string | null;
    onRemoveVideo: (videoId: number) => void;
};

/** 選択数と分析導線を隣接させ、上限到達時も解除操作を残します。 */
export default function SelectedField({selectedVideos, maxSelectedVideos, analyzeHref, onRemoveVideo}: SelectedFieldProps) {
    return <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900 p-3">
        <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="text-sm font-bold text-white">選択中 {selectedVideos.length}/{maxSelectedVideos}</p>
            {analyzeHref && <Link href={analyzeHref} className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100">{selectedVideos.length}件を分析</Link>}
            {selectedVideos.length === maxSelectedVideos && <p className="text-xs text-blue-100">別の動画を選ぶには1件解除</p>}
        </div>
        {selectedVideos.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{selectedVideos.map((video, index) => <button key={video.video_id} type="button" onClick={() => onRemoveVideo(video.video_id)} aria-label={`${video.title}の選択を解除`} title={video.title}
            className="flex min-h-11 w-44 shrink-0 items-center gap-2 rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-left text-xs text-white focus-visible:ring-2 focus-visible:ring-blue-100">
            <span className="font-bold">{index+1}.</span><span className="line-clamp-2 min-w-0 flex-1 break-words">{video.title}</span><span aria-hidden="true">×</span>
        </button>)}</div>}
    </section>;
}
