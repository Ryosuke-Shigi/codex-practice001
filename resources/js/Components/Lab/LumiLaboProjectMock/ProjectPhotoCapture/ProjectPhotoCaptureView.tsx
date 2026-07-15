import { Camera, SwitchCamera, X } from 'lucide-react';
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
    onClose: () => void;
    onRetry: () => void;
    onSwitchCamera: () => void;
    onCapture: () => void;
    onReviewPhoto: (index: number) => void;
    onFinish: () => void;
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
    onClose,
    onRetry,
    onSwitchCamera,
    onCapture,
    onReviewPhoto,
    onFinish,
    onUseFileSelection,
}: ProjectPhotoCaptureViewProps) {
    return (
        <div className="flex h-[100dvh] min-h-0 flex-col bg-neutral-950 text-white">
            <header className="grid min-h-16 grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center border-b border-white/10 bg-neutral-950 px-2 pt-[env(safe-area-inset-top)] sm:px-4">
                <button
                    type="button"
                    aria-label="閉じる"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                    onClick={onClose}
                >
                    <X className="h-7 w-7" aria-hidden />
                    <span className="sr-only">閉じる</span>
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

            <main className="relative min-h-0 flex-1 overflow-hidden bg-black">
                {stream !== null ? (
                    <CameraPreview stream={stream} videoRef={videoRef} />
                ) : null}
                {stream !== null ? (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:33.333%_33.333%]"
                    >
                        <span className="absolute left-5 top-5 h-10 w-10 border-l-4 border-t-4 border-yellow-300 sm:left-8 sm:top-8" />
                        <span className="absolute right-5 top-5 h-10 w-10 border-r-4 border-t-4 border-yellow-300 sm:right-8 sm:top-8" />
                        <span className="absolute bottom-5 left-5 h-10 w-10 border-b-4 border-l-4 border-yellow-300 sm:bottom-8 sm:left-8" />
                        <span className="absolute bottom-5 right-5 h-10 w-10 border-b-4 border-r-4 border-yellow-300 sm:bottom-8 sm:right-8" />
                    </div>
                ) : null}
                {isStarting ? (
                    <div className="absolute inset-0 grid place-items-center bg-neutral-950/85 px-5 text-center text-base font-bold">
                        カメラを起動しています
                    </div>
                ) : null}
                {error !== null ? (
                    <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-neutral-950 px-4 py-6">
                        <CameraErrorPanel
                            error={error}
                            onRetry={onRetry}
                            onUseFileSelection={onUseFileSelection}
                        />
                    </div>
                ) : null}
            </main>

            <footer className="grid max-h-[45dvh] flex-none gap-3 overflow-y-auto border-t border-white/10 bg-neutral-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-lg font-black">
                        <span className="mr-1 text-2xl text-yellow-300">
                            {photos.length}
                        </span>
                        枚撮影済み
                    </p>
                    <p className="text-sm font-bold text-white/70">
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
                <div className="flex items-center justify-center">
                    <button
                        type="button"
                        aria-label="写真を撮影"
                        disabled={stream === null || isCapturing || error !== null}
                        className="grid h-20 w-20 place-items-center rounded-full border-4 border-yellow-300 bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.2)] transition enabled:active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 disabled:opacity-40 sm:h-24 sm:w-24"
                        onClick={onCapture}
                    >
                        <Camera className="h-8 w-8 text-neutral-900" aria-hidden />
                    </button>
                </div>
                <button
                    type="button"
                    disabled={photos.length === 0}
                    className="inline-flex min-h-14 w-full items-center justify-center rounded-lg bg-yellow-300 px-5 text-lg font-black text-black transition enabled:hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={onFinish}
                >
                    撮影を終了して確認
                </button>
            </footer>
        </div>
    );
}
