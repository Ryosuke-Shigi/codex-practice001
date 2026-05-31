import DanceShortsCandidateCard from './DanceShortsCandidateCard';
import type { DanceShortsCandidate, DanceShortsRegionTab } from './types';

type DanceShortsCandidateListProps = {
    regionTab: DanceShortsRegionTab;
    candidates: DanceShortsCandidate[];
};

/*
 * 選択タブに対応する候補一覧だけを描画するコンポーネントです。
 *
 * candidates は Page に渡る前の Action 境界で既に表示順へ並んでいます。
 * ここで sort しない理由は、一覧表示コンポーネントを「受け取った候補を順に描く」だけにして、
 * 並び替え仕様をデータ組み立て側のテストで固定できるようにするためです。
 */
export default function DanceShortsCandidateList({
    regionTab,
    candidates,
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
                    {candidates.length}件
                </span>
            </div>

            <div className="grid gap-4">
                {candidates.map((candidate, index) => (
                    /*
                     * youtube_url は候補ごとの外部リンクとして一意に近い値なので、モック一覧の key に使います。
                     * 本実装で video_id を持つようになったら、ここは video_id 由来の安定 key へ差し替える想定です。
                     */
                    <DanceShortsCandidateCard
                        key={`${candidate.region}-${candidate.youtube_url}`}
                        candidate={candidate}
                        index={index}
                    />
                ))}
            </div>
        </section>
    );
}
