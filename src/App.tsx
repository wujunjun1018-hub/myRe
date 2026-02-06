import { useState, useEffect, useCallback } from 'react';
import type { ViewMode, Category, MaterialImage, SearchResult } from './types';
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
    <div className="min-h-screen flex flex-col">
      <Header viewMode={viewMode} onViewModeChange={setViewMode} imageCount={imageCount} />

      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'library' && (
          <CategorySidebar selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {viewMode === 'search' && (
            <SearchPanel library={allImages} onResults={handleSearchResults} />
          )}

          {/* Toolbar */}
          {viewMode === 'library' && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                {selectedCategory === '全部' ? '全部素材' : selectedCategory}
                <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-2">
                  ({images.length})
                </span>
              </h2>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                上传素材
              </button>
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
              emptyMessage="上传一张图片开始搜索匹配的材质"
            />
          )}
        </main>
      </div>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadImages} />
      <ImageDetail image={detailImage} onClose={() => setDetailImage(null)} />
    </div>
  );
}
