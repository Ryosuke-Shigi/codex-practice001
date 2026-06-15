import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Building2,
    ClipboardList,
    Globe2,
    LayoutDashboard,
    Lightbulb,
    Play,
    Radar,
    Rocket,
} from 'lucide-react';

import type { ProjectIconKey } from './projectData';

const projectIconMap: Record<ProjectIconKey, LucideIcon> = {
    'bar-chart': BarChart3,
    building: Building2,
    clipboard: ClipboardList,
    globe: Globe2,
    layout: LayoutDashboard,
    lightbulb: Lightbulb,
    play: Play,
    radar: Radar,
    rocket: Rocket,
};

export function resolveProjectIcon(iconKey: ProjectIconKey): LucideIcon {
    return projectIconMap[iconKey];
}
