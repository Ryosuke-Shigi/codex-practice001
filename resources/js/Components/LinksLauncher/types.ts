export type LinkDisplayValues = {
    readonly title: string;
    readonly description: string | null;
    readonly selectionDisplayType: 'image' | 'sphere';
    readonly selectionImageSource: string | null;
    readonly selectionImagePosterSource: string | null;
    readonly sphereColor: string | null;
    readonly sphereShadowColor: string | null;
    readonly iconImageSource: string | null;
    readonly lucideIconName: string | null;
    readonly backgroundColor: string;
    readonly backgroundImageSource: string | null;
    readonly backgroundImagePosterSource: string | null;
    readonly backgroundImageEntranceAnimationName: string | null;
    readonly backgroundEffectName: string | null;
    readonly accentColor: string;
    readonly textColor: string;
};

export type LinksLauncherLink = {
    readonly linkKey: string;
    readonly destinationUrl: string | null;
    readonly displayValues: LinkDisplayValues;
};

export type LinksLauncherPageProps = {
    readonly navigation: { readonly topUrl: string };
    readonly linksLauncher: {
        readonly linksLauncherKey: string;
        readonly title: string | null;
        readonly description: string | null;
    };
    readonly selectedLinkKey: string | null;
    readonly linkList: { readonly links: readonly LinksLauncherLink[] };
};
