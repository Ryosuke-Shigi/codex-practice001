import { Head, Link } from '@inertiajs/react';

import DanceShortsDisplayCardField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayCardField';
import DanceShortsDisplayHeaderField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayHeaderField';
import DanceShortsDisplaySelectField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplaySelectField';
import type {
    DanceShortsDisplayCardField as DanceShortsDisplayCardFieldProps,
    DanceShortsDisplayHeaderField as DanceShortsDisplayHeaderFieldProps,
    DanceShortsDisplaySelectField as DanceShortsDisplaySelectFieldProps,
} from '@/Components/Lab/DanceShortsRadar/types';
import PublicLayout from '@/Layouts/PublicLayout';

/*
 * DanceShortsRadar の通常ランキング本画面です。
 *
 * 本データ用 Responder が、操作 UI / 状態説明 / カード表示を 3Field の props shape へ
 * 変換して渡します。この Page は受け取った Field を順に表示し、
 * DB 取得や snapshot metric の再計算は行いません。
 */
type DanceShortsRadarIndexProps = {
    displaySelectField: DanceShortsDisplaySelectFieldProps;
    displayHeaderField: DanceShortsDisplayHeaderFieldProps;
    displayCardField: DanceShortsDisplayCardFieldProps;
};

export default function DanceShortsRadarIndex({
    displaySelectField,
    displayHeaderField,
    displayCardField,
}: DanceShortsRadarIndexProps) {
    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Dance Shorts Radar" />

            <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 pb-10">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-emerald-50/72">
                            Dance Shorts Radar
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                            通常ランキング
                        </h1>
                    </div>
                    <Link
                        href="/lab"
                        className="inline-flex min-h-10 items-center rounded-md border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                    >
                        Labへ戻る
                    </Link>
                </header>

                <DanceShortsDisplaySelectField
                    displaySelectField={displaySelectField}
                />
                <DanceShortsDisplayHeaderField
                    displayHeaderField={displayHeaderField}
                />
                <DanceShortsDisplayCardField
                    displayCardField={displayCardField}
                    windowRequest={{
                        tab: displaySelectField.selectedTab,
                        comparisonDays: displaySelectField.comparisonDays,
                        sortKey: displaySelectField.sortKey,
                    }}
                />
            </main>
        </PublicLayout>
    );
}
