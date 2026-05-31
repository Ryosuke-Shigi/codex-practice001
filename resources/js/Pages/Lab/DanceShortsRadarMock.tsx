import { useMemo, useState } from 'react';

import { Head, Link } from '@inertiajs/react';

import DanceShortsCandidateList from '@/Components/Lab/DanceShortsRadar/DanceShortsCandidateList';
import RegionTabs from '@/Components/Lab/DanceShortsRadar/RegionTabs';
import type {
    DanceShortsCandidate,
    DanceShortsCandidatesByRegion,
    DanceShortsRegion,
    DanceShortsRegionTab,
    DanceShortsRegionTabCode,
} from '@/Components/Lab/DanceShortsRadar/types';
import PublicLayout from '@/Layouts/PublicLayout';

type DanceShortsRadarPageProps = {
    /*
     * regionTabs は画面タブ用の props です。ALL を含みます。
     * ALL は「まとめ」タブの選択値であり、候補データの region としては使いません。
     */
    regionTabs: DanceShortsRegionTab[];
    /*
     * regions は実データ側の地域メタ情報です。こちらは JP / US / KR だけを持ちます。
     * 現時点の画面では regionTabs を表示に使いますが、props 契約として分けておくことで
     * 後続の API / DB 実装時に保存対象地域と UI タブを混同しにくくしています。
     */
    regions: DanceShortsRegion[];
    candidatesByRegion: DanceShortsCandidatesByRegion;
    /*
     * 「まとめ」タブ用の候補一覧です。
     * candidatesByRegion に ALL キーを増やさず、全件表示だけを別 props に分けます。
     */
    allCandidates: DanceShortsCandidate[];
    mockNotice: string;
};

/*
 * Dance Shorts Radar の API 疎通前モック画面です。
 *
 * このページの責務:
 * - Action / Responder から渡されたモック props を受け取る
 * - ALL / JP / US / KR のタブ状態を画面内 state として持つ
 * - 選択タブに対応する候補一覧を表示専用コンポーネントへ渡す
 *
 * このページでやらないこと:
 * - YouTube Data API の呼び出し
 * - DB や snapshot の保存・取得
 * - view_diff / views_per_hour の本計算
 * - 候補カード内での並び替え
 *
 * 並び替え済みの候補を props として受ける構成にしておくことで、後続で API / DB 実装へ
 * 差し替えるときも、React 側は「受け取った候補を表示する」責務に寄せたままにできます。
 */
export default function DanceShortsRadarPage({
    regionTabs,
    candidatesByRegion,
    allCandidates,
    mockNotice,
}: DanceShortsRadarPageProps) {
    /*
     * 初期タブは props の先頭に合わせます。
     * Action 側で regionTabs の先頭を ALL にしているため、初期表示は「まとめ」になります。
     */
    const initialTab = regionTabs[0]?.code ?? 'ALL';
    const [selectedTab, setSelectedTab] =
        useState<DanceShortsRegionTabCode>(initialTab);

    /*
     * URL query ではなくタブのローカル state だけで切り替えます。
     * 今回は API 疎通前の見た目確認が目的なので、検索条件の永続化やサーバー再取得はまだ入れません。
     */
    const selectedTabDefinition = useMemo(
        () =>
            regionTabs.find((regionTab) => regionTab.code === selectedTab) ??
            regionTabs[0],
        [regionTabs, selectedTab],
    );
    /*
     * ALL は実データの地域コードではないため candidatesByRegion には含めません。
     * Page では ALL のときだけ allCandidates を選び、地域別タブでは JP / US / KR の配列を取り出します。
     * どちらも Action 側で表示順にしてあるため、カードや一覧コンポーネントへ sort 処理を漏らしません。
     */
    const selectedCandidates =
        selectedTab === 'ALL'
            ? allCandidates
            : candidatesByRegion[selectedTab] ?? [];

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Dance Shorts Radar Mock" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 pb-10">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-950/70">
                            Dance Shorts Radar
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.34)] sm:text-4xl">
                            伸びている候補モック
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-50/88 drop-shadow-[0_8px_20px_rgba(3,25,48,0.22)]">
                            まとめ / 日本 / アメリカ / 韓国 のタブで、ダンスShorts候補の見え方を確認するための画面です。実際の伸び判定やYouTube Data API接続はまだ行いません。
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-md border border-amber-100/38 bg-amber-100/16 px-3 py-1.5 text-xs font-bold text-amber-50 backdrop-blur-xl">
                            モックデータ
                        </span>
                        <Link
                            href="/lab"
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/35 bg-white/16 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/26 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            Labへ戻る
                        </Link>
                    </div>
                </header>

                <section className="grid gap-4 rounded-lg border border-white/22 bg-slate-950/36 p-4 text-white shadow-[0_18px_38px_rgba(2,24,45,0.16)] backdrop-blur-xl lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/62">
                            確認範囲
                        </p>
                        <p className="mt-2 text-sm leading-7 text-cyan-50/84">
                            {mockNotice}
                            前回の視聴数、視聴数の増加数、1時間あたりの視聴増加数は仮データとして扱い、本計算は次工程で確認します。
                        </p>
                    </div>
                    <div className="grid content-start gap-2 text-sm text-cyan-50/78">
                        <p>
                            表示順は、1時間あたりの視聴増加数、視聴数の増加数、現在の視聴数、いいね数の順に比較しています。
                        </p>
                        <p>
                            候補として眺めるための画面であり、流行や成果を断定するものではありません。
                        </p>
                    </div>
                </section>

                <RegionTabs
                    tabs={regionTabs}
                    selectedTab={selectedTab}
                    onSelectTab={setSelectedTab}
                />

                {selectedTabDefinition && (
                    <DanceShortsCandidateList
                        regionTab={selectedTabDefinition}
                        candidates={selectedCandidates}
                    />
                )}
            </div>
        </PublicLayout>
    );
}
