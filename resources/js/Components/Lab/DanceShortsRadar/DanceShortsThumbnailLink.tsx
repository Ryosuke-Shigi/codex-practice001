import { useEffect, useState } from 'react';

export type DanceShortsThumbnailLoadStatus =
    | 'empty'
    | 'loading'
    | 'loaded'
    | 'error';

type DanceShortsThumbnailLinkProps = {
    title: string;
    thumbnailUrl: string | null;
    youtubeUrl: string | null;
    className?: string;
    mediaClassName?: string;
};

type DanceShortsThumbnailLoadState = {
    thumbnailUrl: string | null;
    status: DanceShortsThumbnailLoadStatus;
};

export function initialDanceShortsThumbnailLoadStatus(
    thumbnailUrl: string | null,
): DanceShortsThumbnailLoadStatus {
    return thumbnailUrl === null ? 'empty' : 'loading';
}

export function shouldRenderDanceShortsThumbnailImage(
    thumbnailUrl: string | null,
    status: DanceShortsThumbnailLoadStatus,
): boolean {
    return thumbnailUrl !== null && status !== 'empty' && status !== 'error';
}

/*
 * サムネイルから YouTube を開くための専用コンポーネントです。
 *
 * 外部リンクの仕様をカードから切り出し、target="_blank" と rel="noopener noreferrer" を
 * 必ずセットで扱います。後続でサムネイル画像の取得元が YouTube API 由来になっても、
 * 外部リンクの安全設定はこのコンポーネントだけを見れば確認できます。
 */
export default function DanceShortsThumbnailLink({
    title,
    thumbnailUrl,
    youtubeUrl,
    className,
    mediaClassName,
}: DanceShortsThumbnailLinkProps) {
    const [thumbnailLoadState, setThumbnailLoadState] =
        useState<DanceShortsThumbnailLoadState>(() => ({
            thumbnailUrl,
            status: initialDanceShortsThumbnailLoadStatus(thumbnailUrl),
        }));
    const thumbnailLoadStatus =
        thumbnailLoadState.thumbnailUrl === thumbnailUrl
            ? thumbnailLoadState.status
            : initialDanceShortsThumbnailLoadStatus(thumbnailUrl);
    const shouldRenderThumbnailImage = shouldRenderDanceShortsThumbnailImage(
        thumbnailUrl,
        thumbnailLoadStatus,
    );
    const isCurrentThumbnailLoaded = thumbnailLoadStatus === 'loaded';
    const placeholderClassName = [
        'grid aspect-video w-full place-items-center bg-slate-900 text-sm font-semibold text-cyan-50/74',
        mediaClassName,
    ]
        .filter(Boolean)
        .join(' ');
    const loadingPlaceholderClassName = [
        'absolute inset-0 bg-slate-900 transition-opacity duration-150',
        isCurrentThumbnailLoaded ? 'opacity-0' : 'opacity-100',
    ].join(' ');

    useEffect(() => {
        setThumbnailLoadState({
            thumbnailUrl,
            status: initialDanceShortsThumbnailLoadStatus(thumbnailUrl),
        });
    }, [thumbnailUrl]);

    const markThumbnailLoaded = (loadedThumbnailUrl: string) => {
        setThumbnailLoadState({
            thumbnailUrl: loadedThumbnailUrl,
            status: 'loaded',
        });
    };
    const markThumbnailError = (failedThumbnailUrl: string) => {
        setThumbnailLoadState({
            thumbnailUrl: failedThumbnailUrl,
            status: 'error',
        });
    };
    const containerClassName = [
        'relative overflow-hidden rounded-lg border border-slate-700/[0.08] bg-white/[0.02]',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const thumbnailClassName = [
        'aspect-video w-full object-cover transition-opacity duration-150',
        mediaClassName,
    ]
        .filter(Boolean)
        .join(' ');
    const thumbnail = !shouldRenderThumbnailImage || thumbnailUrl === null ? (
        <div className={placeholderClassName}>No Thumbnail</div>
    ) : (
        <div className="relative aspect-video w-full overflow-hidden">
            <div aria-hidden="true" className={loadingPlaceholderClassName} />
            <img
                key={thumbnailUrl}
                src={thumbnailUrl}
                alt={`${title} のサムネイル`}
                loading="lazy"
                onLoad={() => markThumbnailLoaded(thumbnailUrl)}
                onError={() => markThumbnailError(thumbnailUrl)}
                className={[
                    thumbnailClassName,
                    isCurrentThumbnailLoaded ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
            />
        </div>
    );

    if (youtubeUrl === null) {
        return (
            <div
                aria-label={`${title} のサムネイル`}
                className={containerClassName}
            >
                {thumbnail}
            </div>
        );
    }

    return (
        <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title}をYouTubeで開く`}
            className={[
                'group relative block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40',
                containerClassName,
            ].join(' ')}
        >
            {thumbnail}
            <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border border-slate-700/[0.1] bg-white/[0.08] text-xs font-black text-slate-800 shadow-[0_8px_16px_rgba(80,105,140,0.08)]"
            >
                ↗
            </span>
        </a>
    );
}
