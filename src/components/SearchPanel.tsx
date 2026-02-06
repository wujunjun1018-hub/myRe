import { useState, useRef, useCallback } from 'react';
import type { ImageFeatures, SearchWeights, SearchResult, MaterialImage } from '../types';
import { extractFeatures, loadImageAsImageData } from '../utils/imageFeatures';
import { searchImages } from '../utils/similarity';

interface SearchPanelProps {
  library: MaterialImage[];
  onResults: (results: SearchResult[]) => void;
}

export default function SearchPanel({ library, onResults }: SearchPanelProps) {
  const [queryImage, setQueryImage] = useState<string | null>(null);
  const [queryFeatures, setQueryFeatures] = useState<ImageFeatures | null>(null);
  const [weights, setWeights] = useState<SearchWeights>({ color: 0.5, texture: 0.5 });
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(async (file: File) => {
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
      const results = searchImages(features, library, weights, 12);
      onResults(results);
    } catch (err) {
      console.error('Failed to analyze image:', err);
    }
    setSearching(false);
  }, [library, weights, onResults]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handleSearch = useCallback(() => {
    if (!queryFeatures || library.length === 0) return;
    const results = searchImages(queryFeatures, library, weights, 12);
    onResults(results);
  }, [queryFeatures, library, weights, onResults]);

  const handleWeightChange = (key: keyof SearchWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    if (queryFeatures) {
      const results = searchImages(queryFeatures, library, newWeights, 12);
      onResults(results);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-sm)] mb-6 overflow-hidden animate-slide-up">
      <div className="p-6">
        <div className="flex gap-6">
          {/* Query image area */}
          <div className="shrink-0">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`w-52 h-52 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative ${
                dragOver
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] scale-[1.02]'
                  : queryImage
                    ? 'border-[var(--color-primary)]/40 bg-[var(--color-surface-hover)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {queryImage ? (
                <>
                  <img src={queryImage} alt="查询图片" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                      点击更换
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-bg)] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text)]">拖拽或点击上传</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">选择要搜索的图片</p>
                </div>
              )}
              {searching && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium">分析中...</span>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              匹配权重调节
            </h3>

            <div className="space-y-5">
              {/* Color weight */}
              <div className="bg-[var(--color-surface-hover)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                    <label className="text-sm font-medium text-[var(--color-text)]">色彩匹配</label>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary)] tabular-nums bg-[var(--color-primary-bg)] px-2 py-0.5 rounded-md">
                    {Math.round(weights.color * 100)}%
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={weights.color}
                  onChange={(e) => handleWeightChange('color', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Texture weight */}
              <div className="bg-[var(--color-surface-hover)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)]" />
                    <label className="text-sm font-medium text-[var(--color-text)]">纹理匹配</label>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary)] tabular-nums bg-[var(--color-primary-bg)] px-2 py-0.5 rounded-md">
                    {Math.round(weights.texture * 100)}%
                  </span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={weights.texture}
                  onChange={(e) => handleWeightChange('texture', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Feature preview */}
            {queryFeatures && (
              <div className="mt-4 flex items-center gap-4 p-3 bg-[var(--color-surface-hover)] rounded-xl animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">主色调</span>
                  <div className="flex items-center gap-0.5">
                    {queryFeatures.colorHistogram.dominantColors.slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 first:rounded-l-lg last:rounded-r-lg border border-white shadow-sm"
                        style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-px h-5 bg-[var(--color-border)]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">纹理密度</span>
                  <span className="text-xs font-bold text-[var(--color-primary)]">
                    {Math.round(queryFeatures.textureFeatures.edgeDensity * 100)}%
                  </span>
                </div>
                <div className="w-px h-5 bg-[var(--color-border)]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">对比度</span>
                  <span className="text-xs font-bold text-[var(--color-primary)]">
                    {Math.round(queryFeatures.textureFeatures.contrast * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSearch}
                disabled={!queryFeatures || library.length === 0 || searching}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.97] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {searching ? '搜索中...' : '搜索匹配材质'}
              </button>
              {queryImage && (
                <button
                  onClick={() => {
                    setQueryImage(null);
                    setQueryFeatures(null);
                    onResults([]);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-red-50 rounded-xl transition-all"
                >
                  清除
                </button>
              )}
              {library.length === 0 && (
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  请先在资源库中上传素材
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
