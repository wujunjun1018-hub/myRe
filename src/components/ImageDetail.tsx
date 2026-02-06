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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 bg-[var(--color-surface-hover)] flex items-center justify-center min-w-0">
          <img
            src={fullUrl ?? image.thumbnail}
            alt={image.name}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>

        {/* Info sidebar */}
        <div className="w-72 shrink-0 p-5 border-l border-[var(--color-border)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{image.name}</h2>
            <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-[var(--color-text-secondary)]">分类</span>
              <p className="mt-0.5 font-medium">{image.category}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">尺寸</span>
              <p className="mt-0.5 font-medium">{image.width} × {image.height}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">文件大小</span>
              <p className="mt-0.5 font-medium">{formatSize(image.fileSize)}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">上传时间</span>
              <p className="mt-0.5 font-medium">{new Date(image.createdAt).toLocaleString('zh-CN')}</p>
            </div>

            {/* Color info */}
            <div>
              <span className="text-[var(--color-text-secondary)]">平均颜色</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-8 h-8 rounded-lg border border-[var(--color-border)]"
                  style={{ backgroundColor: `rgb(${image.features.avgColor.join(',')})` }}
                />
                <span className="text-xs font-mono">
                  RGB({image.features.avgColor.join(', ')})
                </span>
              </div>
            </div>

            <div>
              <span className="text-[var(--color-text-secondary)]">主要色调</span>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {image.features.colorHistogram.dominantColors.map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-lg border border-[var(--color-border)]"
                    style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                    title={`HSL(${Math.round(c[0])}, ${Math.round(c[1] * 100)}%, ${Math.round(c[2] * 100)}%)`}
                  />
                ))}
              </div>
            </div>

            {/* Texture info */}
            <div>
              <span className="text-[var(--color-text-secondary)]">纹理特征</span>
              <div className="mt-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">边缘密度</span>
                  <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5">
                    <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${image.features.textureFeatures.edgeDensity * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">粗糙度</span>
                  <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5">
                    <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${image.features.textureFeatures.coarseness * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">对比度</span>
                  <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5">
                    <div className="h-full bg-[var(--color-primary-light)] rounded-full" style={{ width: `${image.features.textureFeatures.contrast * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">规律性</span>
                  <div className="flex-1 bg-[var(--color-surface-hover)] rounded-full h-1.5">
                    <div className="h-full bg-[var(--color-primary-dark)] rounded-full" style={{ width: `${image.features.textureFeatures.regularity * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
