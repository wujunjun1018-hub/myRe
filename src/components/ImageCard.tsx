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

  const scorePct = score !== undefined ? Math.round(score * 1000) / 10 : null; // one decimal

  const autoTags = (() => {
    const tags: string[] = [];
    const avg = image.features.avgColor;
    const brightness = (avg[0] + avg[1] + avg[2]) / 3;
    tags.push(brightness > 180 ? '#明亮' : brightness < 85 ? '#偏暗' : '#柔和');
    const edge = image.features.textureFeatures.edgeDensity;
    tags.push(edge > 0.22 ? '#结构清晰' : edge > 0.13 ? '#结构适中' : '#结构平滑');
    return tags;
  })();

  const tags = (image.tags?.length ? image.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)) : []).slice(0, 2);
  const displayTags = (tags.length > 0 ? tags : autoTags).slice(0, 2).join('  ');

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-slide-up"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
      onClick={() => onView?.(image)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="aspect-[4/3] overflow-hidden bg-black/20 relative">
        <img
          src={image.thumbnail}
          alt={image.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Score badge */}
        {scorePct !== null && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full border border-emerald-400/25 bg-emerald-400/12 text-emerald-200 text-xs font-bold shadow-[var(--shadow-sm)]">
            {scorePct}% Match
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id, image.blobKey);
            }}
            className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 border border-[var(--color-border)] bg-black/35 hover:bg-red-500/80 hover:text-white text-[var(--color-text)] w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 shadow-[var(--shadow-md)]"
            title="删除"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}

        {/* Subtle frame */}
        <div className={`absolute inset-0 ring-1 ring-white/5 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Info */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--color-text)] truncate leading-snug">{image.name}</h3>
          {score === undefined && (
            <span className="ml-auto text-[11px] text-[var(--color-text-tertiary)] tabular-nums">{image.width}x{image.height}</span>
          )}
        </div>

        {score !== undefined ? (
            <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--color-text-tertiary)] w-14 sm:w-16">结构相似度</span>
              <div className="flex-1 h-2 rounded-full bg-black/25 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${(textureScore ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text)] w-10 text-right tabular-nums">{Math.round((textureScore ?? 0) * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--color-text-tertiary)] w-14 sm:w-16">色彩匹配</span>
              <div className="flex-1 h-2 rounded-full bg-black/25 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500 transition-all duration-500"
                  style={{ width: `${(colorScore ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[var(--color-text)] w-10 text-right tabular-nums">{Math.round((colorScore ?? 0) * 100)}%</span>
            </div>

            <div className="pt-0.5 text-[10px] text-[var(--color-text-tertiary)] truncate">{displayTags}</div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)] shadow-inner"
              style={{ backgroundColor: `rgb(${image.features.avgColor.join(',')})` }}
            />
            <span className="text-[11px] text-[var(--color-text-tertiary)]">平均色</span>
          </div>
        )}
      </div>
    </div>
  );
}
