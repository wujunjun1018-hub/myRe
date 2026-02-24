import type { MaterialImage, SearchResult } from '../types';
import ImageCard from './ImageCard';

interface ImageGridProps {
  images?: MaterialImage[];
  searchResults?: SearchResult[];
  onDelete?: (id: string, blobKey: string) => void;
  onView?: (image: MaterialImage) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export default function ImageGrid({
  images,
  searchResults,
  onDelete,
  onView,
  emptyMessage = '暂无素材',
  emptySubMessage = '点击右上角「上传素材」按钮添加第一张图片',
}: ImageGridProps) {
  const items = searchResults ?? images?.map((img) => ({ image: img }));

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 animate-fade-in">
        {/* Decorative illustration */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[var(--color-bg-warm)] to-[var(--color-border-light)] flex items-center justify-center border border-[var(--color-border)] shadow-[var(--shadow-xs)]">
            <svg className="w-12 h-12 text-[var(--color-border-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          {/* Floating accent dots */}
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--color-primary-bg)] border border-[var(--color-primary)]/20 animate-float" />
          <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-[var(--color-accent-bg)] border border-[var(--color-accent)]/20 animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <p className="text-base font-semibold text-[var(--color-text)]">{emptyMessage}</p>
        <p className="text-[13px] text-[var(--color-text-tertiary)] mt-2 max-w-xs text-center leading-relaxed">{emptySubMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
      {items.map((item, index) => {
        const isSearchResult = 'score' in item;
        return (
          <ImageCard
            key={item.image.id}
            image={item.image}
            index={index}
            score={isSearchResult ? (item as SearchResult).score : undefined}
            colorScore={isSearchResult ? (item as SearchResult).colorScore : undefined}
            textureScore={isSearchResult ? (item as SearchResult).textureScore : undefined}
            onDelete={onDelete}
            onView={onView}
          />
        );
      })}
    </div>
  );
}
