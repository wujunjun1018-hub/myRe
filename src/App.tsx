import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const queryInputRef = useRef<HTMLInputElement>(null);

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

  const quickStats = useMemo(() => {
    if (!queryFeatures) return null;
    return {
      edge: Math.round(queryFeatures.textureFeatures.edgeDensity * 100),
      contrast: Math.round(queryFeatures.textureFeatures.contrast * 100),
      regularity: Math.round(queryFeatures.textureFeatures.regularity * 100),
      colors: queryFeatures.colorHistogram.dominantColors.slice(0, 5),
    };
  }, [queryFeatures]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Header
        imageCount={imageCount}
        onOpenLibrary={() => setShowUpload(true)}
      />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {!queryImage && (
            <SearchPanel
              library={images}
              searching={searching}
              onSelectFile={handleSelectQueryFile}
            />
          )}

          {queryImage && (
            <div className="animate-fade-in">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${searching ? 'bg-[var(--color-primary)] animate-pulse' : 'bg-[var(--color-success)]'}`} />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {searching ? '分析中...' : `找到 ${searchResults.length} 个结果`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => queryInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
                  >
                    重新上传
                  </button>
                  <button
                    type="button"
                    onClick={handleResetQuery}
                    className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
                  >
                    返回
                  </button>
                  <input
                    ref={queryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleSelectQueryFile(file);
                    }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                {/* Sidebar - Query Image */}
                <aside className="space-y-4">
                  <div className="bg-[var(--color-surface)] rounded-xl p-3">
                    <div className="text-xs text-[var(--color-text-tertiary)] mb-2">查询图片</div>
                    <div className="rounded-lg overflow-hidden bg-[var(--color-surface-elevated)]">
                      <img src={queryImage} alt="查询图" className="w-full aspect-square object-cover" />
                    </div>
                  </div>

                  {quickStats && (
                    <div className="bg-[var(--color-surface)] rounded-xl p-3 space-y-3">
                      <div className="text-xs text-[var(--color-text-tertiary)]">图片特征</div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-[var(--color-text)]">{quickStats.edge}%</div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">边缘</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-[var(--color-text)]">{quickStats.contrast}%</div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">对比</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-[var(--color-text)]">{quickStats.regularity}%</div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">规律</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1.5">主色调</div>
                        <div className="flex rounded-md overflow-hidden h-4">
                          {quickStats.colors.map((c, i) => (
                            <div
                              key={i}
                              className="flex-1"
                              style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </aside>

                {/* Results */}
                <div>
                  <div className="mb-4">
                    <h2 className="text-base font-medium text-[var(--color-text)]">匹配结果</h2>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">按相似度排序</p>
                  </div>
                  <ImageGrid
                    searchResults={searchResults}
                    loading={searching}
                    onView={setDetailImage}
                    emptyMessage={searching ? '分析中...' : '暂无匹配'}
                    emptySubMessage={images.length === 0 ? '请先上传素材到素材库' : '换一张图片试试'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Library Section */}
          {!queryImage && images.length > 0 && (
            <div className="mt-16 pt-8 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-medium text-[var(--color-text)]">素材库</h2>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">已收录 {images.length} 个素材</p>
                </div>
              </div>
              <ImageGrid images={images.slice(0, 6)} onDelete={handleDelete} onView={setDetailImage} />
            </div>
          )}
        </div>
      </main>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadImages} />
      <ImageDetail image={detailImage} onClose={() => setDetailImage(null)} />
    </div>
  );
}
