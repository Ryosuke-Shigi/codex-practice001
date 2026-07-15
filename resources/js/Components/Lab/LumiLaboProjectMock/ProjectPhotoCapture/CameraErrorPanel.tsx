import { CameraOff, RotateCcw, Upload } from 'lucide-react';

import type { ProjectCameraError } from './types';

type CameraErrorPanelProps = {
    error: ProjectCameraError;
    onRetry: () => void;
    onUseFileSelection: () => void;
};

export default function CameraErrorPanel({
    error,
    onRetry,
    onUseFileSelection,
}: CameraErrorPanelProps) {
    return (
        <div className="mx-auto grid w-full max-w-md gap-4 rounded-xl border border-white/15 bg-neutral-900/95 p-5 text-center shadow-2xl">
            <CameraOff className="mx-auto h-10 w-10 text-yellow-300" aria-hidden />
            <p role="alert" className="text-base font-bold leading-relaxed text-white">
                {error.message}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
                {error.retryable ? (
                    <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/40 bg-neutral-800 px-4 font-black text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                        onClick={onRetry}
                    >
                        <RotateCcw className="h-5 w-5" aria-hidden />
                        カメラを再試行
                    </button>
                ) : null}
                <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 font-black text-black transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                    onClick={onUseFileSelection}
                >
                    <Upload className="h-5 w-5" aria-hidden />
                    ファイルを選択する
                </button>
            </div>
        </div>
    );
}
