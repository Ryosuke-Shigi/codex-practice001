// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    calculateObjectCoverCrop,
    captureVideoFrame,
} from './captureVideoFrame';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('captureVideoFrame', () => {
    it('crops a landscape camera frame to the visible portrait object-cover range', async () => {
        const video = document.createElement('video');
        Object.defineProperties(video, {
            clientHeight: { configurable: true, value: 844 },
            clientWidth: { configurable: true, value: 390 },
            videoHeight: { configurable: true, value: 720 },
            videoWidth: { configurable: true, value: 1280 },
        });
        const drawImage = vi.fn();
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage,
        } as unknown as CanvasRenderingContext2D);
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            configurable: true,
            value: vi.fn((callback: BlobCallback) => {
                callback(new Blob(['photo'], { type: 'image/jpeg' }));
            }),
        });
        const createObjectURL = vi.fn().mockReturnValue('blob:portrait-photo');
        vi.stubGlobal('URL', {
            createObjectURL,
            revokeObjectURL: vi.fn(),
        });

        const crop = calculateObjectCoverCrop(1280, 720, 390, 844);

        expect(crop.sourceX).toBeCloseTo(473.65, 1);
        expect(crop.sourceY).toBe(0);
        expect(crop.sourceWidth).toBeCloseTo(332.7, 1);
        expect(crop.sourceHeight).toBe(720);

        const frame = await captureVideoFrame(video);

        expect(drawImage).toHaveBeenCalledWith(
            video,
            crop.sourceX,
            crop.sourceY,
            crop.sourceWidth,
            crop.sourceHeight,
            0,
            0,
            333,
            720,
        );
        expect(frame.objectUrl).toBe('blob:portrait-photo');
    });

    it('keeps the full source frame when the rendered size is unavailable', () => {
        expect(calculateObjectCoverCrop(1280, 720, 0, 0)).toEqual({
            sourceX: 0,
            sourceY: 0,
            sourceWidth: 1280,
            sourceHeight: 720,
        });
    });
});
