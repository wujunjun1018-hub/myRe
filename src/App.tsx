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

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
          {!queryImage && (
            <SearchPanel
              library={images}
              searching={searching}
              onSelectFile={handleSelectQueryFile}
            />
          )}

          {queryImage && (
            <section className="space-y-5 sm:space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-md)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {searching ? '正在分析图片特征...' : `匹配完成，找到 ${searchResults.length} 个结果`}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => queryInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all flex-1 sm:flex-none"
                  >
                    重新上传
                  </button>
                  <button
                    type="button"
                    onClick={handleResetQuery}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all flex-1 sm:flex-none"
                  >
                    重新开始
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

              <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5 sm:gap-6 items-start">
                <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] xl:sticky xl:top-24">
                  <div className="text-[11px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">SOURCE IMAGE</div>
                  <div className="mt-3 rounded-xl overflow-hidden border border-[var(--color-border)] bg-black/20">
                    <img src={queryImage} alt="查询图" className="w-full aspect-square object-cover" />
                  </div>
                  {quickStats && (
                    <>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-[var(--color-border)] bg-black/15 p-2 text-center">
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">边缘</div>
                          <div className="text-sm font-semibold text-[var(--color-text)] mt-0.5">{quickStats.edge}%</div>
                        </div>
                        <div className="rounded-lg border border-[var(--color-border)] bg-black/15 p-2 text-center">
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">对比</div>
                          <div className="text-sm font-semibold text-[var(--color-text)] mt-0.5">{quickStats.contrast}%</div>
                        </div>
                        <div className="rounded-lg border border-[var(--color-border)] bg-black/15 p-2 text-center">
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">规律</div>
                          <div className="text-sm font-semibold text-[var(--color-text)] mt-0.5">{quickStats.regularity}%</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-[11px] text-[var(--color-text-tertiary)] mb-2">主色调</div>
                        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
                          {quickStats.colors.map((c, i) => (
                            <div
                              key={i}
                              className="h-7 flex-1"
                              style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </aside>

                <div>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">匹配结果</h3>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">按综合相似度排序，优先展示前 12 个结果</p>
                    </div>
                  </div>
                  <ImageGrid
                    searchResults={searchResults}
                    loading={searching}
                    onView={setDetailImage}
                    emptyMessage={searching ? '分析中...' : '暂无匹配'}
                    emptySubMessage={images.length === 0 ? '请先点击右上角设置按钮上传素材到资源库' : '换一张图片试试'}
                  />
                </div>
              </div>
            </section>
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
