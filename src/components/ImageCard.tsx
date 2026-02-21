import { useState } from 'react';
import type { MaterialImage } from '../types';

interface ImageCardProps {
  image: MaterialImage;
  score?: number;
  colorScore?: number;
  textureScore?: number;
  onDelete?: (id: string, blobKey: string) => void;
  onView?: (image: MaterialImage) => void;
  index?: number;
}

export default function ImageCard({ image, score, colorScore, textureScore, onDelete, onView, index = 0 }: ImageCardProps) {
  const scorePct = score !== undefined ? Math.round(score * 100) : null;

  return (
    <div
      className="group relative bg-[var(--color-surface)] rounded-xl overflow-hidden cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors animate-slide-up"
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
      onClick={() => onView?.(image)}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-[var(--color-surface-elevated)] relative">
        <img
          src={image.thumbnail}
          alt={image.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Score Badge */}
        {scorePct !== null && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[var(--color-success)]/90 text-white text-xs font-medium rounded">
            {scorePct}%
          </div>
        )}

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id, image.blobKey);
            }}
            className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm text-[var(--color-text)] truncate">{image.name}</h3>
          {score === undefined && (
            <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums shrink-0">{image.width}×{image.height}</span>
          )}
        </div>

        {/* Score Bars */}
        {score !== undefined && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--color-text-tertiary)] w-10">结构</span>
              <div className="flex-1 h-1.5 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${(textureScore ?? 0) * 100}%` }} />
              </div>
              <span className="text-[10px] text-[var(--color-text-secondary)] w-6 text-right">{Math.round((textureScore ?? 0) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--color-text-tertiary)] w-10">色彩</span>
              <div className="flex-1 h-1.5 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-success)] rounded-full" style={{ width: `${(colorScore ?? 0) * 100}%` }} />
              </div>
              <span className="text-[10px] text-[var(--color-text-secondary)] w-6 text-right">{Math.round((colorScore ?? 0) * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
