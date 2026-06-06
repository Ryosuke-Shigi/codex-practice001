import { useEffect, useRef, useState } from 'react';

export type DanceShortsThumbnailDisplayData = {
    title: string;
    thumbnailUrl: string | null;
    youtubeUrl: string | null;
};

type DanceShortsThumbnailLinkProps = DanceShortsThumbnailDisplayData & {
    className?: string;
    mediaClassName?: string;
};

/*
 * title / thumbnailUrl / youtubeUrl は常に同じ時点の表示単位として扱います。
 * 画像だけ先に差し替わるとリンク先とサムネイルがずれるため、3値を1つの data object にまとめます。
 */
export function createDanceShortsThumbnailDisplayData(
    title: string,
    thumbnailUrl: string | null,
    youtubeUrl: string | null,
): DanceShortsThumbnailDisplayData {
    return {
        title,
        thumbnailUrl,
        youtubeUrl,
    };
}

/*
 * 非同期画像読み込みの完了時に、読み込み開始時点と現在要求中の表示単位が同じかを確認します。
 * object identity ではなく値比較にし、同じ props から作り直した data object でも一致扱いにします。
 */
export function areDanceShortsThumbnailDisplayDataEqual(
    left: DanceShortsThumbnailDisplayData | null,
    right: DanceShortsThumbnailDisplayData | null,
): boolean {
    if (left === null || right === null) {
        return left === right;
    }

    return (
        left.title === right.title &&
        left.thumbnailUrl === right.thumbnailUrl &&
        left.youtubeUrl === right.youtubeUrl
    );
}

/*
 * 新しい thumbnailUrl が必要な場合だけ先読み queue を作ります。
 * URL が同じで title / link だけ変わる場合は画像読み込みを待たず、表示単位を即時更新します。
 */
export function shouldQueueDanceShortsThumbnailLoad(
    displayedData: DanceShortsThumbnailDisplayData,
    requestedData: DanceShortsThumbnailDisplayData,
): boolean {
    return (
        requestedData.thumbnailUrl !== null &&
        requestedData.thumbnailUrl !== displayedData.thumbnailUrl
    );
}

/*
 * onLoad / onError / transition 完了の callback が、現在も有効な要求に対応しているかを判定します。
 * 古い画像読み込み結果が後から返ってきても、最新カードのサムネイルやリンクを巻き戻さないための guard です。
 */
export function isDanceShortsThumbnailRequestCurrent(
    candidateData: DanceShortsThumbnailDisplayData | null,
    requestedData: DanceShortsThumbnailDisplayData,
    resolvedData: DanceShortsThumbnailDisplayData,
): boolean {
    return (
        candidateData !== null &&
        areDanceShortsThumbnailDisplayDataEqual(candidateData, requestedData) &&
        areDanceShortsThumbnailDisplayDataEqual(candidateData, resolvedData)
    );
}

export function shouldDisableDanceShortsThumbnailLink(
    crossFadeData: DanceShortsThumbnailDisplayData | null,
): boolean {
    return crossFadeData !== null;
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
    const requestedData = createDanceShortsThumbnailDisplayData(
        title,
        thumbnailUrl,
        youtubeUrl,
    );
    const [displayedData, setDisplayedData] =
        useState<DanceShortsThumbnailDisplayData>(requestedData);
    const [pendingData, setPendingData] =
        useState<DanceShortsThumbnailDisplayData | null>(null);
    const [crossFadeData, setCrossFadeData] =
        useState<DanceShortsThumbnailDisplayData | null>(null);
    const [isCrossFadeVisible, setIsCrossFadeVisible] = useState(false);
    const requestedDataRef =
        useRef<DanceShortsThumbnailDisplayData>(requestedData);
    const pendingDataRef = useRef<DanceShortsThumbnailDisplayData | null>(null);
    const crossFadeDataRef =
        useRef<DanceShortsThumbnailDisplayData | null>(null);

    /*
     * image onLoad や transition callback は、render 時点より後に呼ばれます。
     * ref に最新要求を入れておき、callback 内で stale closure の state を信じないようにします。
     */
    requestedDataRef.current = requestedData;
    pendingDataRef.current = pendingData;
    crossFadeDataRef.current = crossFadeData;

    useEffect(() => {
        const nextData = createDanceShortsThumbnailDisplayData(
            title,
            thumbnailUrl,
            youtubeUrl,
        );

        if (areDanceShortsThumbnailDisplayDataEqual(displayedData, nextData)) {
            setPendingData(null);
            setCrossFadeData(null);
            setIsCrossFadeVisible(false);
            return;
        }

        if (
            crossFadeData !== null &&
            areDanceShortsThumbnailDisplayDataEqual(crossFadeData, nextData)
        ) {
            return;
        }

        if (crossFadeData !== null) {
            setCrossFadeData(null);
            setIsCrossFadeVisible(false);
        }

        if (shouldQueueDanceShortsThumbnailLoad(displayedData, nextData)) {
            /*
             * 画像が変わる場合は、見えているサムネイルとリンクを維持したまま hidden img で先読みします。
             * 読み込み完了後だけ cross-fade に進むことで、壊れた中間状態をユーザーへ見せません。
             */
            setPendingData((current) =>
                areDanceShortsThumbnailDisplayDataEqual(current, nextData)
                    ? current
                    : nextData,
            );
            return;
        }

        setPendingData(null);
        setDisplayedData(nextData);
    }, [crossFadeData, displayedData, thumbnailUrl, title, youtubeUrl]);

    useEffect(() => {
        if (crossFadeData === null) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            setIsCrossFadeVisible(true);
        });

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [crossFadeData]);

    useEffect(() => {
        if (crossFadeData === null || !isCrossFadeVisible) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            finishCrossFade(crossFadeData);
        }, 180);

        return () => window.clearTimeout(timeoutId);
    }, [crossFadeData, isCrossFadeVisible]);

    const commitPendingThumbnail = (
        loadedData: DanceShortsThumbnailDisplayData,
    ) => {
        /*
         * 連続でカードを送った場合、古い hidden img の onLoad が最新要求より後に来ることがあります。
         * pending / requested / loaded がすべて同じ場合だけ cross-fade 対象として採用します。
         */
        if (
            !isDanceShortsThumbnailRequestCurrent(
                pendingDataRef.current,
                requestedDataRef.current,
                loadedData,
            )
        ) {
            return;
        }

        setPendingData(null);
        setCrossFadeData(loadedData);
        setIsCrossFadeVisible(false);
    };
    const discardPendingThumbnail = (
        failedData: DanceShortsThumbnailDisplayData,
    ) => {
        /*
         * 読み込み失敗も現在の pending だけを捨てます。
         * 古い失敗 callback で新しい pending を消さないよう、成功時と同じ guard を使います。
         */
        if (
            !isDanceShortsThumbnailRequestCurrent(
                pendingDataRef.current,
                requestedDataRef.current,
                failedData,
            )
        ) {
            return;
        }

        setPendingData(null);
    };
    function finishCrossFade(finishedData: DanceShortsThumbnailDisplayData) {
        /*
         * transitionEnd と timeout fallback のどちらから呼ばれても、現在の crossFadeData だけを確定します。
         * これにより、次のカードへ移った後の古い fade 完了が displayedData を戻すことを防ぎます。
         */
        if (
            !isDanceShortsThumbnailRequestCurrent(
                crossFadeDataRef.current,
                requestedDataRef.current,
                finishedData,
            )
        ) {
            return;
        }

        setDisplayedData(finishedData);
        setCrossFadeData(null);
        setIsCrossFadeVisible(false);
    }
    const containerClassName = [
        'relative overflow-hidden rounded-lg border border-slate-700/[0.08] bg-white/[0.02]',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const isLinkDisabled = shouldDisableDanceShortsThumbnailLink(crossFadeData);
    const thumbnailFrameClassName =
        'relative aspect-video w-full overflow-hidden bg-white/[0.02]';
    const thumbnailClassName = [
        'h-full w-full object-cover transition-opacity duration-150',
        'opacity-100',
        mediaClassName,
    ]
        .filter(Boolean)
        .join(' ');
    const placeholderClassName = [
        'grid h-full w-full place-items-center bg-slate-900 text-sm font-semibold text-cyan-50/74',
        mediaClassName,
    ]
        .filter(Boolean)
        .join(' ');
    const pendingThumbnailClassName =
        'pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0';
    const crossFadeThumbnailClassName = [
        'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-150',
        isCrossFadeVisible ? 'opacity-100' : 'opacity-0',
    ].join(' ');
    const thumbnail = (
        <div className={thumbnailFrameClassName}>
            {displayedData.thumbnailUrl === null ? (
                <div className={placeholderClassName}>No Thumbnail</div>
            ) : (
                <img
                    src={displayedData.thumbnailUrl}
                    alt={`${displayedData.title} のサムネイル`}
                    loading="lazy"
                    className={thumbnailClassName}
                />
            )}
            {pendingData?.thumbnailUrl !== null &&
                pendingData?.thumbnailUrl !== undefined && (
                    <img
                        key={`${pendingData.thumbnailUrl}-${pendingData.youtubeUrl ?? ''}`}
                        src={pendingData.thumbnailUrl}
                        alt=""
                        aria-hidden="true"
                        loading="eager"
                        onLoad={() => commitPendingThumbnail(pendingData)}
                        onError={() => discardPendingThumbnail(pendingData)}
                        className={pendingThumbnailClassName}
                    />
                )}
            {crossFadeData?.thumbnailUrl !== null &&
                crossFadeData?.thumbnailUrl !== undefined && (
                    <img
                        src={crossFadeData.thumbnailUrl}
                        alt=""
                        aria-hidden="true"
                        loading="eager"
                        onTransitionEnd={() => finishCrossFade(crossFadeData)}
                        className={crossFadeThumbnailClassName}
                    />
                )}
        </div>
    );

    if (displayedData.youtubeUrl === null) {
        return (
            <div
                aria-label={`${displayedData.title} のサムネイル`}
                className={containerClassName}
            >
                {thumbnail}
            </div>
        );
    }

    return (
        <a
            href={isLinkDisabled ? undefined : displayedData.youtubeUrl}
            target={isLinkDisabled ? undefined : '_blank'}
            rel={isLinkDisabled ? undefined : 'noopener noreferrer'}
            aria-disabled={isLinkDisabled ? true : undefined}
            aria-label={`${displayedData.title}をYouTubeで開く`}
            tabIndex={isLinkDisabled ? -1 : undefined}
            className={[
                'group relative block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/40',
                isLinkDisabled ? 'cursor-default' : '',
                containerClassName,
            ].join(' ')}
        >
            {thumbnail}
            {!isLinkDisabled && (
                <span
                    aria-hidden="true"
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border border-slate-700/[0.1] bg-white/[0.08] text-xs font-black text-slate-800 shadow-[0_8px_16px_rgba(80,105,140,0.08)]"
                >
                    ↗
                </span>
            )}
        </a>
    );
}
