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

  const sampleImages = useMemo(() => library.slice(0, 5), [library]);

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--color-text)] mb-3">
          以图搜图
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm sm:text-base max-w-md mx-auto">
          上传图片，从素材库中查找相似的图片
        </p>
      </div>

      {/* Upload Area */}
      <div className="max-w-xl mx-auto mb-12">
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
          className={`relative rounded-xl cursor-pointer transition-all duration-200 ${
            dragOver 
              ? 'bg-[var(--color-surface-hover)] border-2 border-[var(--color-primary)]' 
              : 'bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <div className="px-8 py-10 text-center">
            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25z" />
              </svg>
            </div>

            <p className="text-[var(--color-text)] font-medium mb-1">
              点击或拖拽图片上传
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              支持 JPG、PNG、WebP，最大 10MB
            </p>

            <button
              type="button"
              className="mt-5 px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              选择文件
            </button>
          </div>

          {/* Loading Overlay */}
          {searching && (
            <div className="absolute inset-0 bg-[var(--color-surface)]/90 rounded-xl flex items-center justify-center">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-[var(--color-text-secondary)]">分析中...</span>
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

      {/* Sample Images */}
      {sampleImages.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-3">素材库预览</p>
          <div className="flex items-center justify-center gap-2">
            {sampleImages.map((img) => (
              <div 
                key={img.id} 
                className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]"
              >
                <img src={img.thumbnail} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
            {library.length > 5 && (
              <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] ring-1 ring-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-text-tertiary)]">
                +{library.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {library.length === 0 && (
        <div className="text-center text-sm text-[var(--color-text-tertiary)]">
          素材库为空，点击右上角上传素材
        </div>
      )}
    </div>
  );
}
