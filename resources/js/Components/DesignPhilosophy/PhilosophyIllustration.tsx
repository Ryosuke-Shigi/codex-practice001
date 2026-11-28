import type { PhilosophyTopicImage } from './philosophyTopics';

type Props = {
    name: PhilosophyTopicImage | 'hero-open-book';
    alt: string;
};

export default function PhilosophyIllustration({ name, alt }: Props) {
    const hero = name === 'hero-open-book';
    const source = '/images/design-philosophy/' + name;

    return (
        <div className={hero ? 'dp-illustration dp-illustration--hero' : 'dp-illustration'} data-scroll-reveal>
            <img
                src={source + '.webp'}
                srcSet={source + '-480.webp 480w, ' + source + '-768.webp 768w, ' + source + '.webp 1280w'}
                sizes={hero
                    ? '(min-width: 76rem) 43rem, (min-width: 48rem) 57vw, calc(100vw - 2rem)'
                    : '(min-width: 72rem) 34rem, (min-width: 44rem) 48vw, calc(100vw - 2rem)'}
                width={1280}
                height={853}
                loading={hero ? 'eager' : 'lazy'}
                fetchPriority={hero ? 'high' : undefined}
                decoding="async"
                alt={alt}
            />
            {hero && (
                <svg className="dp-hero-trace" aria-hidden="true" viewBox="0 0 1536 1024">
                    <path pathLength="1" d="M370 620C430 549 475 502 530 528S620 590 682 578M873 514c56-23 106 56 169 34s120-61 163-58" />
                </svg>
            )}
        </div>
    );
}
