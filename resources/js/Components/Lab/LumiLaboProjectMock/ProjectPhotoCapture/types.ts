export type ProjectCameraFacingMode = 'environment' | 'user';

export type ProjectCameraErrorCode =
    | 'permission-denied'
    | 'not-found'
    | 'in-use'
    | 'unsupported'
    | 'unknown';

export type ProjectCameraError = {
    code: ProjectCameraErrorCode;
    message: string;
    retryable: boolean;
};

export type ProjectCapturedPhoto = {
    id: string;
    blob: Blob;
    objectUrl: string;
};

export type ProjectPhotoCaptureScreen =
    | { id: 'capture' }
    | { id: 'review' };
