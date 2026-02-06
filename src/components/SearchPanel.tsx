import { useMemo, useRef, useState } from 'react';
import type { MaterialImage } from '../types';

interface SearchPanelProps {
  library: MaterialImage[];
  searching: boolean;
  onSelectFile: (file: File) => void;
}

export default function SearchPanel({ library, searching, onSelectFile }: SearchPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleImages = useMemo(() => library.slice(0, 4), [library]);

  return (
    <section className="text-center pt-12 pb-10 animate-slide-up">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-[42px] sm:text-[52px] leading-[1.04] font-extrabold tracking-tight text-[var(--color-text)]">
          发现视觉相似的
          <span className="gradient-text"> 新世界</span>
        </h2>
        <p className="mt-5 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          上传一张图片，系统会自动分析颜色与纹理特征，并从素材库中返回最相近的 12 个结果。
        </p>
      </div>

      <div className="max-w-3xl mx-auto mt-10">
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
          className={`relative rounded-[30px] border border-dashed px-8 py-16 cursor-pointer transition-all shadow-[var(--shadow-lg)] overflow-hidden ${
            dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{ background: 'radial-gradient(620px 280px at 50% 28%, rgba(59,130,246,0.16), transparent 58%)' }}
          />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="mt-6 text-xl font-semibold text-[var(--color-text)]">拖拽图片到此处，或点击上传</p>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">支持 JPG / PNG / WEBP，单图最大 10MB</p>

            <button
              type="button"
              className="mt-7 inline-flex items-center justify-center px-7 py-2.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm font-semibold shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all active:scale-[0.98]"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              选择图片
            </button>
          </div>

          {searching && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-medium">正在分析图片...</span>
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
        <div className="text-xs text-[var(--color-text-tertiary)]">最近加入的素材预览</div>
        <div className="mt-3 flex items-center justify-center gap-3">
          {sampleImages.map((img) => (
            <div key={img.id} className="w-16 h-16 rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              <img src={img.thumbnail} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
          <div className="w-16 h-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-xs text-[var(--color-text-tertiary)]">
            +更多
          </div>
        </div>
        {library.length === 0 && (
          <div className="mt-4 text-xs text-[var(--color-text-tertiary)]">
            还没有素材，先点右上角设置按钮上传几张图库图片。
          </div>
        )}
      </div>
    </section>
  );
}
