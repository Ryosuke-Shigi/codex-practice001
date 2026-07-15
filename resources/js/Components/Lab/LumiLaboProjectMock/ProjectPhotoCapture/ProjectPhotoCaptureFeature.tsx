import { useEffect, useRef, useState } from 'react';

import { captureVideoFrame } from './captureVideoFrame';
import ProjectPhotoCaptureView from './ProjectPhotoCaptureView';
import ProjectPhotoReviewView from './ProjectPhotoReviewView';
import type {
    ProjectCapturedPhoto,
    ProjectPhotoCaptureScreen,
} from './types';
import useCameraStream from './useCameraStream';

type ProjectPhotoCaptureFeatureProps = {
    onComplete: (photos: readonly ProjectCapturedPhoto[]) => void;
    onUseFileSelection: () => void;
};

export default function ProjectPhotoCaptureFeature({
    onComplete,
    onUseFileSelection,
}: ProjectPhotoCaptureFeatureProps) {
    const camera = useCameraStream();
    const videoRef = useRef<HTMLVideoElement>(null);
    const photosRef = useRef<readonly ProjectCapturedPhoto[]>([]);
    const ownsPhotosRef = useRef(true);
    const isMountedRef = useRef(true);
    const nextPhotoIdRef = useRef(1);
    const [screen, setScreen] = useState<ProjectPhotoCaptureScreen>({
        id: 'capture',
    });
    const [photos, setPhotos] = useState<readonly ProjectCapturedPhoto[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            if (ownsPhotosRef.current) {
                photosRef.current.forEach((photo) => {
                    URL.revokeObjectURL(photo.objectUrl);
                });
            }
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
            setPhotos((current) => {
                const nextPhotos = [...current, nextPhoto];

                photosRef.current = nextPhotos;

                return nextPhotos;
            });
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
        setScreen({ id: 'review' });
    };

    const deleteSelectedPhoto = () => {
        const selectedPhoto = photos[selectedIndex];

        if (selectedPhoto === undefined) {
            return;
        }

        URL.revokeObjectURL(selectedPhoto.objectUrl);
        const nextPhotos = photos.filter((photo) => photo.id !== selectedPhoto.id);

        photosRef.current = nextPhotos;
        setPhotos(nextPhotos);

        if (nextPhotos.length === 0) {
            setSelectedIndex(0);
            setScreen({ id: 'capture' });

            return;
        }

        setSelectedIndex(Math.min(selectedIndex, nextPhotos.length - 1));
    };

    const completeCapture = () => {
        ownsPhotosRef.current = false;
        onComplete([...photosRef.current]);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="案件写真の連続撮影"
            className="fixed inset-0 z-[80] bg-neutral-950 [@media(min-width:768px)_and_(min-height:600px)]:grid [@media(min-width:768px)_and_(min-height:600px)]:place-items-center [@media(min-width:768px)_and_(min-height:600px)]:bg-neutral-950/80 [@media(min-width:768px)_and_(min-height:600px)]:p-6"
        >
            {screen.id === 'capture' ? (
                <ProjectPhotoCaptureView
                    stream={camera.stream}
                    error={camera.error}
                    isStarting={camera.isStarting}
                    isCapturing={isCapturing}
                    canSwitchCamera={camera.canSwitchCamera}
                    captureError={captureError}
                    photos={photos}
                    videoRef={videoRef}
                    onComplete={completeCapture}
                    onRetry={camera.retry}
                    onSwitchCamera={camera.switchCamera}
                    onCapture={() => void capturePhoto()}
                    onReviewPhoto={openReview}
                    onUseFileSelection={onUseFileSelection}
                />
            ) : (
                <ProjectPhotoReviewView
                    photos={photos}
                    selectedIndex={selectedIndex}
                    onSelectPhoto={setSelectedIndex}
                    onBack={() => setScreen({ id: 'capture' })}
                    onDelete={deleteSelectedPhoto}
                />
            )}
        </div>
    );
}
