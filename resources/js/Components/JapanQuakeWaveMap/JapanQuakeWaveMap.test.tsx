import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}));

import JapanQuakeWaveMap from './JapanQuakeWaveMap';

describe('JapanQuakeWaveMap product composition', () => {
    it('keeps the selected detail inside the map card before the page controls', () => {
        const markup = renderToStaticMarkup(
            <JapanQuakeWaveMap
                pins={[]}
                showIntroduction={false}
                mapBottomContent={<p>DATE_RANGE_MARKER</p>}
                controlPanelsBeforeLayers={<p>INTENSITY_MARKER</p>}
                refreshAction={{
                    buttonLabel: '更新',
                    disabledLabel: '更新中',
                    statusLabel: '最新です',
                    description: '内部処理',
                    isRefreshing: false,
                    errorMessage: null,
                    onRefresh: () => {},
                }}
                compactRefreshPanel
                refreshPanelPlacement="controls"
                detailPanelPlacement="below"
                detailPanelCollapsible
                detailPanelDefaultOpen={false}
            />,
        );

        expect(markup).not.toContain('地震情報可視化');
        expect(markup).not.toContain('取得済みの地震情報を日本地図上へ重ね');

        const mapIndex = markup.indexOf('aria-label="日本地図"');
        const dateIndex = markup.indexOf('DATE_RANGE_MARKER');
        const intensityIndex = markup.indexOf('INTENSITY_MARKER');
        const layersIndex = markup.indexOf('MAP LAYERS');
        const refreshIndex = markup.indexOf('>更新</button>');
        const detailIndex = markup.lastIndexOf('詳細');

        expect(mapIndex).toBeGreaterThanOrEqual(0);
        expect(mapIndex).toBeLessThan(detailIndex);
        expect(detailIndex).toBeLessThan(dateIndex);
        expect(dateIndex).toBeLessThan(intensityIndex);
        expect(intensityIndex).toBeLessThan(layersIndex);
        expect(layersIndex).toBeLessThan(refreshIndex);
    });
});
