import { useState, useEffect, useCallback } from 'react';
import type { MaterialImage, SearchResult, ImageFeatures } from './types';
import { getAllImages, deleteImage, getImageCount } from './utils/db';
import { extractFeatures, loadImageAsImageData } from './utils/imageFeatures';
import { searchImages } from './utils/similarity';
import Header from './components/Header';
import ImageGrid from './components/ImageGrid';
import UploadModal from './components/UploadModal';
import SearchPanel from './components/SearchPanel';
import ImageDetail from './components/ImageDetail';

export default function App() {
  const [images, setImages] = useState<MaterialImage[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [detailImage, setDetailImage] = useState<MaterialImage | null>(null);
  const [queryImage, setQueryImage] = useState<string | null>(null);
  const [queryFeatures, setQueryFeatures] = useState<ImageFeatures | null>(null);
  const [searching, setSearching] = useState(false);

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

  const handleResetQuery = useCallback(() => {
    setQueryImage(null);
    setQueryFeatures(null);
    setSearchResults([]);
    setSearching(false);
  }, []);

  const handleSelectQueryFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('文件过大，请选择 10MB 以内的图片');
      return;
    }

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setQueryImage(dataUrl);
    setSearching(true);
    try {
      const { imageData } = await loadImageAsImageData(dataUrl);
      const features = extractFeatures(imageData);
      setQueryFeatures(features);

      const results = images.length > 0 ? searchImages(features, images, { color: 0.5, texture: 0.5 }, 12) : [];
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to analyze image:', err);
      alert('图片分析失败，请换一张图片重试');
      handleResetQuery();
    }
    setSearching(false);
  }, [images, handleResetQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Header
        imageCount={imageCount}
        onOpenLibrary={() => setShowUpload(true)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-6">
          <SearchPanel
            library={images}
            queryImage={queryImage}
            queryFeatures={queryFeatures}
            searching={searching}
            resultCount={searchResults.length}
            onSelectFile={handleSelectQueryFile}
            onReset={handleResetQuery}
          />

          {queryImage && (
            <ImageGrid
              searchResults={searchResults}
              onView={setDetailImage}
              emptyMessage={searching ? '分析中...' : '暂无匹配'}
              emptySubMessage={images.length === 0 ? '请先点击右上角设置按钮上传素材到资源库' : '换一张图片试试'}
            />
          )}

          {!queryImage && images.length > 0 && (
            <div className="mt-10">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">素材库</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1">已收录 {images.length} 张素材（点击右上角可继续上传）</div>
                </div>
              </div>
              <ImageGrid images={images.slice(0, 8)} onDelete={handleDelete} onView={setDetailImage} />
            </div>
          )}
        </div>
      </main>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadImages} />
      <ImageDetail image={detailImage} onClose={() => setDetailImage(null)} />
    </div>
  );
}
