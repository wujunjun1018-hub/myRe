import { useMemo, useRef, useState } from 'react';
import type { ImageFeatures, MaterialImage } from '../types';

interface SearchPanelProps {
  library: MaterialImage[];
  queryImage: string | null;
  queryFeatures: ImageFeatures | null;
  searching: boolean;
  resultCount: number;
  onSelectFile: (file: File) => void;
  onReset: () => void;
}

function classifyFeatures(features: ImageFeatures | null): string {
  if (!features) return '';
  const edge = features.textureFeatures.edgeDensity;
  const contrast = features.textureFeatures.contrast;
  const avg = features.avgColor;

  const brightness = (avg[0] + avg[1] + avg[2]) / 3;
  const tone = brightness > 180 ? '明亮' : brightness < 85 ? '偏暗' : '柔和';

  const structure = edge > 0.22 ? '结构清晰' : edge > 0.13 ? '结构适中' : '结构平滑';
  const c = contrast > 0.55 ? '高对比' : contrast > 0.35 ? '中对比' : '低对比';

  return `特征提取：${tone}、${structure}、${c}`;
}

export default function SearchPanel({
  library,
  queryImage,
  queryFeatures,
  searching,
  resultCount,
  onSelectFile,
  onReset,
}: SearchPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const featureLine = useMemo(() => classifyFeatures(queryFeatures), [queryFeatures]);

  const sampleImages = useMemo(() => library.slice(0, 3), [library]);

  return (
    <div className="animate-slide-up">
      {!queryImage ? (
        <section className="text-center pt-14 pb-10">
          <h2 className="text-[44px] leading-[1.05] font-extrabold tracking-tight text-[var(--color-text)]">
            发现视觉相似的<span className="gradient-text">新世界</span>
          </h2>
          <p className="max-w-2xl mx-auto mt-4 text-sm sm:text-base text-[var(--color-text-secondary)]">
            上传一张图片，我们的 AI 引擎将分析其核心特征，并在海量图库中为您精准匹配出
            相似度最高的 12 张结果。
          </p>

          <div className="max-w-[660px] mx-auto mt-10">
            <div
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith('image/')) onSelectFile(file);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-[28px] border border-dashed px-8 py-14 cursor-pointer transition-all shadow-[var(--shadow-lg)] overflow-hidden ${
                dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(600px 260px at 50% 30%, rgba(59,130,246,0.18), transparent 55%)' }} />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="mt-6 text-base font-semibold text-[var(--color-text)]">点击或拖拽图片至此</p>
                <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">支持 JPG, PNG, WEBP (最大 10MB)</p>
                <button
                  type="button"
                  className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm font-semibold shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all active:scale-[0.98]"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  选择文件
                </button>
              </div>

              {searching && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[var(--color-text)]">
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
                if (file) onSelectFile(file);
              }}
            />
          </div>

          <div className="mt-12">
            <div className="text-xs text-[var(--color-text-tertiary)]">看看别人找到了什么</div>
            <div className="mt-3 flex items-center justify-center gap-3">
              {sampleImages.map((img) => (
                <div key={img.id} className="w-14 h-14 rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
                  <img src={img.thumbnail} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
              <div className="w-14 h-14 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-xs text-[var(--color-text-tertiary)]">
                +更多
              </div>
            </div>
            {library.length === 0 && (
              <div className="mt-4 text-xs text-[var(--color-text-tertiary)]">提示：先点击右上角设置按钮上传一些素材，搜索才会有结果。</div>
            )}
          </div>
        </section>
      ) : (
        <section className="mb-5">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--color-border)] bg-black/20 shrink-0">
                <img src={queryImage} alt="Source" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-wide text-[var(--color-text-tertiary)]">SOURCE IMAGE</div>
                <div className="mt-1 text-xs text-[var(--color-text-secondary)] truncate">{featureLine}</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm font-semibold shrink-0">
              {searching ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[var(--color-text-secondary)]">分析中...</span>
                </>
              ) : (
                <>
                  <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300">匹配完成：找到 {resultCount} 个结果</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface)] text-[var(--color-text)] text-sm font-semibold transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0112.5-5.303M20.25 12a7.5 7.5 0 01-12.5 5.303" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 6.75V3m0 3.75h-3.75" />
              </svg>
              重新上传
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                onReset();
                onSelectFile(file);
              }}
            />
          </div>

          <div className="md:hidden mt-3 flex items-center gap-2 text-xs font-semibold">
            {searching ? (
              <>
                <svg className="w-4 h-4 animate-spin text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[var(--color-text-secondary)]">分析中...</span>
              </>
            ) : (
              <>
                <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300">匹配完成：找到 {resultCount} 个结果</span>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
