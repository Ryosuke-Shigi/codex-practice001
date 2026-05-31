import { useMemo, useState } from 'react';

import { Head, Link } from '@inertiajs/react';

import DanceShortsCandidateList from '@/Components/Lab/DanceShortsRadar/DanceShortsCandidateList';
import RegionTabs from '@/Components/Lab/DanceShortsRadar/RegionTabs';
import type {
    DanceShortsCandidatesByRegion,
    DanceShortsRegion,
    DanceShortsRegionCode,
} from '@/Components/Lab/DanceShortsRadar/types';
import PublicLayout from '@/Layouts/PublicLayout';

type DanceShortsRadarPageProps = {
    regions: DanceShortsRegion[];
    candidatesByRegion: DanceShortsCandidatesByRegion;
    mockNotice: string;
};

/*
 * Dance Shorts Radar の API 疎通前モック画面です。
 *
 * このページの責務:
 * - Action / Responder から渡されたモック props を受け取る
 * - JP / US / KR の地域タブ状態を画面内 state として持つ
 * - 選択地域に対応する候補一覧を表示専用コンポーネントへ渡す
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
    regions,
    candidatesByRegion,
    mockNotice,
}: DanceShortsRadarPageProps) {
    const initialRegion = regions[0]?.code ?? 'JP';
    const [selectedRegion, setSelectedRegion] =
        useState<DanceShortsRegionCode>(initialRegion);

    /*
     * URL query ではなくタブのローカル state だけで切り替えます。
     * 今回は API 疎通前の見た目確認が目的なので、検索条件の永続化やサーバー再取得はまだ入れません。
     */
    const selectedRegionDefinition = useMemo(
        () =>
            regions.find((region) => region.code === selectedRegion) ??
            regions[0],
        [regions, selectedRegion],
    );
    /*
     * candidatesByRegion は Action 側で地域別・表示順済みにしてあります。
     * Page では選択地域の配列を取り出すだけにし、カードや一覧コンポーネントへ sort 処理を漏らしません。
     */
    const selectedCandidates = candidatesByRegion[selectedRegion] ?? [];

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
                            JP / US / KR の地域タブで、ダンスShorts候補の見え方を確認するための画面です。実際の伸び判定やYouTube Data API接続はまだ行いません。
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
                    regions={regions}
                    selectedRegion={selectedRegion}
                    onSelectRegion={setSelectedRegion}
                />

                {selectedRegionDefinition && (
                    <DanceShortsCandidateList
                        region={selectedRegionDefinition}
                        candidates={selectedCandidates}
                    />
                )}
            </div>
        </PublicLayout>
    );
}
