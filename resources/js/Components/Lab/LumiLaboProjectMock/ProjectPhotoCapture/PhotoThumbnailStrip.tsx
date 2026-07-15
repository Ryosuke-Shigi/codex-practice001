import type { ProjectCapturedPhoto } from './types';

type PhotoThumbnailStripProps = {
    photos: readonly ProjectCapturedPhoto[];
    selectedPhotoId?: string;
    action: 'confirm' | 'select';
    onSelect: (index: number) => void;
};

export default function PhotoThumbnailStrip({
    photos,
    selectedPhotoId,
    action,
    onSelect,
}: PhotoThumbnailStripProps) {
    if (photos.length === 0) {
        return null;
    }

    return (
        <div
            data-project-photo-thumbnail-strip
            className="flex h-24 max-w-full items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl border border-white/10 bg-black/45 p-2 backdrop-blur-sm [@media(orientation:landscape)_and_(max-height:480px)]:h-20"
            aria-label="撮影済み写真"
        >
            {photos.map((photo, index) => {
                const isSelected = photo.id === selectedPhotoId;
                const actionLabel = action === 'confirm' ? '確認' : '表示';

                return (
                    <button
                        key={photo.id}
                        type="button"
                        aria-label={`${index + 1}枚目の写真を${actionLabel}`}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-neutral-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 [@media(orientation:landscape)_and_(max-height:480px)]:h-16 [@media(orientation:landscape)_and_(max-height:480px)]:w-20 ${
                            isSelected
                                ? 'border-yellow-300 shadow-[0_0_0_2px_rgba(253,224,71,0.25)]'
                                : 'border-white/45 hover:border-white'
                        }`}
                        onClick={() => onSelect(index)}
                    >
                        <img
                            src={photo.objectUrl}
                            alt=""
                            className={`h-full w-full object-cover ${
                                isSelected
                                    ? 'opacity-100'
                                    : 'brightness-75 opacity-80'
                            }`}
                        />
                        <span className="absolute bottom-1 left-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-yellow-300 px-1 text-sm font-black text-black">
                            {index + 1}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
