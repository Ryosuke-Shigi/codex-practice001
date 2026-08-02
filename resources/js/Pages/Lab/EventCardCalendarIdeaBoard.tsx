import { Head, Link } from '@inertiajs/react';

import EventCardCalendarIdeaBoardView from '@/Components/Lab/EventCardCalendar/EventCardCalendarIdeaBoardView';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

const eventCardCalendarReturn = getStageProjectReturnLink(
    'event-card-calendar',
);

export default function EventCardCalendarIdeaBoard() {
    return (
        <PublicLayout
            className="h-dvh overflow-hidden bg-slate-950/72 px-2 py-2 sm:px-3 lg:px-4"
            effectIntensity="subtle"
        >
            <Head title="イベント・カードカレンダー IDEA BOARD" />

            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-2 overflow-hidden">
                <header className="flex flex-none items-center">
                    <Link
                        href={eventCardCalendarReturn.href}
                        aria-label={eventCardCalendarReturn.ariaLabel}
                        title={eventCardCalendarReturn.title}
                        className="inline-flex min-h-8 w-fit items-center justify-center rounded-md border border-white/18 bg-white/10 px-2.5 text-xs font-semibold text-cyan-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        {eventCardCalendarReturn.label}
                    </Link>
                </header>

                <EventCardCalendarIdeaBoardView />
            </div>
        </PublicLayout>
    );
}
