import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { MaterialImage } from '../types';
import { extractFeatures, loadImageAsImageData, createThumbnail } from '../utils/imageFeatures';
import { saveImage } from '../utils/db';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

interface PendingFile {
  file: File;
  preview: string;
  name: string;
}

export default function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ''),
      });
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removePending = (index: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updatePending = (index: number, updates: Partial<PendingFile>) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setProgress(0);

    for (let i = 0; i < pendingFiles.length; i++) {
      const pf = pendingFiles[i];
      try {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(pf.file);
        });

        const { imageData, width, height } = await loadImageAsImageData(dataUrl);
        const features = extractFeatures(imageData);
        const thumbnail = await createThumbnail(dataUrl);

        const id = uuidv4();
        const image: MaterialImage = {
          id,
          name: pf.name,
          tags: [],
          thumbnail,
          blobKey: `blob-${id}`,
          features,
          createdAt: Date.now(),
          width,
          height,
          fileSize: pf.file.size,
        };

        await saveImage(image, pf.file);
      } catch (err) {
        console.error('Failed to process image:', pf.name, err);
      }
      setProgress(((i + 1) / pendingFiles.length) * 100);
    }

    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    setUploading(false);
    setProgress(0);
    onUploaded();
    onClose();
  };

  const handleClose = () => {
    if (uploading) return;
    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={handleClose}>
      <div
        className="bg-[var(--color-bg)] rounded-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-base font-medium text-[var(--color-text)]">管理素材</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-[var(--color-surface)] ${
              dragOver
                ? 'border-[var(--color-primary)] bg-[var(--color-surface-hover)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text)]">拖拽图片到此处，或点击选择</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">支持 JPG、PNG、WebP</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">待上传 ({pendingFiles.length})</span>
              </div>
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-[var(--color-surface)] rounded-lg">
                  <img src={pf.preview} alt="" className="w-10 h-10 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={pf.name}
                      onChange={(e) => updatePending(idx, { name: e.target.value })}
                      className="w-full text-sm bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <button
                    onClick={() => removePending(idx)}
                    className="w-7 h-7 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="mt-4 p-3 bg-[var(--color-surface)] rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--color-text-secondary)]">处理中...</span>
                <span className="text-[var(--color-text)]">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || pendingFiles.length === 0}
            className="px-4 py-2 text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
      </div>
    </div>
  );
}
