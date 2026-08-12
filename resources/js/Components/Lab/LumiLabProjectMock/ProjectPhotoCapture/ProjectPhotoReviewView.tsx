import { ArrowLeft, Info, Trash2 } from 'lucide-react';

import PhotoThumbnailStrip from './PhotoThumbnailStrip';
import type { ProjectCapturedPhoto } from './types';

type ProjectPhotoReviewViewProps = {
    photos: readonly ProjectCapturedPhoto[];
    selectedIndex: number;
    onSelectPhoto: (index: number) => void;
    onBack: () => void;
    onDelete: () => void;
};

export default function ProjectPhotoReviewView({
    photos,
    selectedIndex,
    onSelectPhoto,
    onBack,
    onDelete,
}: ProjectPhotoReviewViewProps) {
    const selectedPhoto = photos[selectedIndex];

    if (selectedPhoto === undefined) {
        return null;
    }

    return (
        <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-neutral-950 text-white [@media(min-width:768px)_and_(min-height:600px)]:h-[min(90dvh,56rem)] [@media(min-width:768px)_and_(min-height:600px)]:max-h-[calc(100dvh-3rem)] [@media(min-width:768px)_and_(min-height:600px)]:max-w-4xl [@media(min-width:768px)_and_(min-height:600px)]:rounded-2xl [@media(min-width:768px)_and_(min-height:600px)]:border [@media(min-width:768px)_and_(min-height:600px)]:border-white/15 [@media(min-width:768px)_and_(min-height:600px)]:shadow-2xl">
            <header className="grid min-h-16 grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center border-b border-white/10 px-2 pt-[env(safe-area-inset-top)] sm:px-4">
                <button
                    type="button"
                    aria-label="撮影画面へ戻る"
                    title="撮影画面へ戻る"
                    className="inline-flex h-11 items-center justify-center gap-1 rounded-full bg-white/15 px-2 text-sm font-black transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-6 w-6" aria-hidden />
                    <span>戻る</span>
                </button>
                <h1 className="text-center text-lg font-black sm:text-xl">
                    写真を確認
                </h1>
                <span aria-hidden />
            </header>

            <main className="min-h-0 flex-1 bg-black">
                <img
                    src={selectedPhoto.objectUrl}
                    alt={`撮影写真 ${selectedIndex + 1}`}
                    className="h-full w-full object-contain"
                />
            </main>

            <footer className="grid max-h-[48dvh] flex-none gap-4 overflow-y-auto border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
                <p className="text-center text-lg font-black">
                    {selectedIndex + 1} / {photos.length}
                </p>
                <PhotoThumbnailStrip
                    photos={photos}
                    selectedPhotoId={selectedPhoto.id}
                    action="select"
                    onSelect={onSelectPhoto}
                />
                <p className="flex items-center justify-center gap-2 text-sm font-bold text-white/65">
                    <Info className="h-5 w-5" aria-hidden />
                    不要な写真だけ削除できます
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        aria-label="撮影画面へ戻る"
                        title="撮影画面へ戻る"
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/50 px-5 text-lg font-black transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        戻る
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-red-400 px-5 text-lg font-black text-red-300 transition hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-5 w-5" aria-hidden />
                        この写真を削除
                    </button>
                </div>
            </footer>
        </div>
    );
}
