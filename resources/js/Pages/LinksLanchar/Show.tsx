import { Head } from '@inertiajs/react';

import LinksLancharView from '@/Components/LinksLanchar/LinksLancharView';
import type { LinksLancharPageProps } from '@/Components/LinksLanchar/types';

export default function Show(props: LinksLancharPageProps) {
    return (
        <>
            <Head title={props.linksLanchar.title ?? 'LinksLanchar'} />
            <LinksLancharView {...props} />
        </>
    );
}
