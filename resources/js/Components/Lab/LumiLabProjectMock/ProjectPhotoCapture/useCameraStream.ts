import { useCallback, useEffect, useRef, useState } from 'react';

import type {
    ProjectCameraError,
    ProjectCameraFacingMode,
} from './types';

type ProjectCameraStreamState = {
    stream: MediaStream | null;
    error: ProjectCameraError | null;
    isStarting: boolean;
    canSwitchCamera: boolean;
    retry: () => void;
    switchCamera: () => void;
};

const cameraConstraints = (
    facingMode: ProjectCameraFacingMode,
): MediaStreamConstraints => ({
    audio: false,
    video: { facingMode: { ideal: facingMode } },
});

function stopMediaStream(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
}

function getErrorName(error: unknown): string {
    return error instanceof DOMException
        ? error.name
        : typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            typeof error.name === 'string'
          ? error.name
          : '';
}

function shouldRetryWithoutFacingMode(error: unknown): boolean {
    return ['NotFoundError', 'OverconstrainedError'].includes(
        getErrorName(error),
    );
}

export function createProjectCameraError(error: unknown): ProjectCameraError {
    switch (getErrorName(error)) {
        case 'NotAllowedError':
        case 'SecurityError':
            return {
                code: 'permission-denied',
                message:
                    'カメラの利用が許可されませんでした。ブラウザの設定を確認してください。',
                retryable: true,
            };
        case 'NotFoundError':
        case 'OverconstrainedError':
            return {
                code: 'not-found',
                message: '利用可能なカメラが見つかりません。',
                retryable: true,
            };
        case 'NotReadableError':
        case 'AbortError':
            return {
                code: 'in-use',
                message:
                    '他のアプリがカメラを使用しているため起動できません。',
                retryable: true,
            };
        default:
            return {
                code: 'unknown',
                message: 'カメラを起動できませんでした。',
                retryable: true,
            };
    }
}

const unsupportedCameraError: ProjectCameraError = {
    code: 'unsupported',
    message:
        'このブラウザはカメラ撮影に対応していません。HTTPSまたはlocalhostで開いてください。',
    retryable: false,
};

export default function useCameraStream(): ProjectCameraStreamState {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<ProjectCameraError | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [cameraCount, setCameraCount] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const facingModeRef = useRef<ProjectCameraFacingMode>('environment');
    const requestIdRef = useRef(0);
    const isMountedRef = useRef(true);

    const requestCamera = useCallback(
        async (facingMode: ProjectCameraFacingMode) => {
            const requestId = requestIdRef.current + 1;
            requestIdRef.current = requestId;
            stopMediaStream(streamRef.current);
            streamRef.current = null;
            setStream(null);
            setError(null);
            setIsStarting(true);

            const mediaDevices = navigator.mediaDevices;
            const isExplicitlyInsecure =
                typeof window.isSecureContext === 'boolean' &&
                !window.isSecureContext;

            if (
                isExplicitlyInsecure ||
                typeof mediaDevices?.getUserMedia !== 'function'
            ) {
                if (isMountedRef.current && requestIdRef.current === requestId) {
                    setError(unsupportedCameraError);
                    setIsStarting(false);
                }

                return;
            }

            try {
                let nextStream: MediaStream;

                try {
                    nextStream = await mediaDevices.getUserMedia(
                        cameraConstraints(facingMode),
                    );
                } catch (cameraError) {
                    if (!shouldRetryWithoutFacingMode(cameraError)) {
                        throw cameraError;
                    }

                    nextStream = await mediaDevices.getUserMedia({
                        audio: false,
                        video: true,
                    });
                }

                if (
                    !isMountedRef.current ||
                    requestIdRef.current !== requestId
                ) {
                    stopMediaStream(nextStream);

                    return;
                }

                streamRef.current = nextStream;
                facingModeRef.current = facingMode;
                setStream(nextStream);

                if (typeof mediaDevices.enumerateDevices === 'function') {
                    try {
                        const devices = await mediaDevices.enumerateDevices();

                        if (
                            isMountedRef.current &&
                            requestIdRef.current === requestId
                        ) {
                            setCameraCount(
                                devices.filter(
                                    (device) => device.kind === 'videoinput',
                                ).length,
                            );
                        }
                    } catch {
                        if (
                            isMountedRef.current &&
                            requestIdRef.current === requestId
                        ) {
                            setCameraCount(1);
                        }
                    }
                } else if (
                    isMountedRef.current &&
                    requestIdRef.current === requestId
                ) {
                    setCameraCount(1);
                }
            } catch (cameraError) {
                if (isMountedRef.current && requestIdRef.current === requestId) {
                    setError(createProjectCameraError(cameraError));
                }
            } finally {
                if (isMountedRef.current && requestIdRef.current === requestId) {
                    setIsStarting(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        isMountedRef.current = true;
        void requestCamera('environment');

        return () => {
            isMountedRef.current = false;
            requestIdRef.current += 1;
            stopMediaStream(streamRef.current);
            streamRef.current = null;
        };
    }, [requestCamera]);

    const retry = useCallback(() => {
        void requestCamera(facingModeRef.current);
    }, [requestCamera]);

    const switchCamera = useCallback(() => {
        const nextFacingMode =
            facingModeRef.current === 'environment' ? 'user' : 'environment';

        void requestCamera(nextFacingMode);
    }, [requestCamera]);

    return {
        stream,
        error,
        isStarting,
        canSwitchCamera: cameraCount > 1,
        retry,
        switchCamera,
    };
}
