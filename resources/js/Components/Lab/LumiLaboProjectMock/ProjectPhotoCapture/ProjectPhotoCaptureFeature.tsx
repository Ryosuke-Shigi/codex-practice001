import { useEffect, useRef, useState } from 'react';

import { captureVideoFrame } from './captureVideoFrame';
import ProjectPhotoCaptureView from './ProjectPhotoCaptureView';
import ProjectPhotoReviewView from './ProjectPhotoReviewView';
import type {
    ProjectCapturedPhoto,
    ProjectPhotoCaptureViewId,
} from './types';
import useCameraStream from './useCameraStream';

type ProjectPhotoCaptureFeatureProps = {
    onClose: () => void;
    onUseFileSelection: () => void;
};

export default function ProjectPhotoCaptureFeature({
    onClose,
    onUseFileSelection,
}: ProjectPhotoCaptureFeatureProps) {
    const camera = useCameraStream();
    const videoRef = useRef<HTMLVideoElement>(null);
    const photosRef = useRef<readonly ProjectCapturedPhoto[]>([]);
    const isMountedRef = useRef(true);
    const nextPhotoIdRef = useRef(1);
    const [viewId, setViewId] =
        useState<ProjectPhotoCaptureViewId>('capture');
    const [photos, setPhotos] = useState<readonly ProjectCapturedPhoto[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);

    useEffect(() => {
        photosRef.current = photos;
    }, [photos]);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            photosRef.current.forEach((photo) => {
                URL.revokeObjectURL(photo.objectUrl);
            });
        };
    }, []);

    const capturePhoto = async () => {
        const video = videoRef.current;

        if (video === null || camera.stream === null || isCapturing) {
            return;
        }

        setIsCapturing(true);
        setCaptureError(null);

        try {
            const frame = await captureVideoFrame(video);

            if (!isMountedRef.current) {
                URL.revokeObjectURL(frame.objectUrl);

                return;
            }

            const nextPhoto: ProjectCapturedPhoto = {
                id: `capture-${nextPhotoIdRef.current}`,
                blob: frame.blob,
                objectUrl: frame.objectUrl,
            };

            nextPhotoIdRef.current += 1;
            setPhotos((current) => [...current, nextPhoto]);
        } catch {
            if (isMountedRef.current) {
                setCaptureError(
                    '撮影画像の生成に失敗しました。もう一度お試しください。',
                );
            }
        } finally {
            if (isMountedRef.current) {
                setIsCapturing(false);
            }
        }
    };

    const openReview = (index: number) => {
        if (photos[index] === undefined) {
            return;
        }

        setSelectedIndex(index);
        setViewId('review');
    };

    const finishCapture = () => {
        if (photos.length === 0) {
            return;
        }

        openReview(photos.length - 1);
    };

    const deleteSelectedPhoto = () => {
        const selectedPhoto = photos[selectedIndex];

        if (selectedPhoto === undefined) {
            return;
        }

        URL.revokeObjectURL(selectedPhoto.objectUrl);
        const nextPhotos = photos.filter((photo) => photo.id !== selectedPhoto.id);

        setPhotos(nextPhotos);

        if (nextPhotos.length === 0) {
            setSelectedIndex(0);
            setViewId('capture');

            return;
        }

        setSelectedIndex(Math.min(selectedIndex, nextPhotos.length - 1));
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="案件写真の連続撮影"
            className="fixed inset-0 z-[80] bg-neutral-950"
        >
            {viewId === 'capture' ? (
                <ProjectPhotoCaptureView
                    stream={camera.stream}
                    error={camera.error}
                    isStarting={camera.isStarting}
                    isCapturing={isCapturing}
                    canSwitchCamera={camera.canSwitchCamera}
                    captureError={captureError}
                    photos={photos}
                    videoRef={videoRef}
                    onClose={onClose}
                    onRetry={camera.retry}
                    onSwitchCamera={camera.switchCamera}
                    onCapture={() => void capturePhoto()}
                    onReviewPhoto={openReview}
                    onFinish={finishCapture}
                    onUseFileSelection={onUseFileSelection}
                />
            ) : (
                <ProjectPhotoReviewView
                    photos={photos}
                    selectedIndex={selectedIndex}
                    onSelectPhoto={setSelectedIndex}
                    onBack={() => setViewId('capture')}
                    onDelete={deleteSelectedPhoto}
                />
            )}
        </div>
    );
}
