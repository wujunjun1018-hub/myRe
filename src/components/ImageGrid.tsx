import type { MaterialImage, SearchResult } from '../types';
import ImageCard from './ImageCard';

interface ImageGridProps {
  images?: MaterialImage[];
  searchResults?: SearchResult[];
  onDelete?: (id: string, blobKey: string) => void;
  onView?: (image: MaterialImage) => void;
  emptyMessage?: string;
}

export default function ImageGrid({
  images,
  searchResults,
  onDelete,
  onView,
  emptyMessage = '暂无素材，请上传图片',
}: ImageGridProps) {
  const items = searchResults ?? images?.map((img) => ({ image: img }));

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {items.map((item) => {
        const isSearchResult = 'score' in item;
        return (
          <ImageCard
            key={item.image.id}
            image={item.image}
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
