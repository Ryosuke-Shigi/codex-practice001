import type { FormEvent } from 'react';

import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import BackgroundTraceEffect from '@/Components/Effects/BackgroundTraceEffect/BackgroundTraceEffect';
import PublicLayout from '@/Layouts/PublicLayout';
import CardsField, {
    type DanceShortsAnalyzerCardSort,
    type DanceShortsAnalyzerCardsFieldProps,
    type DanceShortsAnalyzerVideoCard,
} from './Fields/CardsField';
import SearchField, {
    type DanceShortsAnalyzerSearchFieldProps,
} from './Fields/SearchField';
import SelectedField from './Fields/SelectedField';

type DanceShortsAnalyzerIndexProps = {
    searchField: DanceShortsAnalyzerSearchFieldProps;
    cardsField: DanceShortsAnalyzerCardsFieldProps;
};

const maxSelectedVideos = 5;

export default function DanceShortsAnalyzerIndex({
    searchField,
    cardsField,
}: DanceShortsAnalyzerIndexProps) {
    /*
     * keyword は入力中の値、searchedKeyword は最後にサーバーへ送った値です。
     * 追加取得や並び替えは「検索済み keyword」を使うため、入力中の変更だけで
     * 既存カードを取り直さないように分けています。
     */
    const [keyword, setKeyword] = useState(searchField.keyword);
    const [searchedKeyword, setSearchedKeyword] = useState(searchField.keyword);
    const [videos, setVideos] = useState<DanceShortsAnalyzerVideoCard[]>(
        cardsField.videos,
    );
    const [currentCardsField, setCurrentCardsField] = useState(cardsField);
    const [loading, setLoading] = useState(false);
    const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
    /*
     * 選択状態は youtube_video_id だけで保持します。
     * 追加取得で cards 配列が伸びても、表示に必要な動画情報は現在の videos から
     * 引き直すことで、カード props を別の state に複製しないようにします。
     */
    const selectedVideos = useMemo(
        () =>
            selectedVideoIds
                .map((videoId) =>
                    videos.find((video) => video.youtube_video_id === videoId),
                )
                .filter(
                    (video): video is DanceShortsAnalyzerVideoCard =>
                        video !== undefined,
                ),
        [selectedVideoIds, videos],
    );

    useEffect(() => {
        setKeyword(searchField.keyword);
        setSearchedKeyword(searchField.keyword);
    }, [searchField.keyword]);

    useEffect(() => {
        setCurrentCardsField(cardsField);

        /*
         * 1ページ目の検索、keyword 変更後の検索、sort 変更後の検索ではカードと選択を
         * リセットします。2ページ目以降だけ appendUniqueVideos で末尾追加します。
         */
        if (cardsField.current_page <= 1 || !cardsField.has_searched) {
            setSelectedVideoIds([]);
            setVideos(cardsField.videos);

            return;
        }

        setVideos((currentVideos) => {
            return appendUniqueVideos(currentVideos, cardsField.videos);
        });
    }, [cardsField]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedKeyword = keyword.trim();
        const query =
            normalizedKeyword === ''
                ? {}
                : {
                      keyword: normalizedKeyword,
                      page: 1,
                      sort: currentCardsField.sort,
                  };

        /*
         * keyword 未入力は query を空にして初期表示へ戻します。
         * サーバー側 Action が DB 検索しない ResultDTO を返すため、
         * React 側で全件取得やローカル絞り込みは行いません。
         */
        setSearchedKeyword(normalizedKeyword);
        setSelectedVideoIds([]);
        router.get(searchField.action, query, {
            preserveScroll: true,
            preserveState: false,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    const handleLoadMore = () => {
        if (
            currentCardsField.next_page === null ||
            searchedKeyword.trim() === ''
        ) {
            return;
        }

        /*
         * 「さらに取得」は次ページだけを Inertia で受け取り、useEffect 側で既存カードの
         * 末尾へ追加します。独立ボタンではなく CardsField 末尾のカードとして扱います。
         */
        router.get(
            searchField.action,
            {
                keyword: searchedKeyword.trim(),
                page: currentCardsField.next_page,
                sort: currentCardsField.sort,
            },
            {
                only: ['searchField', 'cardsField'],
                preserveScroll: true,
                preserveState: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleToggleVideo = (youtubeVideoId: string) => {
        /*
         * 選択はカードクリックでトグルし、最大5件を超える追加だけを止めます。
         * YouTube を開く操作は PR1 の検索カードには持たせません。
         */
        setSelectedVideoIds((currentVideoIds) => {
            if (currentVideoIds.includes(youtubeVideoId)) {
                return currentVideoIds.filter(
                    (videoId) => videoId !== youtubeVideoId,
                );
            }

            if (currentVideoIds.length >= maxSelectedVideos) {
                return currentVideoIds;
            }

            return [...currentVideoIds, youtubeVideoId];
        });
    };

    const handleRemoveVideo = (youtubeVideoId: string) => {
        setSelectedVideoIds((currentVideoIds) =>
            currentVideoIds.filter((videoId) => videoId !== youtubeVideoId),
        );
    };

    const handleSortChange = (sort: DanceShortsAnalyzerCardSort) => {
        if (sort === currentCardsField.sort || searchedKeyword.trim() === '') {
            return;
        }

        /*
         * 並び替えは Laravel / Inertia へ sort query を返して 1 ページ目から再取得します。
         * 取得済み cards の並び替えだけで済ませると、未取得ページを含む検索結果全体の
         * 順序にならないため、Repository の orderBy に任せます。
         */
        setSelectedVideoIds([]);
        router.get(
            searchField.action,
            {
                keyword: searchedKeyword.trim(),
                page: 1,
                sort,
            },
            {
                only: ['searchField', 'cardsField'],
                preserveScroll: true,
                preserveState: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <PublicLayout
            effectIntensity="subtle"
            className="overflow-x-hidden bg-slate-950/44 px-3 py-3 sm:px-5"
        >
            <Head title="DanceShortsAnalyzer" />

            <BackgroundTraceEffect />

            <article className="relative z-10 mx-auto flex h-[calc(100dvh-1.5rem)] min-w-0 max-w-6xl flex-col gap-2 overflow-hidden">
                <header className="min-w-0 shrink-0 rounded-lg border border-white/14 bg-white/10 p-2 backdrop-blur-xl sm:p-3">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/78">
                                PRODUCT
                            </p>
                            <h1 className="truncate text-lg font-black text-white sm:text-2xl">
                                DanceShortsAnalyzer
                            </h1>
                        </div>
                        <Link
                            href="/lab"
                            className="inline-flex min-h-10 max-w-[34vw] shrink-0 items-center justify-center rounded-lg border border-blue-100/35 bg-white/10 px-3 text-center text-xs font-bold leading-4 text-blue-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 sm:max-w-none sm:whitespace-nowrap sm:px-4 sm:text-sm"
                        >
                            Labに戻る
                        </Link>
                    </div>
                </header>
                <SelectedField
                    selectedVideos={selectedVideos}
                    maxSelectedVideos={maxSelectedVideos}
                    onRemoveVideo={handleRemoveVideo}
                />
                <SearchField
                    searchField={searchField}
                    keyword={keyword}
                    loading={loading}
                    onKeywordChange={setKeyword}
                    onSubmit={handleSubmit}
                />
                <CardsField
                    cardsField={currentCardsField}
                    videos={videos}
                    loading={loading}
                    selectedVideoIds={selectedVideoIds}
                    maxSelectedVideos={maxSelectedVideos}
                    onToggleVideo={handleToggleVideo}
                    onSortChange={handleSortChange}
                    onLoadMore={handleLoadMore}
                />
            </article>
        </PublicLayout>
    );
}

function appendUniqueVideos(
    currentVideos: DanceShortsAnalyzerVideoCard[],
    nextVideos: DanceShortsAnalyzerVideoCard[],
): DanceShortsAnalyzerVideoCard[] {
    /*
     * 追加取得中の再送やブラウザ戻るで同じページ props が再適用されても、
     * youtube_video_id 単位で重複カードを増やさないようにします。
     */
    const currentVideoIds = new Set(
        currentVideos.map((video) => video.youtube_video_id),
    );
    const uniqueNextVideos = nextVideos.filter(
        (video) => !currentVideoIds.has(video.youtube_video_id),
    );

    return [...currentVideos, ...uniqueNextVideos];
}
