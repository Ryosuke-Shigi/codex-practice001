/**
 * QuakeWave map の震度フィルター Component / utility です。
 *
 * 表示ON/OFFの UI 値を扱い、DB取得条件や map pin 生成条件は変更しません。
 */
import VerticalIntensitySwitch from '@/Components/JapanQuakeWaveMap/VerticalIntensitySwitch';

export type QuakeIntensityKey =
    | '7'
    | '6+'
    | '6-'
    | '5+'
    | '5-'
    | '4'
    | '3'
    | '2'
    | '1'
    | 'unknown';

type QuakeIntensityOption = {
    key: QuakeIntensityKey;
    label: string;
    tone: 'strong' | 'high' | 'middle' | 'low' | 'unknown';
};

type QuakeIntensitySwitchFilterProps = {
    selectedIntensities: QuakeIntensityKey[];
    onChange: (selectedIntensities: QuakeIntensityKey[]) => void;
    layout?: 'responsive' | 'single-row';
};

export const quakeIntensityOptions: QuakeIntensityOption[] = [
    { key: '7', label: '7', tone: 'strong' },
    { key: '6+', label: '6強', tone: 'strong' },
    { key: '6-', label: '6弱', tone: 'high' },
    { key: '5+', label: '5強', tone: 'high' },
    { key: '5-', label: '5弱', tone: 'middle' },
    { key: '4', label: '4', tone: 'middle' },
    { key: '3', label: '3', tone: 'middle' },
    { key: '2', label: '2', tone: 'low' },
    { key: '1', label: '1', tone: 'low' },
    { key: 'unknown', label: '不明', tone: 'unknown' },
];

export const quakeIntensityKeys = quakeIntensityOptions.map((option) => option.key);

export function quakeIntensityKey(maxIntensity: string | null): QuakeIntensityKey {
    const normalized = maxIntensity?.trim();

    if (!normalized || normalized === '?' || normalized === '不明') {
        return 'unknown';
    }

    if (normalized === '6強' || normalized === '6+') {
        return '6+';
    }

    if (normalized === '6弱' || normalized === '6-') {
        return '6-';
    }

    if (normalized === '5強' || normalized === '5+') {
        return '5+';
    }

    if (normalized === '5弱' || normalized === '5-') {
        return '5-';
    }

    if (quakeIntensityKeys.includes(normalized as QuakeIntensityKey)) {
        return normalized as QuakeIntensityKey;
    }

    return 'unknown';
}

export function quakeIntensitySortRank(maxIntensity: string | null) {
    const key = quakeIntensityKey(maxIntensity);
    const index = quakeIntensityOptions.findIndex((option) => option.key === key);

    return index === -1 ? 0 : quakeIntensityOptions.length - index;
}

export default function QuakeIntensitySwitchFilter({
    selectedIntensities,
    onChange,
    layout = 'responsive',
}: QuakeIntensitySwitchFilterProps) {
    const selectedSet = new Set(selectedIntensities);

    const toggleIntensity = (key: QuakeIntensityKey, checked: boolean) => {
        const nextSet = new Set(selectedSet);

        if (checked) {
            nextSet.add(key);
        } else {
            nextSet.delete(key);
        }

        onChange(
            quakeIntensityOptions
                .map((option) => option.key)
                .filter((optionKey) => nextSet.has(optionKey)),
        );
    };

    return (
        <section className="w-full min-w-0 rounded-lg border border-white/25 bg-slate-950/30 px-4 py-3 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-[0.08em] text-cyan-100/82">
                    震度フィルター
                </h2>
            </div>

            {/*
                PRODUCT は明示指定された横一列へ収め、MOCK 等の既存呼び出しでは
                スマホ5列 x 2段を維持します。どちらも同じ10項目と操作寸法を使います。
            */}
            <div className={`mt-2 grid items-start justify-items-center ${layout === 'single-row'
                ? 'grid-cols-10 gap-x-1 gap-y-3'
                : 'grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-10'}`}>
                {quakeIntensityOptions.map((option) => (
                    <VerticalIntensitySwitch
                        key={option.key}
                        label={option.label}
                        tone={option.tone}
                        checked={selectedSet.has(option.key)}
                        compact={layout === 'single-row'}
                        onChange={(checked) => toggleIntensity(option.key, checked)}
                    />
                ))}
            </div>
        </section>
    );
}
