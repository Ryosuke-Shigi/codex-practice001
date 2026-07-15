// @vitest-environment jsdom

import { act, type ReactNode, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectPhotoCaptureFeature from './ProjectPhotoCaptureFeature';
import { createProjectCameraError } from './useCameraStream';

type MockTrack = MediaStreamTrack & { stop: ReturnType<typeof vi.fn> };

function createMockStream(label: string) {
    const track = {
        label,
        stop: vi.fn(),
    } as unknown as MockTrack;
    const stream = {
        getTracks: () => [track],
    } as unknown as MediaStream;

    return { stream, track };
}

let root: Root;
let container: HTMLDivElement;
let createObjectUrl: ReturnType<typeof vi.fn>;
let revokeObjectUrl: ReturnType<typeof vi.fn>;

beforeEach(() => {
    (
        globalThis as typeof globalThis & {
            IS_REACT_ACT_ENVIRONMENT: boolean;
        }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    createObjectUrl = vi.fn();
    revokeObjectUrl = vi.fn();
    vi.stubGlobal('URL', {
        createObjectURL: createObjectUrl,
        revokeObjectURL: revokeObjectUrl,
    });
    Object.defineProperties(HTMLVideoElement.prototype, {
        videoHeight: { configurable: true, get: () => 720 },
        videoWidth: { configurable: true, get: () => 1280 },
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        configurable: true,
        value: vi.fn((callback: BlobCallback) => {
            callback(new Blob(['photo'], { type: 'image/jpeg' }));
        }),
    });
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function render(ui: ReactNode) {
    act(() => root.render(ui));
}

function normalizedText(element: Element): string {
    return element.textContent?.replace(/\s+/gu, '') ?? '';
}

function findButton(label: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll('button')).find(
        (candidate) => normalizedText(candidate) === label,
    );

    if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Button not found: ${label}`);
    }

    return button;
}

function getMediaDevices(
    getUserMedia: ReturnType<typeof vi.fn>,
    cameraCount = 1,
) {
    vi.stubGlobal('navigator', {
        mediaDevices: {
            getUserMedia,
            enumerateDevices: vi.fn().mockResolvedValue(
                Array.from({ length: cameraCount }, (_, index) => ({
                    deviceId: `camera-${index}`,
                    groupId: 'camera-group',
                    kind: 'videoinput',
                    label: `camera ${index + 1}`,
                    toJSON: () => ({}),
                })),
            ),
        },
    });
}

async function flushCameraStart() {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
}

async function click(button: HTMLButtonElement) {
    await act(async () => {
        button.click();
        await Promise.resolve();
        await Promise.resolve();
    });
}

describe('ProjectPhotoCaptureFeature', () => {
    it.each([
        [
            'NotFoundError',
            '利用可能なカメラが見つかりません。',
            'not-found',
        ],
        [
            'NotReadableError',
            '他のアプリがカメラを使用しているため起動できません。',
            'in-use',
        ],
        [
            'NotAllowedError',
            'カメラの利用が許可されませんでした。ブラウザの設定を確認してください。',
            'permission-denied',
        ],
    ])('distinguishes the %s camera error', (name, message, code) => {
        expect(createProjectCameraError(new DOMException('', name))).toEqual({
            code,
            message,
            retryable: true,
        });
    });

    it('shows the unsupported message and keeps the file selection action', async () => {
        vi.stubGlobal('navigator', { mediaDevices: undefined });

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();

        expect(container.textContent).toContain(
            'このブラウザはカメラ撮影に対応していません。',
        );
        expect(findButton('ファイルを選択する').disabled).toBe(false);
    });

    it('falls back to an available camera when the preferred rear camera cannot start', async () => {
        const { stream } = createMockStream('available');
        const getUserMedia = vi
            .fn()
            .mockRejectedValueOnce(
                new DOMException('rear camera unavailable', 'NotFoundError'),
            )
            .mockResolvedValueOnce(stream);
        getMediaDevices(getUserMedia);

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();

        expect(getUserMedia).toHaveBeenNthCalledWith(2, {
            audio: false,
            video: true,
        });
        expect(container.querySelector('video[aria-label="カメラ映像"]')).not.toBeNull();
        expect(findButton('カメラ切替').disabled).toBe(true);
    });

    it('starts with the rear camera and shows a Japanese permission error', async () => {
        const getUserMedia = vi
            .fn()
            .mockRejectedValue(
                new DOMException('permission denied', 'NotAllowedError'),
            );
        getMediaDevices(getUserMedia);

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();

        expect(getUserMedia).toHaveBeenCalledWith({
            audio: false,
            video: { facingMode: { ideal: 'environment' } },
        });
        expect(container.textContent).toContain(
            'カメラの利用が許可されませんでした。',
        );
        expect(findButton('カメラを再試行').disabled).toBe(false);
        expect(findButton('ファイルを選択する').disabled).toBe(false);
    });

    it('captures consecutive frames in order and opens the selected thumbnail', async () => {
        const { stream } = createMockStream('rear');
        getMediaDevices(vi.fn().mockResolvedValue(stream));
        createObjectUrl
            .mockReturnValueOnce('blob:photo-1')
            .mockReturnValueOnce('blob:photo-2');

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();

        const shutter = container.querySelector(
            'button[aria-label="写真を撮影"]',
        );
        expect(shutter).toBeInstanceOf(HTMLButtonElement);
        await click(shutter as HTMLButtonElement);
        await click(shutter as HTMLButtonElement);

        expect(container.textContent).toContain('2枚撮影済み');
        const thumbnails = Array.from(
            container.querySelectorAll<HTMLButtonElement>(
                'button[aria-label$="枚目の写真を確認"]',
            ),
        );
        expect(thumbnails.map((thumbnail) => thumbnail.ariaLabel)).toEqual([
            '1枚目の写真を確認',
            '2枚目の写真を確認',
        ]);

        await click(thumbnails[1]);

        expect(container.textContent).toContain('写真を確認');
        expect(container.textContent).toContain('2 / 2');
        expect(
            container.querySelector<HTMLImageElement>('img[alt="撮影写真 2"]')
                ?.src,
        ).toContain('blob:photo-2');
    });

    it('switches photos, deletes only the selected photo, and returns after the last deletion', async () => {
        const { stream } = createMockStream('rear');
        getMediaDevices(vi.fn().mockResolvedValue(stream));
        createObjectUrl
            .mockReturnValueOnce('blob:photo-1')
            .mockReturnValueOnce('blob:photo-2');

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();
        const shutter = container.querySelector<HTMLButtonElement>(
            'button[aria-label="写真を撮影"]',
        );
        await click(shutter as HTMLButtonElement);
        await click(shutter as HTMLButtonElement);
        await click(findButton('撮影を終了して確認'));

        expect(container.textContent).toContain('2 / 2');
        const firstThumbnail = container.querySelector<HTMLButtonElement>(
            'button[aria-label="1枚目の写真を表示"]',
        );
        await click(firstThumbnail as HTMLButtonElement);
        expect(container.textContent).toContain('1 / 2');

        await click(findButton('この写真を削除'));

        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:photo-1');
        expect(container.textContent).toContain('1 / 1');
        expect(container.textContent).not.toContain('撮影写真 1');

        await click(findButton('この写真を削除'));

        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:photo-2');
        expect(container.textContent).toContain('0枚撮影済み');
        expect(container.textContent).toContain('案件写真を撮影');
    });

    it('keeps the stream while reviewing and resumes shooting on return', async () => {
        const { stream, track } = createMockStream('rear');
        const getUserMedia = vi.fn().mockResolvedValue(stream);
        getMediaDevices(getUserMedia);
        createObjectUrl.mockReturnValue('blob:photo');

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();
        await click(
            container.querySelector<HTMLButtonElement>(
                'button[aria-label="写真を撮影"]',
            ) as HTMLButtonElement,
        );
        await click(findButton('撮影を終了して確認'));
        await click(findButton('戻る'));

        expect(container.textContent).toContain('案件写真を撮影');
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(track.stop).not.toHaveBeenCalled();
    });

    it('stops the old stream before switching cameras', async () => {
        const rear = createMockStream('rear');
        const front = createMockStream('front');
        const getUserMedia = vi
            .fn()
            .mockResolvedValueOnce(rear.stream)
            .mockResolvedValueOnce(front.stream);
        getMediaDevices(getUserMedia, 2);

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();
        await click(findButton('カメラ切替'));

        expect(rear.track.stop).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenNthCalledWith(2, {
            audio: false,
            video: { facingMode: { ideal: 'user' } },
        });
        expect(front.track.stop).not.toHaveBeenCalled();
    });

    it('stops the stream and revokes remaining object URLs when closed', async () => {
        const { stream, track } = createMockStream('rear');
        getMediaDevices(vi.fn().mockResolvedValue(stream));
        createObjectUrl.mockReturnValue('blob:photo');

        function Host() {
            const [isOpen, setIsOpen] = useState(true);

            return isOpen ? (
                <ProjectPhotoCaptureFeature
                    onClose={() => setIsOpen(false)}
                    onUseFileSelection={vi.fn()}
                />
            ) : (
                <p>撮影画面を閉じました</p>
            );
        }

        render(<Host />);
        await flushCameraStart();
        await click(
            container.querySelector<HTMLButtonElement>(
                'button[aria-label="写真を撮影"]',
            ) as HTMLButtonElement,
        );
        await click(findButton('閉じる'));

        expect(container.textContent).toContain('撮影画面を閉じました');
        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:photo');
    });

    it('revokes a frame that finishes generating after the feature is closed', async () => {
        const { stream, track } = createMockStream('rear');
        getMediaDevices(vi.fn().mockResolvedValue(stream));
        createObjectUrl.mockReturnValue('blob:late-photo');
        let finishBlob: BlobCallback | undefined;
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            configurable: true,
            value: vi.fn((callback: BlobCallback) => {
                finishBlob = callback;
            }),
        });

        function Host() {
            const [isOpen, setIsOpen] = useState(true);

            return isOpen ? (
                <ProjectPhotoCaptureFeature
                    onClose={() => setIsOpen(false)}
                    onUseFileSelection={vi.fn()}
                />
            ) : (
                <p>撮影画面を閉じました</p>
            );
        }

        render(<Host />);
        await flushCameraStart();
        act(() => {
            container
                .querySelector<HTMLButtonElement>(
                    'button[aria-label="写真を撮影"]',
                )
                ?.click();
        });
        await click(findButton('閉じる'));
        await act(async () => {
            finishBlob?.(new Blob(['late-photo'], { type: 'image/jpeg' }));
            await Promise.resolve();
        });

        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:late-photo');
    });

    it('shows a capture error without leaving the camera screen', async () => {
        const { stream } = createMockStream('rear');
        getMediaDevices(vi.fn().mockResolvedValue(stream));
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            configurable: true,
            value: vi.fn((callback: BlobCallback) => callback(null)),
        });

        render(
            <ProjectPhotoCaptureFeature
                onClose={vi.fn()}
                onUseFileSelection={vi.fn()}
            />,
        );
        await flushCameraStart();
        await click(
            container.querySelector<HTMLButtonElement>(
                'button[aria-label="写真を撮影"]',
            ) as HTMLButtonElement,
        );

        expect(container.textContent).toContain('撮影画像の生成に失敗しました。');
        expect(container.textContent).toContain('案件写真を撮影');
    });
});
