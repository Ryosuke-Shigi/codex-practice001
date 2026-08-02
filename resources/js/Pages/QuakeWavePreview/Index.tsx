/**
 * QuakeWave Preview の開発確認入口 Page Component です。
 *
 * XML / map / sync status への導線と同期パネルを組み立て、polling と reload は専用 Hook に委譲します。
 */
import { Head, Link } from '@inertiajs/react';

import EarthquakePin from '@/Components/JapanQuakeWaveMap/EarthquakePin';
import EarthquakeRipple from '@/Components/JapanQuakeWaveMap/EarthquakeRipple';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';
import { useQuakeWavePreviewSync } from '@/Pages/QuakeWavePreview/hooks/useQuakeWavePreviewSync';
import type { QuakeWavePreviewIndexProps } from '@/Pages/QuakeWavePreview/types';
import {
    statusClassName,
    syncBadgeClassName,
    valueOrDash,
} from '@/Pages/QuakeWavePreview/utils/quakeSyncStatus';

const quakeWaveMapReturn = getStageProjectReturnLink(
    'japan-quake-wave-map',
);

export default function Index({
    mocks,
    visualPreview,
    savedFeedEntries,
    feedEntrySyncStatus: initialFeedEntrySyncStatus,
    feedEntrySyncRuns,
    savedMapPins,
    mapPinSyncStatus: initialMapPinSyncStatus,
    mapPinSyncRuns,
}: QuakeWavePreviewIndexProps) {
    /*
     * QuakeWave Preview は API Preview と同じく「本実装前の確認入口」です。
     * MAP / XML preview の既存導線には触らず、同期開始と polling は hook へ寄せます。
     */
    const mapMock = mocks.find((mock) => mock.id === 'map-display') ?? mocks[0];
    const xmlMock = mocks.find((mock) => mock.id === 'xml-preview');
    const { feedEntrySync, mapPinSync } = useQuakeWavePreviewSync({
        initialFeedEntrySyncStatus,
        feedEntrySyncRuns,
        initialMapPinSyncStatus,
        mapPinSyncRuns,
    });
    const {
        latestVisibleStatus: latestVisibleSyncStatus,
        isButtonDisabled: isFeedEntrySyncButtonDisabled,
        message: feedEntrySyncMessage,
        startSync: startFeedEntrySync,
    } = feedEntrySync;
    const {
        latestVisibleStatus: latestVisibleMapPinSyncStatus,
        isButtonDisabled: isMapPinSyncButtonDisabled,
        message: mapPinSyncMessage,
        startSync: startMapPinSync,
    } = mapPinSync;

    return (
        <PublicLayout className="bg-slate-950/55 px-4 py-6 sm:px-6 lg:px-8">
            <Head title="QuakeWave Preview" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 py-4">
                <header className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                            Development Tool
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            QuakeWave Preview
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                            地震波可視化 UI を、本実装・API 接続・DB 保存に入る前に画面単位で確認するための入口です。
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={startFeedEntrySync}
                            disabled={isFeedEntrySyncButtonDisabled}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-100/15 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/22 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isFeedEntrySyncButtonDisabled ? '取込中' : '地震feed取込'}
                        </button>
                        <button
                            type="button"
                            onClick={startMapPinSync}
                            disabled={isMapPinSyncButtonDisabled}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-100/35 bg-emerald-100/15 px-4 text-sm font-bold text-emerald-50 transition hover:bg-emerald-100/22 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isMapPinSyncButtonDisabled ? '生成中' : '地図ピン生成'}
                        </button>
                        <Link
                            href={quakeWaveMapReturn.href}
                            aria-label={quakeWaveMapReturn.ariaLabel}
                            title={quakeWaveMapReturn.title}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                        >
                            {quakeWaveMapReturn.label}
                        </Link>
                    </div>
                </header>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <article className="rounded-lg border border-cyan-100/25 bg-cyan-100/8 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${syncBadgeClassName(latestVisibleSyncStatus?.status ?? null)}`}>
                                    {latestVisibleSyncStatus?.status ?? 'idle'}
                                </span>
                                <h2 className="mt-3 text-xl font-semibold text-white">
                                    地震feed取込
                                </h2>
                            </div>
                            <span className="rounded-md border border-white/15 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                Queue
                            </span>
                        </div>

                        <p role="status" aria-live="polite" className="mt-4 text-sm font-semibold leading-6 text-cyan-50">
                            {feedEntrySyncMessage}
                        </p>

                        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Total</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.totalCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Inserted</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.insertedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Updated</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.updatedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Skipped</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.skippedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Failed</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.failedCount ?? 0}</dd>
                            </div>
                        </dl>

                        {latestVisibleSyncStatus?.errorMessage && (
                            <p className="mt-4 rounded-md border border-rose-200/35 bg-rose-200/10 px-3 py-2 text-sm leading-6 text-rose-50">
                                {latestVisibleSyncStatus.errorMessage}
                            </p>
                        )}

                        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm leading-6 sm:grid-cols-2">
                            <div>
                                <dt className="font-semibold text-slate-300/70">startedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleSyncStatus?.startedAt)}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-300/70">finishedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleSyncStatus?.finishedAt)}</dd>
                            </div>
                        </dl>
                    </article>

                    <section className="rounded-lg border border-white/15 bg-slate-950/70 shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                            <h2 className="text-xl font-semibold text-white">
                                保存済みentry
                            </h2>
                            <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                {savedFeedEntries.length}件
                            </span>
                        </div>

                        <div className="max-h-[420px] divide-y divide-white/10 overflow-y-auto">
                            {savedFeedEntries.length > 0 ? (
                                savedFeedEntries.map((entry) => (
                                    <article key={entry.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">
                                                {entry.title}
                                            </h3>
                                            <p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-50/78">
                                                {entry.entryId}
                                            </p>
                                        </div>
                                        <dl className="grid grid-cols-1 gap-2 text-sm leading-6 sm:grid-cols-2">
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">updated</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(entry.updatedAtFromFeed)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">published</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(entry.publishedAtFromFeed)}</dd>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <dt className="font-semibold text-slate-300/70">xmlUrl</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(entry.xmlUrl)}</dd>
                                            </div>
                                        </dl>
                                    </article>
                                ))
                            ) : (
                                <p className="px-5 py-8 text-sm leading-6 text-slate-200/75">
                                    保存済みentryはありません。
                                </p>
                            )}
                        </div>
                    </section>
                </section>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <article className="rounded-lg border border-emerald-100/25 bg-emerald-100/8 p-5 shadow-[0_18px_40px_rgba(16,185,129,0.12)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${syncBadgeClassName(latestVisibleMapPinSyncStatus?.status ?? null)}`}>
                                    {latestVisibleMapPinSyncStatus?.status ?? 'idle'}
                                </span>
                                <h2 className="mt-3 text-xl font-semibold text-white">
                                    地図ピン生成
                                </h2>
                            </div>
                            <span className="rounded-md border border-white/15 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                Queue
                            </span>
                        </div>

                        <p role="status" aria-live="polite" className="mt-4 text-sm font-semibold leading-6 text-emerald-50">
                            {mapPinSyncMessage}
                        </p>

                        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Total</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.totalCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Inserted</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.insertedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Updated</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.updatedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Skipped</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.skippedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Failed</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.failedCount ?? 0}</dd>
                            </div>
                        </dl>

                        {latestVisibleMapPinSyncStatus?.errorMessage && (
                            <p className="mt-4 rounded-md border border-rose-200/35 bg-rose-200/10 px-3 py-2 text-sm leading-6 text-rose-50">
                                {latestVisibleMapPinSyncStatus.errorMessage}
                            </p>
                        )}

                        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm leading-6 sm:grid-cols-2">
                            <div>
                                <dt className="font-semibold text-slate-300/70">startedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleMapPinSyncStatus?.startedAt)}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-300/70">finishedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleMapPinSyncStatus?.finishedAt)}</dd>
                            </div>
                        </dl>
                    </article>

                    <section className="rounded-lg border border-white/15 bg-slate-950/70 shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                            <h2 className="text-xl font-semibold text-white">
                                保存済みmap pin
                            </h2>
                            <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                {savedMapPins.length}件
                            </span>
                        </div>

                        <div className="max-h-[420px] divide-y divide-white/10 overflow-y-auto">
                            {savedMapPins.length > 0 ? (
                                savedMapPins.map((pin) => (
                                    <article key={pin.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">
                                                {valueOrDash(pin.title)}
                                            </h3>
                                            <p className="mt-2 break-all font-mono text-xs leading-5 text-emerald-50/78">
                                                {valueOrDash(pin.eventId)}
                                            </p>
                                        </div>
                                        <dl className="grid grid-cols-1 gap-2 text-sm leading-6 sm:grid-cols-2">
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">area</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.areaName)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">maxIntensity</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.maxIntensity)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">lat / lng</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.latitude)} / {valueOrDash(pin.longitude)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">reported</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.reportedAt)}</dd>
                                            </div>
                                        </dl>
                                    </article>
                                ))
                            ) : (
                                <p className="px-5 py-8 text-sm leading-6 text-slate-200/75">
                                    保存済みmap pinはありません。
                                </p>
                            )}
                        </div>
                    </section>
                </section>

                {/*
                    OBENTO 構造は「主役の大きい区画」と部品確認を同じ入口で見せるための
                    開発用レイアウトです。予定だけのカードは置かず、今確認できるものだけを並べます。
                */}
                <section className="grid grid-cols-1 gap-3 md:grid-cols-6 xl:grid-cols-12">
                    {mapMock && (
                        <Link
                            href={mapMock.href}
                            className="group flex min-h-[300px] flex-col justify-between rounded-lg border border-cyan-100/35 bg-cyan-100/10 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)] transition hover:border-cyan-100/70 hover:bg-cyan-100/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 md:col-span-6 xl:col-span-7 xl:row-span-2"
                        >
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(mapMock.status)}`}>
                                        {mapMock.status}
                                    </span>
                                    <span className="rounded-md border border-cyan-100/30 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                                        Primary
                                    </span>
                                </div>
                                <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                                    {mapMock.title}
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/85">
                                    {mapMock.summary}
                                </p>
                            </div>
                            <span className="mt-8 text-sm font-bold text-cyan-100 transition group-hover:text-white">
                                モックを開く
                            </span>
                        </Link>
                    )}

                    {xmlMock && (
                        <Link
                            href={xmlMock.href}
                            className="group flex min-h-[144px] flex-col justify-between rounded-lg border border-emerald-200/30 bg-emerald-200/10 p-4 transition hover:border-emerald-100/60 hover:bg-emerald-200/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 md:col-span-3 xl:col-span-5"
                        >
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(xmlMock.status)}`}>
                                        {xmlMock.status}
                                    </span>
                                    <span className="rounded-md border border-emerald-100/30 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                                        Atom feed
                                    </span>
                                </div>
                                <h3 className="mt-3 text-lg font-semibold text-white">
                                    {xmlMock.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-200/80">
                                    {xmlMock.summary}
                                </p>
                            </div>
                            <span className="mt-4 text-sm font-bold text-emerald-100 transition group-hover:text-white">
                                取得画面を開く
                            </span>
                        </Link>
                    )}

                    <article className="flex min-h-[220px] flex-col rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-3 xl:col-span-5">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                DTO Preview
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                ピン表示
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            Laravel 側 DTO から渡した震度別のピン見本です。地図上への配置はまだ行いません。
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {visualPreview.pins.map((pin) => (
                                <EarthquakePin key={`${pin.label}-${pin.sizeLabel}`} pin={pin} />
                            ))}
                        </div>
                    </article>

                    <article className="flex min-h-[220px] flex-col rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-3 xl:col-span-5">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                DTO Preview
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                波紋レイヤー
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            Laravel 側 DTO から渡した波紋見本です。XML 取得結果や MAP 表示にはまだ接続しません。
                        </p>
                        <div className="mt-5 grid gap-5">
                            {visualPreview.ripples.map((ripple) => (
                                <EarthquakeRipple key={`${ripple.label}-${ripple.ringCount}`} ripple={ripple} />
                            ))}
                        </div>
                    </article>

                </section>
            </div>
        </PublicLayout>
    );
}
