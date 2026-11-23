import { Head } from '@inertiajs/react';

import LinksLauncherView from '@/Components/LinksLauncher/LinksLauncherView';
import type { LinksLauncherPageProps } from '@/Components/LinksLauncher/types';

export default function Show(props: LinksLauncherPageProps) {
    return (
        <>
            <Head title={props.linksLauncher.title ?? 'LinksLauncher'} />
            <LinksLauncherView {...props} />
        </>
    );
}
