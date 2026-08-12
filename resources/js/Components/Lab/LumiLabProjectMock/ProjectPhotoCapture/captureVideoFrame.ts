export type CapturedVideoFrame = {
    blob: Blob;
    objectUrl: string;
};

export type ObjectCoverCrop = {
    sourceX: number;
    sourceY: number;
    sourceWidth: number;
    sourceHeight: number;
};

export function calculateObjectCoverCrop(
    sourceWidth: number,
    sourceHeight: number,
    renderedWidth: number,
    renderedHeight: number,
): ObjectCoverCrop {
    if (renderedWidth <= 0 || renderedHeight <= 0) {
        return {
            sourceX: 0,
            sourceY: 0,
            sourceWidth,
            sourceHeight,
        };
    }

    const sourceAspectRatio = sourceWidth / sourceHeight;
    const renderedAspectRatio = renderedWidth / renderedHeight;

    if (sourceAspectRatio > renderedAspectRatio) {
        const croppedWidth = sourceHeight * renderedAspectRatio;

        return {
            sourceX: (sourceWidth - croppedWidth) / 2,
            sourceY: 0,
            sourceWidth: croppedWidth,
            sourceHeight,
        };
    }

    const croppedHeight = sourceWidth / renderedAspectRatio;

    return {
        sourceX: 0,
        sourceY: (sourceHeight - croppedHeight) / 2,
        sourceWidth,
        sourceHeight: croppedHeight,
    };
}

export async function captureVideoFrame(
    video: HTMLVideoElement,
): Promise<CapturedVideoFrame> {
    const { videoWidth, videoHeight } = video;

    if (videoWidth <= 0 || videoHeight <= 0) {
        throw new Error('Video frame is not ready');
    }

    const crop = calculateObjectCoverCrop(
        videoWidth,
        videoHeight,
        video.clientWidth,
        video.clientHeight,
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(crop.sourceWidth));
    canvas.height = Math.max(1, Math.round(crop.sourceHeight));
    const context = canvas.getContext('2d');

    if (context === null) {
        throw new Error('Canvas context is unavailable');
    }

    context.drawImage(
        video,
        crop.sourceX,
        crop.sourceY,
        crop.sourceWidth,
        crop.sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
    );
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
            if (nextBlob === null) {
                reject(new Error('Photo blob could not be created'));

                return;
            }

            resolve(nextBlob);
        }, 'image/jpeg');
    });

    return {
        blob,
        objectUrl: URL.createObjectURL(blob),
    };
}
