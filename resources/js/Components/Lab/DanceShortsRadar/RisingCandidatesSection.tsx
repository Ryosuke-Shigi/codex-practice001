import EmptyDisplayCardField from './Cards/EmptyDisplayCardField';
import DanceShortsRisingCandidateCard from './DanceShortsRisingCandidateCard';
import type {
    DanceShortsAggregationPeriod,
    DanceShortsRisingCandidate,
} from './types';

type RisingCandidatesSectionProps = {
    periodLabel: DanceShortsAggregationPeriod;
    candidates: DanceShortsRisingCandidate[];
    emptyMessage?: string;
};

/*
 * 上昇候補タブの表示領域です。
 *
 * 説明文、選択中の集計期間ラベル、上昇候補カード一覧を表示します。
 * 候補判定や実データ集計は行わず、受け取った candidates をそのまま描画します。
 *
 * このセクションは「上昇候補とは何か」をユーザーへ説明する表示責務を持ちます。
 * 一方で、どの動画を上昇候補とみなすか、期間ごとの数値をどう集計するかは将来の
 * Action / Service / Repository 側の責務になるため、ここでは props の配列を信頼して描画するだけにします。
 */
export default function RisingCandidatesSection({
    periodLabel,
    candidates,
    emptyMessage,
}: RisingCandidatesSectionProps) {
    return (
        <section
            id="dance-shorts-panel-RISING"
            role="tabpanel"
            aria-labelledby="dance-shorts-tab-RISING"
            className="grid gap-4"
        >
            <div className="grid gap-3 rounded-lg border border-white/22 bg-slate-950/36 p-4 text-white shadow-[0_14px_30px_rgba(2,24,45,0.16)] backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div>
                    {/*
                        上昇候補は日本での反応を確約するものではなく、公開指標から見た観測優先度です。
                        見出しと説明文も、兆候や候補としての扱いに留め、成果や反応を確約する表現を避けます。
                    */}
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/64">
                        上昇候補
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                        海外先行で伸びている候補
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/78">
                        韓国・アメリカなど海外で伸びている兆候があり、日本ではまだ伸びきっていない可能性がある動画を、優先観測候補として表示します。
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/72">
                        公開指標から見た観測候補であり、実際の成果や日本での反応を断定するものではありません。
                    </p>
                </div>

                <div className="grid gap-2 text-sm text-cyan-50/78 lg:min-w-56">
                    {/*
                        ユーザー要望に合わせて「集計期間」「選択中」の補助文言は表示しません。
                        ただし periodLabel 自体は残し、期間ボタンで選ばれた値がセクション側にも反映されることを示します。
                    */}
                    <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                        {periodLabel}
                    </span>
                    <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                        {candidates.length}件
                    </span>
                </div>
            </div>

            {candidates.length === 0 ? (
                <EmptyDisplayCardField
                    message={
                        emptyMessage ??
                        '表示できる上昇候補はまだありません。'
                    }
                />
            ) : (
                <div className="grid gap-4">
                    {candidates.map((candidate, index) => (
                    /*
                     * 上昇候補カードは既存の地域別カードとは別にしています。
                     * 地域別カードは現在視聴数や前回視聴数を見せるランキング表示、
                     * こちらは海外先行の兆候と日本側の観測状態を見せる表示なので、props の意味を混ぜないためです。
                     */
                    <DanceShortsRisingCandidateCard
                        key={`${candidate.source_region}-${candidate.youtube_url}`}
                        title={candidate.title}
                        sourceRegion={candidate.source_region}
                        sourceRegionLabel={candidate.source_region_label}
                        japanStatus={candidate.japan_status}
                        viewCountDelta={candidate.view_count_delta}
                        viewGrowthRate={candidate.view_growth_rate}
                        japanViewCountDelta={
                            candidate.japan_view_count_delta ?? null
                        }
                        thumbnailUrl={candidate.thumbnail_url}
                        youtubeUrl={candidate.youtube_url}
                        tags={candidate.tags}
                        observationNote={candidate.observation_note}
                        index={index}
                    />
                    ))}
                </div>
            )}
        </section>
    );
}
