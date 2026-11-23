import { Head } from '@inertiajs/react';

import '@/Components/LinksLanchar/linksLanchar.css';

export default function Unavailable() {
    return (
        <main className="links-lanchar-page">
            <Head title="現在 非公開" />
            <h1 className="links-lanchar-empty">現在 非公開</h1>
        </main>
    );
}
