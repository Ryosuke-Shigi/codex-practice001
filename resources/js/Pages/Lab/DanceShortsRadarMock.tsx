/**
 * Dance Shorts Radar MOCK の Inertia Page Component です。
 *
 * Laravel から渡された固定候補データを表示し、YouTube API・DB保存・snapshot同期へは接続しません。
 */
import { useMemo, useState } from 'react';

import { Head, Link } from '@inertiajs/react';

import AggregationPeriodButtons from '@/Components/Lab/DanceShortsRadar/AggregationPeriodButtons';
import DanceShortsCandidateList from '@/Components/Lab/DanceShortsRadar/DanceShortsCandidateList';
import RegionTabs from '@/Components/Lab/DanceShortsRadar/RegionTabs';
import RisingCandidatesSection from '@/Components/Lab/DanceShortsRadar/RisingCandidatesSection';
import SnapshotObservationNavigation from '@/Components/Lab/DanceShortsRadar/SnapshotObservationNavigation';
import SnapshotObservationTable from '@/Components/Lab/DanceShortsRadar/SnapshotObservationTable';
import { risingCandidateMockData } from '@/Components/Lab/DanceShortsRadar/risingCandidatesMockData';
import {
    firstSnapshotObservationMockData,
    latestSnapshotObservationMockData,
} from '@/Components/Lab/DanceShortsRadar/snapshotObservationMockData';
import type {
    DanceShortsAggregationPeriod,
    DanceShortsCandidate,
    DanceShortsCandidatesByRegion,
    DanceShortsRegion,
    DanceShortsRegionTab,
    DanceShortsSnapshotObservationKind,
    DanceShortsTab,
    DanceShortsTabCode,
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

const risingCandidatesTab: DanceShortsTab = {
    code: 'RISING',
    label: '上昇候補',
    description: '海外先行で伸びていて、日本ではまだ伸びきっていない可能性がある候補',
};

/*
 * 画面で見せるタブ順の仕様です。
 *
 * Laravel 側の regionTabs は既存モックの都合で ALL / JP / US / KR の順に渡ってきますが、
 * 今回の画面仕様では「上昇候補」を先頭に置き、その直後に「まとめ」を置きます。
 * サーバー側の固定データ順をこの要件だけのために変えると、地域別候補を組み立てる Action の責務まで
 * UI都合で動かすことになるため、表示順の調整は Page 側のタブ定義として扱います。
 */
const tabDisplayOrder: DanceShortsTabCode[] = [
    'RISING',
    'ALL',
    'JP',
    'US',
    'KR',
];

const aggregationPeriods: DanceShortsAggregationPeriod[] = [
    '1日',
    '3日',
    '7日',
    '14日',
    '30日',
];

/*
 * Dance Shorts Radar の API 疎通前モック画面です。
 *
 * このページの責務:
 * - Action / Responder から渡されたモック props を受け取る
 * - 上昇候補 / ALL / JP / US / KR のタブ状態を画面内 state として持つ
 * - 集計期間の選択状態を画面内 state として持つ
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
     * 初期タブは今回追加する「上昇候補」に固定します。
     * regionTabs は既存の地域タブ props として受け取り、画面側で表示順を指定の日本語タブ順へ整えます。
     */
    const [selectedTab, setSelectedTab] =
        useState<DanceShortsTabCode>('RISING');
    const [selectedPeriod, setSelectedPeriod] =
        useState<DanceShortsAggregationPeriod>('7日');
    /*
     * 初回観測一覧 / 最新観測一覧は、通常ランキングのタブではなく「別画面相当の表示モード」として扱います。
     *
     * selectedTab に FIRST / LATEST のような値を足してしまうと、RegionTabs が持つ
     * 「上昇候補 / まとめ / 地域別ランキング候補を切り替える」責務に snapshot 一覧の文脈が混ざります。
     * その結果、previous snapshot の無い初回観測にも集計期間やランキング順位が効いているように見えます。
     *
     * ここでは観測一覧だけを別 state に分け、値が入っている間はランキング系 UI を描画しません。
     * 画面上の見た目は同じ MOCK ページ内の切り替えですが、仕様上は「通常ランキングとは別枠」です。
     */
    const [selectedObservationView, setSelectedObservationView] =
        useState<DanceShortsSnapshotObservationKind | null>(null);

    const displayTabs = useMemo(() => {
        /*
         * regionTabs は Action / Responder から来る既存 props です。
         * ここで Map にしてから tabDisplayOrder に沿って取り出すことで、
         * 「props の受け取り」と「画面上の表示順」を分けます。
         * 上昇候補はまだサーバー由来の実データではないため、この Page 内の固定タブとして追加します。
         */
        const regionTabsByCode = new Map(
            regionTabs.map((regionTab) => [regionTab.code, regionTab]),
        );

        return tabDisplayOrder
            .map((tabCode): DanceShortsTab | null => {
                if (tabCode === 'RISING') {
                    return risingCandidatesTab;
                }

                return regionTabsByCode.get(tabCode) ?? null;
            })
            .filter((tab): tab is DanceShortsTab => tab !== null);
    }, [regionTabs]);

    /*
     * URL query ではなくタブのローカル state だけで切り替えます。
     * 今回は API 疎通前の見た目確認が目的なので、検索条件の永続化やサーバー再取得はまだ入れません。
     */
    const selectedTabDefinition = useMemo(
        () =>
            displayTabs.find((regionTab) => regionTab.code === selectedTab) ??
            displayTabs[0],
        [displayTabs, selectedTab],
    );
    /*
     * ALL は実データの地域コードではないため candidatesByRegion には含めません。
     * Page では ALL のときだけ allCandidates を選び、地域別タブでは JP / US / KR の配列を取り出します。
     * どちらも Action 側で表示順にしてあるため、カードや一覧コンポーネントへ sort 処理を漏らしません。
     * RISING は専用セクションへ固定モックデータを渡すため、地域別 candidate の選択対象には含めません。
     */
    const selectedCandidates =
        selectedTab === 'ALL'
            ? allCandidates
            : selectedTab === 'RISING'
                ? []
                : candidatesByRegion[selectedTab] ?? [];

    const selectedObservationList =
        selectedObservationView === 'first'
            ? {
                  title: '初回観測一覧',
                  description:
                      'previous snapshot がまだ無い動画を、初回取得直後に観測できた一覧として表示します。比較元が無いため、増加量や増加率は表示しません。',
                  observations: firstSnapshotObservationMockData,
              }
            : selectedObservationView === 'latest'
                ? {
                      title: '最新観測一覧',
                      description:
                          '最新 snapshot を持つ動画の現在状態を確認する一覧です。比較ランキングではなく、取得済みの現在値を中心に表示します。',
                      observations: latestSnapshotObservationMockData,
                  }
                : null;

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
                            上昇候補 / まとめ / 日本 / アメリカ / 韓国
                            のタブで、ダンスShorts候補の見え方を確認するための画面です。実際の伸び判定やYouTube
                            Data API接続はまだ行いません。
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
                            候補として眺めるための画面であり、反応や成果を断定するものではありません。
                        </p>
                    </div>
                </section>

                <SnapshotObservationNavigation
                    activeView={selectedObservationView}
                    onOpenFirstObservation={() =>
                        setSelectedObservationView('first')
                    }
                    onOpenLatestObservation={() =>
                        setSelectedObservationView('latest')
                    }
                />

                {selectedObservationList ? (
                    <>
                        {/*
                            観測一覧モードでは RegionTabs / AggregationPeriodButtons を非表示にします。
                            初回観測一覧には comparison period の意味がなく、最新観測一覧も「現在状態の確認」であって
                            view_count_delta / view_growth_rate を比較するランキングではありません。
                            戻るボタンで selectedObservationView を null に戻したときだけ、既存の通常ランキング系 UI を再表示します。
                        */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedObservationView(null)}
                                className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/30 bg-white/12 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                            >
                                比較ランキングへ戻る
                            </button>
                        </div>

                        <SnapshotObservationTable
                            title={selectedObservationList.title}
                            description={selectedObservationList.description}
                            observations={selectedObservationList.observations}
                        />
                    </>
                ) : (
                    <>
                        <RegionTabs
                            tabs={displayTabs}
                            selectedTab={selectedTab}
                            onSelectTab={setSelectedTab}
                        />

                        <AggregationPeriodButtons
                            periods={aggregationPeriods}
                            selectedPeriod={selectedPeriod}
                            onSelectPeriod={setSelectedPeriod}
                        />

                        {/*
                            上昇候補だけは、地域別候補とは表示したい指標が違います。
                            selectedCandidates へ変換して既存一覧に流し込むのではなく、専用セクションへ分けることで、
                            「海外先行の観測候補」と「地域別ランキング候補」の props の意味を混ぜないようにしています。
                        */}
                        {selectedTab === 'RISING' ? (
                            <RisingCandidatesSection
                                periodLabel={selectedPeriod}
                                candidates={risingCandidateMockData}
                            />
                        ) : (
                            selectedTabDefinition && (
                                <DanceShortsCandidateList
                                    regionTab={selectedTabDefinition}
                                    candidates={selectedCandidates}
                                    periodLabel={selectedPeriod}
                                />
                            )
                        )}
                    </>
                )}
            </div>
        </PublicLayout>
    );
}
