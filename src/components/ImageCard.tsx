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
  const [hovered, setHovered] = useState(false);

  const scorePercent = score !== undefined ? Math.round(score * 100) : null;
  const scoreColor = scorePercent !== null
    ? scorePercent >= 80 ? 'from-emerald-400 to-emerald-500'
    : scorePercent >= 60 ? 'from-amber-400 to-amber-500'
    : 'from-[var(--color-primary-light)] to-[var(--color-primary)]'
    : '';

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)] transition-all duration-300 cursor-pointer animate-slide-up"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
      onClick={() => onView?.(image)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-[var(--color-surface-hover)] to-[var(--color-border-light)] relative">
        <img
          src={image.thumbnail}
          alt={image.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Score badge */}
        {scorePercent !== null && (
          <div className={`absolute top-3 right-3 bg-gradient-to-r ${scoreColor} text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            {scorePercent}%
          </div>
        )}

        {/* Rank badge for top 3 */}
        {score !== undefined && index < 3 && (
          <div className={`absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg ${
            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
            'bg-gradient-to-br from-amber-600 to-amber-700'
          }`}>
            {index + 1}
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id, image.blobKey);
            }}
            className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-red-500 hover:text-white text-[var(--color-text-secondary)] w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md"
            title="删除"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}

        {/* Hover info overlay */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${hovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
          {/* Color swatches */}
          <div className="flex items-center gap-1">
            {image.features.colorHistogram.dominantColors.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-md border-2 border-white/60 shadow-sm"
                style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)] truncate leading-snug">{image.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-[var(--color-primary)] bg-[var(--color-primary-bg)] px-2 py-0.5 rounded-md font-medium">
            {image.category}
          </span>
          <div
            className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)] shadow-inner"
            style={{ backgroundColor: `rgb(${image.features.avgColor.join(',')})` }}
          />
          <span className="text-[11px] text-[var(--color-text-tertiary)] ml-auto">
            {image.width}x{image.height}
          </span>
        </div>

        {/* Score details */}
        {score !== undefined && hovered && (
          <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border-light)] space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-text-tertiary)] w-8">色彩</span>
              <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${(colorScore ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text)] w-7 text-right tabular-nums">
                {Math.round((colorScore ?? 0) * 100)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-text-tertiary)] w-8">纹理</span>
              <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] rounded-full transition-all duration-500"
                  style={{ width: `${(textureScore ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text)] w-7 text-right tabular-nums">
                {Math.round((textureScore ?? 0) * 100)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
