import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import {
    observeLinksLancharArrivals,
    prepareLinksLancharHistoryReload,
} from '@/Hooks/useLinksLancharHistory';

const appName = import.meta.env.VITE_APP_NAME ?? 'Portfolio';

createInertiaApp({
    title: (title) => (title && title !== appName ? `${title} | ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const stopObserving = observeLinksLancharArrivals(({ component, url }) =>
            component === 'LinksLanchar/Show'
            || (component === 'Projects/Select'
                && new URL(url, window.location.origin).searchParams.get('view') === 'stages'),
        );
        import.meta.hot?.dispose(stopObserving);

        if (props.initialPage.component === 'LinksLanchar/Show'
            || props.initialPage.component === 'Projects/Select') {
            prepareLinksLancharHistoryReload();
        }
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#67e8f9',
    },
});
