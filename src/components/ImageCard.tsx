import { useState } from 'react';
import type { MaterialImage } from '../types';

interface ImageCardProps {
  image: MaterialImage;
  score?: number;
  colorScore?: number;
  textureScore?: number;
  onDelete?: (id: string, blobKey: string) => void;
  onView?: (image: MaterialImage) => void;
}

export default function ImageCard({ image, score, colorScore, textureScore, onDelete, onView }: ImageCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden border border-[var(--color-border)] hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => onView?.(image)}
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-[var(--color-surface-hover)]">
        <img
          src={image.thumbnail}
          alt={image.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Score badge */}
      {score !== undefined && (
        <div className="absolute top-2 right-2 bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-1 rounded-full shadow">
          {Math.round(score * 100)}%
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--color-text)] truncate">{image.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded">
            {image.category}
          </span>
          {/* Average color swatch */}
          <div
            className="w-4 h-4 rounded-full border border-[var(--color-border)]"
            style={{ backgroundColor: `rgb(${image.features.avgColor.join(',')})` }}
            title={`RGB(${image.features.avgColor.join(', ')})`}
          />
        </div>

        {/* Score details on hover for search results */}
        {score !== undefined && showDetail && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)] w-12">色彩</span>
              <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5">
                <div
                  className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                  style={{ width: `${(colorScore ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[var(--color-text-secondary)] w-8 text-right">
                {Math.round((colorScore ?? 0) * 100)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)] w-12">纹理</span>
              <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5">
                <div
                  className="h-full bg-[var(--color-primary-light)] rounded-full transition-all"
                  style={{ width: `${(textureScore ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[var(--color-text-secondary)] w-8 text-right">
                {Math.round((textureScore ?? 0) * 100)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id, image.blobKey);
          }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-all shadow"
          title="删除"
        >
          ✕
        </button>
      )}
    </div>
  );
}
