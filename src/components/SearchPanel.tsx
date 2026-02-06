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
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6">
      <div className="flex gap-6">
        {/* Query image area */}
        <div className="shrink-0">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`w-48 h-48 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
              queryImage
                ? 'border-[var(--color-primary)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-hover)]'
            }`}
          >
            {queryImage ? (
              <img src={queryImage} alt="查询图片" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <svg className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  拖拽或点击<br />选择查询图片
                </p>
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
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">匹配权重调节</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[var(--color-text-secondary)]">色彩匹配</label>
                  <span className="text-xs font-medium text-[var(--color-text)]">{Math.round(weights.color * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weights.color}
                  onChange={(e) => handleWeightChange('color', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[var(--color-surface-hover)] rounded-full appearance-none cursor-pointer accent-[var(--color-accent)]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[var(--color-text-secondary)]">纹理匹配</label>
                  <span className="text-xs font-medium text-[var(--color-text)]">{Math.round(weights.texture * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weights.texture}
                  onChange={(e) => handleWeightChange('texture', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[var(--color-surface-hover)] rounded-full appearance-none cursor-pointer accent-[var(--color-primary-light)]"
                />
              </div>
            </div>
          </div>

          {/* Feature preview */}
          {queryFeatures && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--color-text-secondary)]">主色调:</span>
                {queryFeatures.colorHistogram.dominantColors.slice(0, 5).map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-[var(--color-border)]"
                    style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                  />
                ))}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                纹理密度: {Math.round(queryFeatures.textureFeatures.edgeDensity * 100)}%
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSearch}
              disabled={!queryFeatures || library.length === 0 || searching}
              className="px-6 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
            >
              {searching ? '搜索中...' : '搜索匹配'}
            </button>
            {queryImage && (
              <button
                onClick={() => {
                  setQueryImage(null);
                  setQueryFeatures(null);
                  onResults([]);
                }}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                清除
              </button>
            )}
            {library.length === 0 && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                请先在资源库中上传素材
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
