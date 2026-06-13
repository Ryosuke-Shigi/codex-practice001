/**
 * DanceShortsRadar MOCK の snapshot 観測一覧テーブル Component です。
 *
 * 初回/最新観測 props を表示するだけにし、ランキング差分や views_per_hour の計算とは分けます。
 */
import type {
    DanceShortsRegionCode,
    DanceShortsSnapshotObservation,
} from './types';

type SnapshotObservationTableProps = {
    title: string;
    description: string;
    observations: DanceShortsSnapshotObservation[];
};

const regionLabels = {
    JP: '日本',
    US: 'アメリカ',
    KR: '韓国',
} satisfies Record<DanceShortsRegionCode, string>;

const numberFormatter = new Intl.NumberFormat('ja-JP');

function formatNumber(value: number) {
    return numberFormatter.format(value);
}

/*
 * 初回観測一覧 / 最新観測一覧で共通利用するテーブル表示です。
 *
 * この一覧は snapshot の現在状態を表示するだけに限定し、通常ランキングの比較指標は持ち込みません。
 * 受け取った rows をそのまま描画し、DB判断、ランキング判断、差分計算は行わない表示コンポーネントです。
 *
 * columns はユーザーが snapshot 一覧仕様として確認したい最小項目に固定しています。
 * 「状態」列は初回観測と最新観測の文脈を明示するための表示ラベルであり、ここで active/inactive などの
 * tracking_status 判定を行うものではありません。将来本データに接続するときも、その判断は Service / Query 側で
 * 整えられた props を受け取る前提にして、テーブルは表示責務だけを保ちます。
 */
export default function SnapshotObservationTable({
    title,
    description,
    observations,
}: SnapshotObservationTableProps) {
    return (
        <section className="grid gap-4 text-white">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/64">
                        Snapshot List
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                        {title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50/78">
                        {description}
                    </p>
                </div>
                <span className="rounded-md border border-white/22 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50">
                    {observations.length}件
                </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/22 bg-slate-950/44 shadow-[0_18px_36px_rgba(2,24,45,0.18)] backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                        <thead className="bg-white/10 text-xs font-bold uppercase tracking-[0.12em] text-cyan-50/72">
                            <tr>
                                <th scope="col" className="px-4 py-3">
                                    地域
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    キーワード
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    タイトル
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    チャンネル
                                </th>
                                <th scope="col" className="px-4 py-3 text-right">
                                    視聴数
                                </th>
                                <th scope="col" className="px-4 py-3 text-right">
                                    いいね数
                                </th>
                                <th scope="col" className="px-4 py-3 text-right">
                                    コメント数
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    公開日
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    観測日時
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    状態
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {observations.map((observation) => (
                                <tr
                                    key={`${observation.region}-${observation.title}-${observation.observed_at}`}
                                    className="text-cyan-50/78"
                                >
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">
                                        {regionLabels[observation.region]}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {observation.keyword}
                                    </td>
                                    <td className="min-w-60 px-4 py-3 font-semibold leading-6 text-white">
                                        {observation.title}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {observation.channel_title}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-white">
                                        {formatNumber(observation.view_count)}回
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                        {formatNumber(observation.like_count)}件
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                        {formatNumber(observation.comment_count)}
                                        件
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {observation.published_at}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {observation.observed_at}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        <span className="rounded-md border border-cyan-100/20 bg-cyan-100/10 px-2.5 py-1 text-xs font-bold text-cyan-50">
                                            {observation.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
