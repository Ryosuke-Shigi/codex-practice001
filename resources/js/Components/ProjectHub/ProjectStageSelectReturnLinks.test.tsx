// @vitest-environment jsdom

import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children?: ReactNode;
        [key: string]: unknown;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: {
        get: vi.fn(),
        post: vi.fn(),
        reload: vi.fn(),
    },
}));

vi.mock('@/Layouts/PublicLayout', () => ({
    default: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@/Hooks/useSwipeNavigation', () => ({
    default: () => undefined,
}));

vi.mock('@/Components/DirectionalNavigationButton', () => ({
    default: () => null,
}));
vi.mock('@/Components/ApiCatalog/ApiCatalogFilterPanel', () => ({
    default: () => null,
}));
vi.mock('@/Components/ApiCatalog/ApiCatalogList', () => ({
    default: () => null,
}));
vi.mock('@/Components/ApiCatalog/ApiCatalogPagination', () => ({
    default: () => null,
}));
vi.mock('@/Pages/ApiCatalog/hooks/useApiCatalogSync', () => ({
    useApiCatalogSync: () => ({
        syncStatus: null,
        isSyncButtonDisabled: false,
        syncMessage: '',
        showSyncResult: false,
        startPoolSync: vi.fn(),
    }),
}));

vi.mock('@/Components/Effects/BackgroundTraceEffect/BackgroundTraceEffect', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayCardField', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayHeaderField', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplayMessageField', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/Fields/DanceShortsDisplaySelectField', () => ({
    default: () => null,
}));
vi.mock('@/Pages/DanceShortsAnalyzer/Fields/CardsField', () => ({
    default: () => null,
}));
vi.mock('@/Pages/DanceShortsAnalyzer/Fields/SearchField', () => ({
    default: () => null,
}));
vi.mock('@/Pages/DanceShortsAnalyzer/Fields/SelectedField', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/AggregationPeriodButtons', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/DanceShortsCandidateList', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/RegionTabs', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/RisingCandidatesSection', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/SnapshotObservationNavigation', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/DanceShortsRadar/SnapshotObservationTable', () => ({
    default: () => null,
}));
vi.mock('@/Components/Common/Visualizations/Charts/EChartsViewer', () => ({
    default: () => null,
}));

vi.mock('@/Components/Lab/PortfolioLpHero', () => ({
    default: ({
        backHref,
        backLabel,
        backAriaLabel,
        backTitle,
    }: {
        backHref: string;
        backLabel: string;
        backAriaLabel: string;
        backTitle: string;
    }) => (
        <a href={backHref} aria-label={backAriaLabel} title={backTitle}>
            {backLabel}
        </a>
    ),
}));
vi.mock('@/Components/Lab/PortfolioLpFeatureGrid', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/PortfolioLpLinkButtons', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/PortfolioLpTechSection', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/PortfolioLpTestSection', () => ({
    default: () => null,
}));

vi.mock('@/Components/JapanQuakeWaveMap/EarthquakePin', () => ({
    default: () => null,
}));
vi.mock('@/Components/JapanQuakeWaveMap/EarthquakeRipple', () => ({
    default: () => null,
}));
vi.mock('@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap', () => ({
    default: () => null,
}));
vi.mock('@/Components/JapanQuakeWaveMap/PinDisplayLimitSlider', () => ({
    default: () => null,
}));
vi.mock('@/Components/JapanQuakeWaveMap/QuakeDateRangeFilter', () => ({
    default: () => null,
}));
vi.mock('@/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter', () => ({
    default: () => null,
}));
vi.mock('@/Pages/QuakeWavePreview/hooks/useQuakeWavePreviewSync', () => ({
    useQuakeWavePreviewSync: () => ({
        feedEntrySync: {
            latestVisibleStatus: null,
            isButtonDisabled: false,
            message: '',
            startSync: vi.fn(),
        },
        mapPinSync: {
            latestVisibleStatus: null,
            isButtonDisabled: false,
            message: '',
            startSync: vi.fn(),
        },
    }),
}));
vi.mock('@/Pages/QuakeWavePreview/hooks/useQuakeMapRefresh', () => ({
    useQuakeMapRefresh: () => ({ refreshAction: undefined }),
}));
vi.mock('@/Pages/QuakeWavePreview/hooks/useVisibleEarthquakePins', () => ({
    useVisibleEarthquakePins: () => ({
        filteredPins: [],
        visiblePins: [],
        selectedIntensities: [],
        setSelectedIntensities: vi.fn(),
        pinDisplayLimit: 10,
        setPinDisplayLimit: vi.fn(),
    }),
}));

vi.mock('@/Components/Lab/LumiLabProjectMock/LumiLabProjectMockView', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/LumiLabProjectIdeaBoard/LumiLabProjectIdeaBoardView', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/ConstructionOrderNewMock/ConstructionOrderNewMockHeader', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/ConstructionOrderNewMock/EntryFormPanel', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/ConstructionOrderNewMock/ProjectDetailPanel', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/ConstructionOrderNewMock/ProjectListPanel', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/ConstructionOrderWorkflowPP/ConstructionOrderIdeaBoardTabs', () => ({
    default: () => null,
}));
vi.mock('@/Components/Lab/EventCardCalendar/EventCardCalendarIdeaBoardView', () => ({
    default: () => null,
}));

import ApiCatalogProduct from '@/Pages/ApiCatalog/Index';
import ApiCatalogMock from '@/Pages/ApiCatalog/MockIndex';
import DanceShortsAnalyzerProduct from '@/Pages/DanceShortsAnalyzer/Index';
import DanceShortsRadarProduct from '@/Pages/DanceShortsRadar/Index';
import ApiDiscoveryHubIdeaBoard from '@/Pages/Lab/ApiDiscoveryHubPp';
import ConstructionOrderMock from '@/Pages/Lab/ConstructionOrderNewMock';
import ConstructionOrderIdeaBoard from '@/Pages/Lab/ConstructionOrderWorkflowPP';
import DanceShortsAnalyzerIdeaBoard from '@/Pages/Lab/DanceShortsAnalyzer';
import DanceShortsAnalyzerMock from '@/Pages/Lab/DanceShortsAnalyzerMock';
import DanceShortsRadarIdeaBoard from '@/Pages/Lab/DanceShortsRadar';
import DanceShortsRadarMock from '@/Pages/Lab/DanceShortsRadarMock';
import EventCardCalendarIdeaBoard from '@/Pages/Lab/EventCardCalendarIdeaBoard';
import LumiLabIdeaBoard from '@/Pages/Lab/LumiLabProjectIdeaBoard';
import LumiLabMock from '@/Pages/Lab/LumiLabProjectMock';
import QuakeWaveMapIdeaBoard from '@/Pages/Lab/QuakeWaveMapPp';
import QuakeWaveMock from '@/Pages/QuakeWavePreview/Index';
import QuakeWaveProduct from '@/Pages/QuakeWavePreview/QuakeWaveMapPage';

type StageReturnCase = {
    stage: string;
    projectName: string;
    projectId: string;
    page: () => ReactNode;
};

const stageReturnCases: StageReturnCase[] = [
    {
        stage: 'API PRODUCT',
        projectName: 'API Discovery Hub',
        projectId: 'api-discovery-hub',
        page: () => (
            <ApiCatalogProduct
                filters={{
                    keyword: null,
                    providerKey: null,
                    domain: null,
                    sortKey: 'updated_desc',
                }}
                providers={[]}
                domains={[]}
                apiCatalogItems={[]}
                pagination={{
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 0,
                    perPage: 20,
                    from: null,
                    to: null,
                }}
                syncStatus={null}
            />
        ),
    },
    {
        stage: 'API MOCK',
        projectName: 'API Discovery Hub',
        projectId: 'api-discovery-hub',
        page: () => <ApiCatalogMock />,
    },
    {
        stage: 'API IDEA BOARD',
        projectName: 'API Discovery Hub',
        projectId: 'api-discovery-hub',
        page: () => <ApiDiscoveryHubIdeaBoard />,
    },
    {
        stage: 'Radar PRODUCT',
        projectName: 'DanceShortsRadar',
        projectId: 'dance-shorts-radar',
        page: () => (
            <DanceShortsRadarProduct
                displaySelectField={{
                    selectedTab: 'RISING',
                    comparisonDays: 1,
                    sortKey: 'views_per_hour',
                    showSortKeyOptions: false,
                    regionTabs: [],
                    comparisonDayOptions: [],
                    sortKeyOptions: [],
                }}
                displayHeaderField={{
                    title: '上昇候補',
                    description: '説明',
                    selectedTabLabel: '上昇候補',
                    comparisonDaysLabel: '1日比較',
                    cardCountLabel: '0件',
                    sortLabel: '上昇候補順',
                }}
                displayCardField={{} as never}
            />
        ),
    },
    {
        stage: 'Radar MOCK',
        projectName: 'DanceShortsRadar',
        projectId: 'dance-shorts-radar',
        page: () => (
            <DanceShortsRadarMock
                regionTabs={[]}
                regions={[]}
                candidatesByRegion={{} as never}
                allCandidates={[]}
                mockNotice="mock"
            />
        ),
    },
    {
        stage: 'Radar IDEA BOARD',
        projectName: 'DanceShortsRadar',
        projectId: 'dance-shorts-radar',
        page: () => <DanceShortsRadarIdeaBoard />,
    },
    {
        stage: 'Analyzer PRODUCT',
        projectName: 'DanceShortsAnalyzer',
        projectId: 'dance-shorts-analyzer',
        page: () => (
            <DanceShortsAnalyzerProduct
                searchField={{
                    keyword: '',
                    action: '/dance-shorts-analyzer',
                    analyze_action: '/dance-shorts-analyzer/analyze',
                    placeholder: 'キーワード',
                    button_label: 'Search',
                }}
                cardsField={{
                    videos: [],
                    empty_message: 'empty',
                    end_message: null,
                    has_searched: false,
                    has_more: false,
                    next_page: null,
                    current_page: 1,
                    per_page: 20,
                    sort: 'published_desc',
                    sort_options: [],
                }}
            />
        ),
    },
    {
        stage: 'Analyzer MOCK',
        projectName: 'DanceShortsAnalyzer',
        projectId: 'dance-shorts-analyzer',
        page: () => <DanceShortsAnalyzerMock />,
    },
    {
        stage: 'Analyzer IDEA BOARD',
        projectName: 'DanceShortsAnalyzer',
        projectId: 'dance-shorts-analyzer',
        page: () => <DanceShortsAnalyzerIdeaBoard />,
    },
    {
        stage: 'Quake PRODUCT',
        projectName: 'Japan Quake Wave Map',
        projectId: 'japan-quake-wave-map',
        page: () => (
            <QuakeWaveProduct
                pins={[]}
                filters={{ startDate: null, endDate: null }}
            />
        ),
    },
    {
        stage: 'Quake MOCK',
        projectName: 'Japan Quake Wave Map',
        projectId: 'japan-quake-wave-map',
        page: () => (
            <QuakeWaveMock
                mocks={[
                    {
                        id: 'map-display',
                        title: 'Map display',
                        summary: 'Map fixture',
                        status: 'ready',
                        href: '/quakewave-preview/map',
                    },
                ]}
                visualPreview={{ pins: [], ripples: [] }}
                savedFeedEntries={[]}
                feedEntrySyncStatus={null}
                feedEntrySyncRuns={[]}
                savedMapPins={[]}
                mapPinSyncStatus={null}
                mapPinSyncRuns={[]}
            />
        ),
    },
    {
        stage: 'Quake IDEA BOARD',
        projectName: 'Japan Quake Wave Map',
        projectId: 'japan-quake-wave-map',
        page: () => <QuakeWaveMapIdeaBoard />,
    },
    {
        stage: 'LumiLab MOCK',
        projectName: 'LumiLab',
        projectId: 'lumilab',
        page: () => <LumiLabMock projectList={{ items: [] }} />,
    },
    {
        stage: 'LumiLab IDEA BOARD',
        projectName: 'LumiLab',
        projectId: 'lumilab',
        page: () => <LumiLabIdeaBoard />,
    },
    {
        stage: 'Construction MOCK',
        projectName: '工事発注管理',
        projectId: 'construction-order',
        page: () => <ConstructionOrderMock />,
    },
    {
        stage: 'Construction IDEA BOARD',
        projectName: '工事発注管理',
        projectId: 'construction-order',
        page: () => <ConstructionOrderIdeaBoard />,
    },
    {
        stage: 'Event IDEA BOARD',
        projectName: 'イベント・カードカレンダー',
        projectId: 'event-card-calendar',
        page: () => <EventCardCalendarIdeaBoard />,
    },
];

describe('Project stage selection return links', () => {
    it.each(stageReturnCases)(
        'keeps the exact return contract for $stage',
        ({ page, projectName, projectId }) => {
            assertStageReturn(
                renderToStaticMarkup(page()),
                projectName,
                projectId,
            );
        },
    );
});

function assertStageReturn(
    markup: string,
    projectName: string,
    projectId: string,
) {
    const label = '戻る';
    const accessibleLabel = `${projectName}の開発段階へ戻る`;
    const href = `/projects?project=${projectId}&view=stages`;
    const container = document.createElement('div');

    container.innerHTML = markup;

    const returnLink = Array.from(
        container.querySelectorAll<HTMLAnchorElement>('a'),
    ).find((link) => link.getAttribute('href') === href);

    expect(markup).toContain(`href="${href.replace('&', '&amp;')}"`);
    expect(returnLink?.textContent?.trim()).toBe(label);
    expect(returnLink?.getAttribute('aria-label')).toBe(accessibleLabel);
    expect(returnLink?.getAttribute('title')).toBe(accessibleLabel);
    expect(markup).not.toContain(`>${projectName}の開発段階へ</a>`);
    expect(markup).not.toContain('Hubへ戻る');
    expect(markup).not.toContain('Project Hubへ戻る');
}
