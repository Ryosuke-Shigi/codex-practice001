import { Link } from '@inertiajs/react';

export type PortfolioLpLink = {
    href: string;
    label: string;
    description: string;
    variant?: 'primary' | 'secondary';
};

type PortfolioLpLinkButtonsProps = {
    links: PortfolioLpLink[];
};

/*
 * LPから本体機能へ進むための導線だけを表示します。
 * href はページ側の固定データとして渡し、このコンポーネントでは外部API取得、同期開始、
 * フォーム送信のような副作用を持たせません。紹介ページのリンクは「読む -> 開く」の導線に限定します。
 */
export default function PortfolioLpLinkButtons({
    links,
}: PortfolioLpLinkButtonsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
            {links.map((link) => {
                const isPrimary = link.variant === 'primary';

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={[
                            'min-h-12 min-w-0 rounded-lg border px-4 py-3 text-sm font-semibold transition [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100',
                            isPrimary
                                ? 'border-cyan-100 bg-cyan-100 text-slate-950 hover:bg-white'
                                : 'border-white/18 bg-white/10 text-cyan-50 hover:bg-white/16',
                        ].join(' ')}
                    >
                        <span className="block break-all">{link.label}</span>
                        <span
                            className={[
                                'mt-1 block break-all text-xs font-medium leading-5',
                                isPrimary
                                    ? 'text-slate-700'
                                    : 'text-slate-200/74',
                            ].join(' ')}
                        >
                            {link.description}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
