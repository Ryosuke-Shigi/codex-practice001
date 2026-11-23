import { effectPatterns } from '@/Components/Effects/EffectLayer';

export default function LinksLancharEffect({ name }: { name: string }) {
    const Effect = effectPatterns.find(({ key }) => key === name)?.Component;

    return Effect ? <Effect /> : null;
}
