import { Head, Link } from '@inertiajs/react';

import DanceShortsDisplayCardField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayCardField';
import DanceShortsDisplayHeaderField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayHeaderField';
import DanceShortsDisplayMessageField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayMessageField';
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
        <PublicLayout className="h-dvh overflow-hidden px-2 py-2 sm:px-3 lg:px-5">
            <Head title="Dance Shorts Radar" />

            <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-1.5 overflow-hidden">
                <header className="flex shrink-0 items-center justify-between gap-3">
                    <DanceShortsDisplayHeaderField
                        displayHeaderField={displayHeaderField}
                    />
                    <Link
                        href="/lab"
                        className="inline-flex min-h-8 shrink-0 items-center rounded-md border border-white/25 bg-white/10 px-2.5 text-xs font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                    >
                        Labへ戻る
                    </Link>
                </header>

                <div className="mx-auto grid min-h-0 w-full max-w-4xl flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-1.5 overflow-hidden">
                    <DanceShortsDisplaySelectField
                        displaySelectField={displaySelectField}
                    />
                    <DanceShortsDisplayMessageField
                        displayMessageField={displayHeaderField}
                    />
                    <DanceShortsDisplayCardField
                        displayCardField={displayCardField}
                        windowRequest={{
                            tab: displaySelectField.selectedTab,
                            comparisonDays: displaySelectField.comparisonDays,
                            sortKey: displaySelectField.sortKey,
                        }}
                    />
                </div>
            </main>
        </PublicLayout>
    );
}
