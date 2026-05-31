type DanceShortsThumbnailLinkProps = {
    title: string;
    thumbnailUrl: string;
    youtubeUrl: string;
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
}: DanceShortsThumbnailLinkProps) {
    return (
        <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} をYouTubeで開く`}
            className="group block overflow-hidden rounded-lg border border-white/20 bg-slate-950/58 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40"
        >
            <img
                src={thumbnailUrl}
                alt={`${title} のサムネイル`}
                loading="lazy"
                className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
        </a>
    );
}
