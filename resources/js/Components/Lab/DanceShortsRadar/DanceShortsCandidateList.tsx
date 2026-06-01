import DanceShortsCandidateCard from './DanceShortsCandidateCard';
import type {
    DanceShortsAggregationPeriod,
    DanceShortsCandidate,
    DanceShortsTab,
} from './types';

type DanceShortsCandidateListProps = {
    regionTab: DanceShortsTab;
    candidates: DanceShortsCandidate[];
    periodLabel: DanceShortsAggregationPeriod;
    emptyMessage?: string;
};

/*
 * 選択タブに対応する候補一覧だけを描画するコンポーネントです。
 *
 * candidates は Page に渡る前の Action 境界で既に表示順へ並んでいます。
 * ここで sort しない理由は、一覧表示コンポーネントを「受け取った候補を順に描く」だけにして、
 * 並び替え仕様をデータ組み立て側のテストで固定できるようにするためです。
 *
 * periodLabel は、期間ボタンの active 状態が一覧側にも反映されていることを示すための表示値です。
 * 現時点では期間によって candidates を再計算しないため、このコンポーネントでも絞り込みや再取得は行いません。
 */
export default function DanceShortsCandidateList({
    regionTab,
    candidates,
    periodLabel,
    emptyMessage,
}: DanceShortsCandidateListProps) {
    /*
     * regionTab.code は ALL の場合もありますが、ここでは aria の対応関係と見出しにだけ使います。
     * 候補カードへ渡す candidate.region は JP / US / KR のままなので、表示用タブ値と実データ地域は混ざりません。
     */
    return (
        <section
            id={`dance-shorts-panel-${regionTab.code}`}
            role="tabpanel"
            aria-labelledby={`dance-shorts-tab-${regionTab.code}`}
            className="grid gap-4"
        >
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/64">
                        {regionTab.label}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                        {regionTab.label}の伸びている候補
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/78">
                        {regionTab.description}を、1時間あたりの視聴増加数が多い順に表示しています。
                    </p>
                </div>
                <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                    {periodLabel}
                </span>
                <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                    {candidates.length}件
                </span>
            </div>

            {candidates.length === 0 ? (
                <section className="rounded-lg border border-white/18 bg-slate-950/36 p-6 text-white shadow-[0_16px_34px_rgba(4,25,42,0.14)] backdrop-blur-xl">
                    <p className="text-sm font-semibold text-cyan-50/78">
                        {emptyMessage ?? '表示できる候補はまだありません。'}
                    </p>
                </section>
            ) : (
                <div className="grid gap-4">
                    {candidates.map((candidate, index) => (
                        /*
                         * 本データでは video_id、モックでは youtube_url を key の中心に使います。
                         * どちらも表示用 props であり、カード内では key の組み立て以外に利用しません。
                         */
                        <DanceShortsCandidateCard
                            key={`${candidate.region}-${candidate.video_id ?? candidate.youtube_url ?? candidate.title}`}
                            candidate={candidate}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
