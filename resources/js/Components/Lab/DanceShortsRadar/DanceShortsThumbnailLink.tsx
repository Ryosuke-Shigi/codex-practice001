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
    const containerClassName = [
        'overflow-hidden rounded-lg border border-white/20 bg-slate-950/58',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const thumbnailClassName = [
        'aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.03]',
        mediaClassName,
    ]
        .filter(Boolean)
        .join(' ');

    const thumbnail = thumbnailUrl === null ? (
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
        <img
            src={thumbnailUrl}
            alt={`${title} のサムネイル`}
            loading="lazy"
            className={thumbnailClassName}
        />
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
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border border-white/32 bg-slate-950/70 text-xs font-black text-white shadow-[0_8px_16px_rgba(2,24,45,0.22)]"
            >
                ↗
            </span>
        </a>
    );
}
