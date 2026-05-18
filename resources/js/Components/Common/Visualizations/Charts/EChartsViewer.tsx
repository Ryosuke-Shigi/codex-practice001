import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export type EChartsViewerProps = {
    option: echarts.EChartsOption;
    height?: number | string;
    className?: string;
    renderer?: 'canvas' | 'svg';
};

export default function EChartsViewer({
    option,
    height = 360,
    className = '',
    renderer = 'canvas',
}: EChartsViewerProps) {
    const chartRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!chartRef.current) {
            return;
        }

        /*
         * EChartsViewer は「渡された option を描画するだけ」の共通表示部品です。
         * 各機能固有の集計、割合計算、時系列加工などは呼び出し元で済ませます。
         */
        const chartElement = chartRef.current;
        const chart = echarts.init(chartElement, null, {
            renderer,
        });
        let resizeFrame: number | null = null;

        chart.setOption(option);

        const resize = () => {
            if (resizeFrame !== null) {
                window.cancelAnimationFrame(resizeFrame);
            }

            resizeFrame = window.requestAnimationFrame(() => {
                resizeFrame = null;
                chart.resize({
                    width: chartElement.clientWidth,
                    height: chartElement.clientHeight,
                });
            });
        };

        const resizeObserver =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(resize);

        resize();
        resizeObserver?.observe(chartElement);
        window.addEventListener('resize', resize);

        return () => {
            if (resizeFrame !== null) {
                window.cancelAnimationFrame(resizeFrame);
            }

            resizeObserver?.disconnect();
            window.removeEventListener('resize', resize);
            chart.dispose();
        };
    }, [option, renderer]);

    return (
        <div
            ref={chartRef}
            className={className}
            style={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                height,
                overflow: 'hidden',
            }}
        />
    );
}
