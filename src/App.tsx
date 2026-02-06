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

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-6">
          {viewMode === 'search' && (
            <SearchPanel library={images} onResults={handleSearchResults} />
          )}

          {/* Library toolbar */}
          {viewMode === 'library' && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">全部素材</h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
                  共 {images.length} 张素材图片
                </p>
              </div>
            </div>
          )}

          {/* Search results header */}
          {viewMode === 'search' && searchResults.length > 0 && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                搜索结果
                <span className="text-sm font-normal text-[var(--color-text-tertiary)] ml-2">
                  找到 {searchResults.length} 个匹配
                </span>
              </h2>
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

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadImages} />
      <ImageDetail image={detailImage} onClose={() => setDetailImage(null)} />
    </div>
  );
}
