import { useState, useEffect } from 'react';
import type { MaterialImage } from '../types';
import { getImageBlob } from '../utils/db';

interface ImageDetailProps {
  image: MaterialImage | null;
  onClose: () => void;
}

export default function ImageDetail({ image, onClose }: ImageDetailProps) {
  const [fullUrl, setFullUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setFullUrl(null);
      return;
    }
    let revoked = false;
    getImageBlob(image.blobKey).then((blob) => {
      if (blob && !revoked) {
        setFullUrl(URL.createObjectURL(blob));
      }
    });
    return () => {
      revoked = true;
      if (fullUrl) URL.revokeObjectURL(fullUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  if (!image) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const textureFeatures = [
    { label: '边缘密度', value: image.features.textureFeatures.edgeDensity, color: 'from-[var(--color-primary)] to-[var(--color-primary-light)]' },
    { label: '粗糙度', value: image.features.textureFeatures.coarseness, color: 'from-[#D4A24C] to-[#C8956C]' },
    { label: '对比度', value: image.features.textureFeatures.contrast, color: 'from-[var(--color-accent)] to-[var(--color-accent-light)]' },
    { label: '规律性', value: image.features.textureFeatures.regularity, color: 'from-[var(--color-success)] to-[#7DB68A]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-[var(--shadow-xl)] max-w-5xl max-h-[90vh] w-full mx-4 overflow-hidden flex animate-scale-in border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 bg-[var(--color-bg-warm)] flex items-center justify-center min-w-0 p-5 relative">
          <img
            src={fullUrl ?? image.thumbnail}
            alt={image.name}
            className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-[var(--shadow-lg)]"
          />
        </div>

        {/* Info sidebar */}
        <div className="w-[340px] shrink-0 border-l border-[var(--color-border)] flex flex-col bg-white">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[var(--color-border-light)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold text-[var(--color-text)] truncate">{image.name}</h2>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
                  {new Date(image.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* File info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '尺寸', value: `${image.width} x ${image.height}` },
                { label: '大小', value: formatSize(image.fileSize) },
              ].map((item) => (
                <div key={item.label} className="bg-[var(--color-surface-hover)] rounded-xl p-3.5 border border-[var(--color-border-light)]">
                  <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider block">{item.label}</span>
                  <span className="text-[13px] font-semibold text-[var(--color-text)] mt-1 block">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Color analysis */}
            <div>
              <h3 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#C8956C]" />
                色彩分析
              </h3>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-xs)]"
                    style={{ backgroundColor: `rgb(${image.features.avgColor.join(',')})` }}
                  />
                  <div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] block">平均颜色</span>
                    <span className="text-[12px] font-mono font-semibold text-[var(--color-text)]">
                      RGB({image.features.avgColor.join(', ')})
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] mb-2 block">主要色调</span>
                  <div className="flex items-center gap-0 rounded-xl overflow-hidden shadow-[var(--shadow-xs)]">
                    {image.features.colorHistogram.dominantColors.map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 h-9 border-r border-white/20 last:border-r-0"
                        style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                        title={`HSL(${Math.round(c[0])}, ${Math.round(c[1] * 100)}%, ${Math.round(c[2] * 100)}%)`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Texture analysis */}
            <div>
              <h3 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)]" />
                纹理特征
              </h3>
              <div className="space-y-3">
                {textureFeatures.map((feat) => (
                  <div key={feat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-[var(--color-text-secondary)]">{feat.label}</span>
                      <span className="text-[12px] font-bold text-[var(--color-text)] tabular-nums">{Math.round(feat.value * 100)}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-border-light)] rounded-full h-[6px] overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${feat.color} rounded-full transition-all duration-700`}
                        style={{ width: `${feat.value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
