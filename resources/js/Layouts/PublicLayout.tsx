/**
 * 公開画面共通の Layout Component です。
 *
 * 背景エフェクトと children の配置だけを扱い、各機能のデータ取得や業務判断は Page 側へ分けます。
 */
import { useState, type PropsWithChildren } from 'react';

import EffectLayer, {
    defaultEffectName,
    type EffectIntensity,
    type EffectName,
    readPreferredEffectName,
    resolveEffectName,
} from '@/Components/Effects/EffectLayer';

type PublicLayoutProps = PropsWithChildren<{
    className?: string;
    effect?: EffectName;
    effectIntensity?: EffectIntensity;
    withEffect?: boolean;
}>;

/*
 * PublicLayout は Welcome や Lab など、ログイン不要の公開ページ専用レイアウトです。
 * 通常は「固定背景の EffectLayer」->「実ページ内容の children」の順で描画し、
 * ページが withEffect=false を指定した場合だけ共通背景を省略します。
 * 背景実験とページ本体を分けることで、各ページは通常の React / Inertia UI に集中できます。
 */
export default function PublicLayout({
    children,
    className = '',
    effect,
    effectIntensity = 'subtle',
    withEffect = true,
}: PublicLayoutProps) {
    /*
     * 保存済み effect は mount 時に一度だけ読みます。
     * render のたびに storage を読むと、通常の画面 state 更新で背景が不意に変わる可能性があります。
     * ページが明示的に effect を指定した場合は、そのページ固有の背景指定を優先します。
     */
    const [preferredEffect] = useState<EffectName>(
        () => readPreferredEffectName() ?? defaultEffectName,
    );
    const resolvedEffect = resolveEffectName(effect ?? preferredEffect);

    return (
        /*
         * 縦スクロールの制御は layout では固定しません。
         * Welcome は自分で 100dvh scene を制御し、Lab などは通常スクロールを必要とします。
         */
        <div className="relative min-h-dvh overflow-x-hidden text-white">
            {/*
                effect、effectIntensity、withEffect は通常の React props として扱います。
                Welcome や入口ページは水面を強めにし、内容が多いページは同じ方向性のまま控えめにできます。
                effect を省略したページでは、直近の Welcome 選択を再利用します。
            */}
            {withEffect && (
                <EffectLayer effect={resolvedEffect} effectIntensity={effectIntensity} />
            )}

            {/*
                z-30 により、リンク、ボタン、カードをすべての背景 layer より上に置きます。
                背景 effect を操作対象ではなく装飾として保つための境界です。
            */}
            <main className={`relative z-30 min-h-dvh ${className}`}>{children}</main>
        </div>
    );
}
