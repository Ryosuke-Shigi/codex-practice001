export type CapturedVideoFrame = {
    blob: Blob;
    objectUrl: string;
};

export async function captureVideoFrame(
    video: HTMLVideoElement,
): Promise<CapturedVideoFrame> {
    const { videoWidth, videoHeight } = video;

    if (videoWidth <= 0 || videoHeight <= 0) {
        throw new Error('Video frame is not ready');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const context = canvas.getContext('2d');

    if (context === null) {
        throw new Error('Canvas context is unavailable');
    }

    context.drawImage(video, 0, 0, videoWidth, videoHeight);
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
