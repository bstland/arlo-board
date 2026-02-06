'use client';

import { useState, useEffect } from 'react';
import { getImageLink } from '@/lib/image-cache';
import { Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FileEntry } from '@/lib/types';

interface ImageGalleryProps {
  images: FileEntry[];
}

function ImageThumbnail({ entry, onClick }: { entry: FileEntry; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getImageLink(entry.path)
      .then(setUrl)
      .catch(() => setError(true));
  }, [entry.path]);

  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-[#313244] hover:border-violet-500 dark:hover:border-violet-400 transition-colors bg-gray-100 dark:bg-[#181825] group"
    >
      {url ? (
        <img src={url} alt={entry.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-red-400 text-xs p-2 text-center">
          Failed to load
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate">{entry.name}</p>
      </div>
    </button>
  );
}

function Lightbox({ images, index, onClose, onNavigate }: {
  images: FileEntry[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    getImageLink(images[index].path)
      .then(setUrl)
      .catch(() => {});
  }, [images, index]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) onNavigate(index + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, images.length, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full">
        <X size={24} />
      </button>

      {index > 0 && (
        <button onClick={() => onNavigate(index - 1)} className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full">
          <ChevronLeft size={32} />
        </button>
      )}

      {index < images.length - 1 && (
        <button onClick={() => onNavigate(index + 1)} className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full">
          <ChevronRight size={32} />
        </button>
      )}

      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4">
        {url ? (
          <img src={url} alt={images[index].name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        ) : (
          <Loader2 className="animate-spin text-white" size={48} />
        )}
        <p className="text-white text-sm">{images[index].name} ({index + 1}/{images.length})</p>
      </div>
    </div>
  );
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="p-6 bg-white dark:bg-[#1e1e2e] h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Images ({images.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((entry, i) => (
          <div key={entry.path} className="relative">
            <ImageThumbnail entry={entry} onClick={() => setLightboxIndex(i)} />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
