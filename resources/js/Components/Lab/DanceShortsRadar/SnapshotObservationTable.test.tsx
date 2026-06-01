import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import SnapshotObservationNavigation from './SnapshotObservationNavigation';
import SnapshotObservationTable from './SnapshotObservationTable';
import {
    firstSnapshotObservationMockData,
    latestSnapshotObservationMockData,
} from './snapshotObservationMockData';

const tableHeaders = [
    '地域',
    'キーワード',
    'タイトル',
    'チャンネル',
    '視聴数',
    'いいね数',
    'コメント数',
    '公開日',
    '観測日時',
    '状態',
] as const;

describe('DanceShortsRadar snapshot observation MOCK views', () => {
    it('renders buttons for the first and latest observation lists', () => {
        const markup = renderToStaticMarkup(
            <SnapshotObservationNavigation
                activeView={null}
                onOpenFirstObservation={() => {}}
                onOpenLatestObservation={() => {}}
            />,
        );

        expect(markup).toContain('初回観測一覧');
        expect(markup).toContain('最新観測一覧');
    });

    it('renders the first observation table without ranking comparison labels', () => {
        const markup = renderToStaticMarkup(
            <SnapshotObservationTable
                title="初回観測一覧"
                description="previous snapshot がまだ無い動画を確認する一覧です。"
                observations={firstSnapshotObservationMockData}
            />,
        );

        for (const header of tableHeaders) {
            expect(markup).toContain(header);
        }

        expect(markup).toContain('比較元なし');
        expect(markup).not.toContain('視聴数の増加数');
        expect(markup).not.toContain('増加率');
    });

    it('renders the latest observation table as a current snapshot list', () => {
        const markup = renderToStaticMarkup(
            <SnapshotObservationTable
                title="最新観測一覧"
                description="最新 snapshot を持つ動画の現在状態を確認する一覧です。"
                observations={latestSnapshotObservationMockData}
            />,
        );

        for (const header of tableHeaders) {
            expect(markup).toContain(header);
        }

        expect(markup).toContain('最新観測');
        expect(markup).toContain('1,710,000回');
    });
});
