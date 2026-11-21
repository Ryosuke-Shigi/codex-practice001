import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import RadarLightTraceEffect from '@/Components/Effects/BackgroundTraceEffect/RadarLightTraceEffect';
import '@/Components/DanceShortsRadar/radarProduct.css';
import DanceShortsDisplayCardField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayCardField';
import DanceShortsDisplayHeaderField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayHeaderField';
import DanceShortsDisplayMessageField from '@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayMessageField';
import RadarConditions from '@/Components/DanceShortsRadar/RadarConditions';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import {
    createDanceShortsDisplaySelectGroups,
    type DanceShortsDisplaySelectGroupKey,
} from '@/Components/Lab/DanceShortsRadar/displaySelectGroups';
import type {
    DanceShortsDisplayCardField as DanceShortsDisplayCardFieldProps,
    DanceShortsDisplayHeaderField as DanceShortsDisplayHeaderFieldProps,
    DanceShortsDisplaySelectField as DanceShortsDisplaySelectFieldProps,
} from '@/Components/Lab/DanceShortsRadar/types';
import PublicLayout from '@/Layouts/PublicLayout';

/**
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

const danceShortsRadarReturn = getStageProjectReturnLink(
    'dance-shorts-radar',
);

/**
 * DanceShortsRadar本番ランキングの Page Component です。
 *
 * 3Field props を Feature Component へ渡し、表示中select groupだけをUI状態として持ちます。
 * DB取得、ランキング計算、snapshot metric の再計算は Laravel 側へ残します。
 */
export default function DanceShortsRadarIndex({
    displaySelectField,
    displayHeaderField,
    displayCardField,
}: DanceShortsRadarIndexProps) {
    const selectGroups = useMemo(
        () => createDanceShortsDisplaySelectGroups(displaySelectField),
        [displaySelectField],
    );
    const [activeSelectGroup, setActiveSelectGroup] =
        useState<DanceShortsDisplaySelectGroupKey>('tab');

    useEffect(() => {
        if (
            selectGroups.some((group) => group.key === activeSelectGroup)
        ) {
            return;
        }

        setActiveSelectGroup('tab');
    }, [activeSelectGroup, selectGroups]);

    return (
        <PublicLayout className="radar-product" withEffect={false}>
            <Head title="Dance Shorts Radar" />

            <RadarLightTraceEffect />

            <main className="radar-product__main">
                <header className="flex shrink-0 items-center justify-between gap-3">
                    <DanceShortsDisplayHeaderField
                        displayHeaderField={displayHeaderField}
                    />
                    <Link
                        href={danceShortsRadarReturn.href}
                        aria-label={danceShortsRadarReturn.ariaLabel}
                        title={danceShortsRadarReturn.title}
                        className="inline-flex min-h-8 shrink-0 items-center rounded-md border border-slate-700/[0.16] bg-white/[0.18] px-2.5 text-xs font-semibold text-slate-800 shadow-[0_8px_18px_rgba(80,105,140,0.1)] backdrop-blur-xl transition hover:bg-white/[0.26] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/[0.45]"
                    >
                        {danceShortsRadarReturn.label}
                    </Link>
                </header>

                <div className="radar-product__workspace">
                    <div className="radar-product__conditions">
                        <RadarConditions
                            selectGroups={selectGroups}
                            activeSelectGroup={activeSelectGroup}
                            onActiveSelectGroupChange={setActiveSelectGroup}
                        />
                        <DanceShortsDisplayMessageField
                            displayMessageField={displayHeaderField}
                            showSortKeyOptions={
                                displaySelectField.showSortKeyOptions
                            }
                        />
                    </div>
                    <div className="radar-product__cards">
                        <DanceShortsDisplayCardField
                            presentation="adopted"
                            displayCardField={displayCardField}
                            windowRequest={{
                                tab: displaySelectField.selectedTab,
                                comparisonDays:
                                    displaySelectField.comparisonDays,
                                sortKey: displaySelectField.sortKey,
                            }}
                            selectGroups={selectGroups}
                            activeSelectGroup={activeSelectGroup}
                        />
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
}
