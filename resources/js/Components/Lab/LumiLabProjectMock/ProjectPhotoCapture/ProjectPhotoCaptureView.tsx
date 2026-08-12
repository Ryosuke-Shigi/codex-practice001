import { Camera, SwitchCamera } from 'lucide-react';
import { useEffect, type RefObject } from 'react';

import CameraErrorPanel from './CameraErrorPanel';
import PhotoThumbnailStrip from './PhotoThumbnailStrip';
import type { ProjectCameraError, ProjectCapturedPhoto } from './types';

type ProjectPhotoCaptureViewProps = {
    stream: MediaStream | null;
    error: ProjectCameraError | null;
    isStarting: boolean;
    isCapturing: boolean;
    canSwitchCamera: boolean;
    captureError: string | null;
    photos: readonly ProjectCapturedPhoto[];
    videoRef: RefObject<HTMLVideoElement | null>;
    onComplete: () => void;
    onRetry: () => void;
    onSwitchCamera: () => void;
    onCapture: () => void;
    onReviewPhoto: (index: number) => void;
    onUseFileSelection: () => void;
};

function CameraPreview({
    stream,
    videoRef,
}: {
    stream: MediaStream | null;
    videoRef: RefObject<HTMLVideoElement | null>;
}) {
    useEffect(() => {
        const video = videoRef.current;

        if (video === null) {
            return;
        }

        video.srcObject = stream;

        return () => {
            video.srcObject = null;
        };
    }, [stream, videoRef]);

    return (
        <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="カメラ映像"
            className="h-full w-full object-cover"
        />
    );
}

export default function ProjectPhotoCaptureView({
    stream,
    error,
    isStarting,
    isCapturing,
    canSwitchCamera,
    captureError,
    photos,
    videoRef,
    onComplete,
    onRetry,
    onSwitchCamera,
    onCapture,
    onReviewPhoto,
    onUseFileSelection,
}: ProjectPhotoCaptureViewProps) {
    return (
        <div
            data-project-photo-capture-stage
            className="relative h-[100dvh] w-full overflow-hidden bg-black text-white [@media(min-width:768px)_and_(min-height:600px)]:h-[min(90dvh,56rem)] [@media(min-width:768px)_and_(min-height:600px)]:max-h-[calc(100dvh-3rem)] [@media(min-width:768px)_and_(min-height:600px)]:max-w-4xl [@media(min-width:768px)_and_(min-height:600px)]:rounded-2xl [@media(min-width:768px)_and_(min-height:600px)]:border [@media(min-width:768px)_and_(min-height:600px)]:border-white/15 [@media(min-width:768px)_and_(min-height:600px)]:shadow-2xl"
        >
            <div data-camera-preview-layer className="absolute inset-0">
                {stream !== null ? (
                    <CameraPreview stream={stream} videoRef={videoRef} />
                ) : null}
            </div>

            {stream !== null ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:33.333%_33.333%]"
                />
            ) : null}

            <header
                data-project-photo-capture-top-overlay
                className="absolute inset-x-0 top-0 z-30 grid min-h-16 grid-cols-[5rem_minmax(0,1fr)_5rem] items-center bg-gradient-to-b from-black/90 via-black/60 to-transparent px-2 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4"
            >
                <button
                    type="button"
                    disabled={isCapturing}
                    className="inline-flex min-h-11 items-center justify-center justify-self-start rounded-lg bg-yellow-300 px-3 text-base font-black text-black transition enabled:hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={onComplete}
                >
                    完了
                </button>
                <h1 className="truncate px-2 text-center text-lg font-black sm:text-xl">
                    案件写真を撮影
                </h1>
                <button
                    type="button"
                    aria-label="カメラ切替"
                    disabled={!canSwitchCamera || isStarting}
                    className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-full bg-white/15 transition enabled:hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-35"
                    onClick={onSwitchCamera}
                >
                    <SwitchCamera className="h-5 w-5" aria-hidden />
                    <span className="sr-only">カメラ切替</span>
                </button>
            </header>

            {isStarting ? (
                <div className="absolute inset-0 z-20 grid place-items-center bg-neutral-950/85 px-5 text-center text-base font-bold">
                    カメラを起動しています
                </div>
            ) : null}
            {error !== null ? (
                <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-neutral-950 px-4 py-24">
                    <CameraErrorPanel
                        error={error}
                        onRetry={onRetry}
                        onUseFileSelection={onUseFileSelection}
                    />
                </div>
            ) : null}

            <footer
                data-project-photo-capture-bottom-overlay
                className="absolute inset-x-0 bottom-0 z-30 grid gap-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 sm:px-5 [@media(orientation:landscape)_and_(max-height:480px)]:gap-1 [@media(orientation:landscape)_and_(max-height:480px)]:pt-7"
            >
                <div className="flex items-baseline justify-between gap-3">
                    <p className="text-base font-black">
                        <span className="mr-1 text-xl text-yellow-300">
                            {photos.length}
                        </span>
                        枚撮影済み
                    </p>
                    <p className="text-xs font-bold text-white/70 sm:text-sm">
                        サムネイルをタップで確認
                    </p>
                </div>
                <PhotoThumbnailStrip
                    photos={photos}
                    action="confirm"
                    onSelect={onReviewPhoto}
                />
                {captureError !== null ? (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-400/50 bg-red-950/70 px-3 py-2 text-center text-sm font-bold text-red-100"
                    >
                        {captureError}
                    </p>
                ) : null}
                <div
                    data-project-photo-capture-actions
                    className="flex min-h-20 items-center justify-center [@media(orientation:landscape)_and_(max-height:480px)]:min-h-16"
                >
                    <button
                        type="button"
                        aria-label="写真を撮影"
                        disabled={stream === null || isCapturing || error !== null}
                        className="grid h-20 w-20 place-items-center rounded-full border-4 border-yellow-300 bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.2)] transition enabled:active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 disabled:opacity-40 [@media(orientation:landscape)_and_(max-height:480px)]:h-16 [@media(orientation:landscape)_and_(max-height:480px)]:w-16"
                        onClick={onCapture}
                    >
                        <Camera className="h-8 w-8 text-neutral-900" aria-hidden />
                    </button>
                </div>
            </footer>
        </div>
    );
}
