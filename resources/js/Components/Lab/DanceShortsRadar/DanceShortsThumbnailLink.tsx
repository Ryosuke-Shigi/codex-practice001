import { useEffect, useState } from 'react';

type DanceShortsThumbnailLinkProps = {
    title: string;
    thumbnailUrl: string | null;
    youtubeUrl: string | null;
    className?: string;
    mediaClassName?: string;
};

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
    const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(
        thumbnailUrl,
    );
    const [previousThumbnailUrl, setPreviousThumbnailUrl] = useState<
        string | null
    >(null);
    const [isCurrentThumbnailLoaded, setIsCurrentThumbnailLoaded] = useState(
        thumbnailUrl === null,
    );
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

    useEffect(() => {
        if (thumbnailUrl === currentThumbnailUrl) {
            return;
        }

        setPreviousThumbnailUrl((currentPreviousThumbnailUrl) =>
            isCurrentThumbnailLoaded
                ? currentThumbnailUrl
                : currentPreviousThumbnailUrl,
        );
        setCurrentThumbnailUrl(thumbnailUrl);
        setIsCurrentThumbnailLoaded(thumbnailUrl === null);
    }, [currentThumbnailUrl, isCurrentThumbnailLoaded, thumbnailUrl]);

    useEffect(() => {
        if (!isCurrentThumbnailLoaded || previousThumbnailUrl === null) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setPreviousThumbnailUrl(null);
        }, 180);

        return () => window.clearTimeout(timeoutId);
    }, [isCurrentThumbnailLoaded, previousThumbnailUrl]);

    const thumbnail = currentThumbnailUrl === null ? (
        <div
            className={[
                'grid aspect-video w-full place-items-center bg-slate-900 text-sm font-semibold text-cyan-50/74',
                mediaClassName,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            No Thumbnail
        </div>
    ) : (
        <div className="relative aspect-video w-full overflow-hidden">
            {previousThumbnailUrl !== null &&
                previousThumbnailUrl !== currentThumbnailUrl && (
                    <img
                        src={previousThumbnailUrl}
                        alt=""
                        aria-hidden="true"
                        className={[
                            'absolute inset-0 h-full w-full object-cover transition-opacity duration-150',
                            isCurrentThumbnailLoaded
                                ? 'opacity-0'
                                : 'opacity-100',
                        ].join(' ')}
                    />
                )}
            <img
                src={currentThumbnailUrl}
                alt={`${title} のサムネイル`}
                loading="lazy"
                onLoad={() => setIsCurrentThumbnailLoaded(true)}
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
