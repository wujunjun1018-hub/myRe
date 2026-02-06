import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ViewMode, Category, MaterialImage, SearchResult } from './types';
import { CATEGORIES } from './types';
import { getAllImages, getImagesByCategory, deleteImage, getImageCount } from './utils/db';
import Header from './components/Header';
import CategorySidebar from './components/CategorySidebar';
import ImageGrid from './components/ImageGrid';
import UploadModal from './components/UploadModal';
import SearchPanel from './components/SearchPanel';
import ImageDetail from './components/ImageDetail';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [images, setImages] = useState<MaterialImage[]>([]);
  const [allImages, setAllImages] = useState<MaterialImage[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [detailImage, setDetailImage] = useState<MaterialImage | null>(null);

  const loadImages = useCallback(async () => {
    const all = await getAllImages();
    setAllImages(all);
    const count = await getImageCount();
    setImageCount(count);
    if (selectedCategory === '全部') {
      setImages(all);
    } else {
      const filtered = await getImagesByCategory(selectedCategory);
      setImages(filtered);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const imageCounts = useMemo(() => {
    const counts: Record<string, number> = { '全部': allImages.length };
    for (const cat of CATEGORIES) {
      if (cat === '全部') continue;
      counts[cat] = allImages.filter((img) => img.category === cat).length;
    }
    return counts;
  }, [allImages]);

  const handleCategoryChange = async (cat: Category) => {
    setSelectedCategory(cat);
    if (cat === '全部') {
      setImages(allImages);
    } else {
      const filtered = await getImagesByCategory(cat);
      setImages(filtered);
    }
  };

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

      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'library' && (
          <CategorySidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            imageCounts={imageCounts}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6">
            {viewMode === 'search' && (
              <SearchPanel library={allImages} onResults={handleSearchResults} />
            )}

            {/* Library toolbar */}
            {viewMode === 'library' && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    {selectedCategory === '全部' ? '全部素材' : selectedCategory}
                  </h2>
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
      </div>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadImages} />
      <ImageDetail image={detailImage} onClose={() => setDetailImage(null)} />
    </div>
  );
}
