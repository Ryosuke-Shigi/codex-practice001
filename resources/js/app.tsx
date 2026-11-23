import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import {
    observeLinksLauncherArrivals,
    observeStaleLauncherArrival,
    prepareLinksLauncherHistoryReload,
} from '@/Hooks/useLinksLauncherHistory';

const appName = import.meta.env.VITE_APP_NAME ?? 'Portfolio';

createInertiaApp({
    title: (title) => (title && title !== appName ? `${title} | ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const stopObserving = observeLinksLauncherArrivals(({ component, url }) =>
            component === 'LinksLauncher/Show'
            || component === 'LinksLanchar/Show'
            || (component === 'Projects/Select'
                && new URL(url, window.location.origin).searchParams.get('view') === 'stages'),
        );
        import.meta.hot?.dispose(stopObserving);
        const stopStaleArrival = observeStaleLauncherArrival(
            props.initialPage.version, 'LinksLanchar/Show', 'LinksLauncher/Show',
        );
        import.meta.hot?.dispose(stopStaleArrival);

        if (props.initialPage.component === 'LinksLauncher/Show'
            || props.initialPage.component === 'LinksLanchar/Show'
            || props.initialPage.component === 'Projects/Select') {
            prepareLinksLauncherHistoryReload();
        }
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#67e8f9',
    },
});
