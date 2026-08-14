import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MapRefreshPanel from './MapRefreshPanel';

const action = {
    buttonLabel: '更新',
    disabledLabel: '更新中',
    statusLabel: '最新です',
    description: '内部処理の説明',
    isRefreshing: false,
    errorMessage: null,
    onRefresh: () => {},
};

describe('MapRefreshPanel', () => {
    it('renders only the refresh button in compact product mode', () => {
        const markup = renderToStaticMarkup(<MapRefreshPanel action={action} compact />);

        expect(markup).toContain('>更新</button>');
        expect(markup).not.toContain('地図データ更新');
        expect(markup).not.toContain('開く');
        expect(markup).not.toContain('閉じる');
        expect(markup).not.toContain('内部処理の説明');
        expect(markup).not.toContain('最新です');
    });

    it('renders the disabled update label and a minimal error in compact mode', () => {
        const markup = renderToStaticMarkup(
            <MapRefreshPanel
                compact
                action={{
                    ...action,
                    isRefreshing: true,
                    errorMessage: '更新に失敗しました',
                }}
            />,
        );

        expect(markup).toContain('disabled=""');
        expect(markup).toContain('更新中');
        expect(markup).toContain('更新に失敗しました');
    });
});
