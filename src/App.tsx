import { useState, useEffect, useCallback } from 'react';
import type { ViewMode, MaterialImage, SearchResult } from './types';
import { getAllImages, deleteImage, getImageCount } from './utils/db';
import Header from './components/Header';
import ImageGrid from './components/ImageGrid';
import UploadModal from './components/UploadModal';
import SearchPanel from './components/SearchPanel';
import ImageDetail from './components/ImageDetail';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [images, setImages] = useState<MaterialImage[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [detailImage, setDetailImage] = useState<MaterialImage | null>(null);

  const loadImages = useCallback(async () => {
    const all = await getAllImages();
    setImages(all);
    const count = await getImageCount();
    setImageCount(count);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleDelete = async (id: string, blobKey: string) => {
    if (!confirm('确定要删除这张素材吗？')) return;
    await deleteImage(id, blobKey);
    await loadImages();
  };

  const handleSearchResults = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        imageCount={imageCount}
        onUpload={() => setShowUpload(true)}
      />

      <main className="flex-1">
        <div className="max-w-[1440px] mx-auto px-8 py-7">
          {viewMode === 'search' && (
            <SearchPanel library={images} onResults={handleSearchResults} />
          )}

          {/* Library header */}
          {viewMode === 'library' && (
            <div className="flex items-end justify-between mb-7">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">全部素材</h2>
                <p className="text-[13px] text-[var(--color-text-tertiary)] mt-1">
                  共 <span className="font-semibold text-[var(--color-text-secondary)] tabular-nums">{images.length}</span> 张素材图片
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
                本地存储
              </div>
            </div>
          )}

          {/* Search results header */}
          {viewMode === 'search' && searchResults.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
                匹配结果
              </h2>
              <span className="text-[13px] text-[var(--color-text-tertiary)] bg-[var(--color-bg-warm)] px-2.5 py-0.5 rounded-lg border border-[var(--color-border-light)]">
                {searchResults.length} 个匹配
              </span>
            </div>
          )}

          {/* Content */}
          {viewMode === 'library' ? (
            <ImageGrid
              images={images}
              onDelete={handleDelete}
              onView={setDetailImage}
            />
          ) : (
            <ImageGrid
              searchResults={searchResults}
              onView={setDetailImage}
              emptyMessage="以图搜图"
              emptySubMessage="上传一张材质图片，搜索资源库中相似的板材花纹和材质"
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-[var(--color-text-tertiary)] border-t border-[var(--color-border-light)]">
        WoodMatch - 建筑板材智能匹配系统
      </footer>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadImages} />
      <ImageDetail image={detailImage} onClose={() => setDetailImage(null)} />
    </div>
  );
}
