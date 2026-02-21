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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-[var(--color-bg)] rounded-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden flex flex-col sm:flex-row animate-scale-in border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 bg-[var(--color-surface)] flex items-center justify-center min-h-[300px] sm:min-h-0 p-4">
          <img
            src={fullUrl ?? image.thumbnail}
            alt={image.name}
            className="max-w-full max-h-[50vh] sm:max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Info sidebar */}
        <div className="w-full sm:w-72 shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--color-border)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-medium text-[var(--color-text)] truncate pr-4">{image.name}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Basic info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">尺寸</span>
                <span className="text-[var(--color-text)]">{image.width} × {image.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">大小</span>
                <span className="text-[var(--color-text)]">{formatSize(image.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">上传时间</span>
                <span className="text-[var(--color-text)]">{new Date(image.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            {/* Color palette */}
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)] mb-2">主色调</div>
              <div className="flex rounded-lg overflow-hidden h-8">
                {image.features.colorHistogram.dominantColors.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: `hsl(${c[0]}, ${c[1] * 100}%, ${c[2] * 100}%)` }}
                  />
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)] mb-2">纹理特征</div>
              <div className="space-y-2">
                {[
                  { label: '边缘密度', value: image.features.textureFeatures.edgeDensity },
                  { label: '对比度', value: image.features.textureFeatures.contrast },
                  { label: '规律性', value: image.features.textureFeatures.regularity },
                ].map((feat) => (
                  <div key={feat.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">{feat.label}</span>
                      <span className="text-[var(--color-text)]">{Math.round(feat.value * 100)}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${feat.value * 100}%` }} />
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
