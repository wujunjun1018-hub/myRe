import type { MaterialImage, SearchResult } from '../types';
import ImageCard from './ImageCard';

interface ImageGridProps {
  images?: MaterialImage[];
  searchResults?: SearchResult[];
  loading?: boolean;
  onDelete?: (id: string, blobKey: string) => void;
  onView?: (image: MaterialImage) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export default function ImageGrid({
  images,
  searchResults,
  loading = false,
  onDelete,
  onView,
  emptyMessage = '暂无素材',
  emptySubMessage = '',
}: ImageGridProps) {
  const items = searchResults ?? images?.map((img) => ({ image: img }));

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-xl overflow-hidden">
            <div className="aspect-[4/3] shimmer" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-2/3 rounded shimmer" />
              <div className="h-2 w-full rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-xl bg-[var(--color-surface)] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{emptySubMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
