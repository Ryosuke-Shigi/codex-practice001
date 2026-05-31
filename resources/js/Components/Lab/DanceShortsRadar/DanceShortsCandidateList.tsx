import DanceShortsCandidateCard from './DanceShortsCandidateCard';
import type { DanceShortsCandidate, DanceShortsRegion } from './types';

type DanceShortsCandidateListProps = {
    region: DanceShortsRegion;
    candidates: DanceShortsCandidate[];
};

/*
 * 選択地域の候補一覧だけを描画するコンポーネントです。
 *
 * candidates は Page に渡る前の Action 境界で既に表示順へ並んでいます。
 * ここで sort しない理由は、一覧表示コンポーネントを「受け取った候補を順に描く」だけにして、
 * 並び替え仕様をデータ組み立て側のテストで固定できるようにするためです。
 */
export default function DanceShortsCandidateList({
    region,
    candidates,
}: DanceShortsCandidateListProps) {
    return (
        <section
            id={`dance-shorts-panel-${region.code}`}
            role="tabpanel"
            aria-labelledby={`dance-shorts-tab-${region.code}`}
            className="grid gap-4"
        >
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/64">
                        {region.label}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                        {region.label} の伸びている候補
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/78">
                        {region.description}を、1時間あたりの視聴増加数が多い順に表示しています。
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
