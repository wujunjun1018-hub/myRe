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
    <div className="card-premium mb-8 overflow-hidden animate-slide-up">
      {/* Top accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-light)] to-[var(--color-accent)]" />

      <div className="p-7">
        <div className="flex gap-7">
          {/* Query image */}
          <div className="shrink-0">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`w-56 h-56 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative ${
                dragOver
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] scale-[1.02]'
                  : queryImage
                    ? 'border-[var(--color-border-dark)] bg-[var(--color-bg-warm)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg)]'
              }`}
            >
              {queryImage ? (
                <>
                  <img src={queryImage} alt="查询图片" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
                    <span className="text-white text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                      更换图片
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary-bg)] to-[var(--color-bg-warm)] flex items-center justify-center mx-auto mb-3 border border-[var(--color-border-light)]">
                    <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--color-text)]">拖入或点击上传</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">选择一张材质图片</p>
                </div>
              )}
              {searching && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[13px] font-medium text-[var(--color-primary)]">特征分析中...</span>
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
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              匹配权重
            </h3>

            <div className="space-y-4">
              {/* Color weight */}
              <div className="bg-[var(--color-surface-hover)] rounded-xl p-4 border border-[var(--color-border-light)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#C8956C] shadow-sm" />
                    <label className="text-[13px] font-medium text-[var(--color-text)]">色彩权重</label>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--color-primary)] tabular-nums bg-[var(--color-primary-bg)] px-2.5 py-0.5 rounded-lg">
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
              <div className="bg-[var(--color-surface-hover)] rounded-xl p-4 border border-[var(--color-border-light)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] shadow-sm" />
                    <label className="text-[13px] font-medium text-[var(--color-text)]">纹理权重</label>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--color-accent)] tabular-nums bg-[var(--color-accent-bg)] px-2.5 py-0.5 rounded-lg">
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
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 p-3.5 bg-[var(--color-bg-warm)] rounded-xl border border-[var(--color-border-light)] animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">主色调</span>
                  <div className="flex items-center">
                    {queryFeatures.colorHistogram.dominantColors.slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 first:rounded-l-md last:rounded-r-md border border-white/50 shadow-sm -ml-px first:ml-0"
                        style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-px h-4 bg-[var(--color-border)]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">纹理密度</span>
                  <span className="text-[11px] font-bold text-[var(--color-accent)]">
                    {Math.round(queryFeatures.textureFeatures.edgeDensity * 100)}%
                  </span>
                </div>
                <div className="w-px h-4 bg-[var(--color-border)]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">对比度</span>
                  <span className="text-[11px] font-bold text-[var(--color-accent)]">
                    {Math.round(queryFeatures.textureFeatures.contrast * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleSearch}
                disabled={!queryFeatures || library.length === 0 || searching}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-[13px] font-semibold rounded-xl shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.97] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {searching ? '搜索中...' : '搜索匹配'}
              </button>
              {queryImage && (
                <button
                  onClick={() => { setQueryImage(null); setQueryFeatures(null); onResults([]); }}
                  className="px-4 py-2.5 text-[13px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 rounded-xl transition-all"
                >
                  清除
                </button>
              )}
              {library.length === 0 && (
                <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1.5 ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  请先上传素材到资源库
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
