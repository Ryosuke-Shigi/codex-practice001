import { Head } from '@inertiajs/react';

import '@/Components/LinksLauncher/linksLauncher.css';

export default function Unavailable() {
    return (
        <main className="links-launcher-page">
            <Head title="現在 非公開" />
            <h1 className="links-launcher-empty">現在 非公開</h1>
        </main>
    );
}
