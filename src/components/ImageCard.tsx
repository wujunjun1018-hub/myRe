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
  const scorePercent = score !== undefined ? Math.round(score * 100) : null;

  const getScoreStyle = (pct: number) => {
    if (pct >= 80) return { bg: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]' };
    if (pct >= 60) return { bg: 'bg-[var(--color-warning)]', text: 'text-[var(--color-warning)]' };
    return { bg: 'bg-[var(--color-primary)]', text: 'text-[var(--color-primary)]' };
  };

  return (
    <div
      className="card-premium group relative overflow-hidden cursor-pointer animate-slide-up"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
      onClick={() => onView?.(image)}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-[var(--color-bg-warm)] relative">
        <img
          src={image.thumbnail}
          alt={image.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Score badge */}
        {scorePercent !== null && (
          <div className={`absolute top-2.5 right-2.5 ${getScoreStyle(scorePercent).bg} text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 backdrop-blur-sm`}>
            {scorePercent}%
          </div>
        )}

        {/* Rank medal for top 3 */}
        {score !== undefined && index < 3 && (
          <div className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg ring-2 ring-white/30 ${
            index === 0 ? 'bg-gradient-to-b from-[#F5D060] to-[#D4A24C]' :
            index === 1 ? 'bg-gradient-to-b from-[#C0C0C0] to-[#9E9E9E]' :
            'bg-gradient-to-b from-[#CD7F32] to-[#A0642C]'
          }`}>
            {index + 1}
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(image.id, image.blobKey); }}
            className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 bg-white/95 hover:bg-[var(--color-danger)] hover:text-white text-[var(--color-text-secondary)] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-md"
            title="删除"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}

        {/* Color swatches on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="flex items-center gap-[2px]">
            {image.features.colorHistogram.dominantColors.slice(0, 6).map((c, i) => (
              <div
                key={i}
                className="flex-1 h-[6px] first:rounded-l-full last:rounded-r-full shadow-sm"
                style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-[var(--color-text)] truncate leading-snug flex-1">{image.name}</h3>
          <div
            className="w-4 h-4 rounded-full border border-[var(--color-border)] shrink-0 shadow-inner mt-0.5"
            style={{ backgroundColor: `rgb(${image.features.avgColor.join(',')})` }}
          />
        </div>
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
          {image.width} x {image.height}
        </p>

        {/* Score breakdown - always visible */}
        {score !== undefined && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-light)] space-y-2">
            {[
              { label: '色彩', value: colorScore ?? 0, color: 'bg-gradient-to-r from-[#D4A24C] to-[#C8956C]' },
              { label: '纹理', value: textureScore ?? 0, color: 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-tertiary)] w-6 shrink-0">{label}</span>
                <div className="flex-1 bg-[var(--color-border-light)] rounded-full h-[5px] overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] w-6 text-right tabular-nums">
                  {Math.round(value * 100)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
